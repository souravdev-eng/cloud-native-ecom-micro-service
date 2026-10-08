import { Channel, ConsumeMessage, MessageProperties, Options } from 'amqplib';

/**
 * The function a consumer registers with `channel.consume()`. amqplib calls it
 * with each incoming message, or with `null` when the broker cancels the consumer.
 */
type ConsumeCallback = (msg: ConsumeMessage | null) => unknown;

/**
 * Real RabbitMQ gives every consumer a unique "consumer tag" so it can be
 * cancelled later. We don't need uniqueness, just a stable, readable value.
 */
const consumerTag = (queue: string) => `fake-consumer-${queue}`;

/**
 * Record types: one entry is stored per call, so tests can assert on exactly
 * what the code under test asked the channel to do.
 */

/** One `assertExchange()` call. An exchange is the "post office" messages are sent to. */
export interface AssertedExchange {
  exchange: string;
  /** Exchange type. 'direct' routes to the queues whose binding key equals the routing key exactly. */
  type: string;
  options?: Options.AssertExchange;
}

/** One `assertQueue()` call. "Assert" means create it if missing, otherwise just check it exists. */
export interface AssertedQueue {
  queue: string;
  options?: Options.AssertQueue;
}

/** One `bindQueue()` call: "send messages from `exchange` with key `pattern` into `queue`". */
export interface Binding {
  queue: string;
  exchange: string;
  pattern: string;
}

/** One `publish()` call. `content` is the raw bytes that would go over the wire. */
export interface PublishedMessage {
  exchange: string;
  routingKey: string;
  content: Buffer;
  /** Publish options, e.g. { persistent: true }, and later AMQP headers such as traceparent. */
  options?: Options.Publish;
}

/**
 * In-memory stand-in for an amqplib Channel. It implements only the methods
 * the queue base classes call, records every call, and lets a test push a
 * message to a registered consumer with `deliver()`.
 *
 * There's no real broker: nothing is routed or stored. That keeps tests fast
 * and hermetic, and lets them assert on "what did the code ask RabbitMQ to do?"
 * instead of on the private fields of BasePublisher / BaseListener.
 */
export class FakeChannel {
  /** Names of channel methods in the order they were called, e.g. ['assertExchange', 'publish']. */
  readonly calls: string[] = [];
  readonly assertedExchanges: AssertedExchange[] = [];
  readonly assertedQueues: AssertedQueue[] = [];
  readonly bindings: Binding[] = [];
  readonly published: PublishedMessage[] = [];
  /** Last value passed to `prefetch()`, or undefined if it was never called. */
  prefetchCount: number | undefined;

  /**
   * Queue name → the callback (and options) registered via `consume()`.
   * `deliver()` looks the callback up here to simulate an incoming message.
   */
  private readonly consumers = new Map<string, { onMessage: ConsumeCallback; options?: Options.Consume }>();
  /** RabbitMQ numbers each delivery on a channel 1, 2, 3…; ack/nack use this number. */
  private deliveryTag = 0;

  /**
   * Returns this fake typed as a real amqplib `Channel`, so it can be passed to
   * `new SomePublisher(channel)`. The double cast (`as unknown as`) is needed
   * because the fake deliberately doesn't implement the whole Channel interface.
   * It's safe as long as the code under test only calls the methods below.
   * The same object is returned every time, so `toBe(fake.asChannel())` works.
   */
  asChannel(): Channel {
    return this as unknown as Channel;
  }

  /**
   * Setup methods. Each records the call and returns the minimal shape
   * amqplib would resolve with, so callers that read the result keep working.
   */

  async assertExchange(exchange: string, type: string, options?: Options.AssertExchange) {
    this.calls.push('assertExchange');
    this.assertedExchanges.push({ exchange, type, options });
    return { exchange };
  }

  async assertQueue(queue: string, options?: Options.AssertQueue) {
    this.calls.push('assertQueue');
    this.assertedQueues.push({ queue, options });
    /** BaseListener reads `.queue` from this result to know which queue to bind and consume. */
    return { queue, messageCount: 0, consumerCount: 0 };
  }

  async bindQueue(queue: string, exchange: string, pattern: string) {
    this.calls.push('bindQueue');
    this.bindings.push({ queue, exchange, pattern });
    return {};
  }

  /** prefetch(n) = "don't send this consumer more than n unacknowledged messages at a time". */
  async prefetch(count: number) {
    this.calls.push('prefetch');
    this.prefetchCount = count;
    return {};
  }

  /**
   * Unlike the others, amqplib's `publish()` is synchronous and returns a boolean
   * (false means "write buffer full, back off"). We always report success.
   */
  publish(exchange: string, routingKey: string, content: Buffer, options?: Options.Publish): boolean {
    this.calls.push('publish');
    this.published.push({ exchange, routingKey, content, options });
    return true;
  }

  /**
   * Store the callback instead of starting a real consumer. Nothing arrives
   * until a test calls `deliver()`.
   */
  async consume(queue: string, onMessage: ConsumeCallback, options?: Options.Consume) {
    this.calls.push('consume');
    this.consumers.set(queue, { onMessage, options });
    return { consumerTag: consumerTag(queue) };
  }

  /**
   * No-ops for now, so a listener that acks/nacks doesn't crash.
   * Later tickets can make them record calls if tests need to observe the outcome.
   */
  ack(): void {}

  nack(): void {}

  /** Test-only helpers. These are not part of the amqplib Channel API. */

  /** Options the consumer on `queue` was registered with, e.g. { noAck: false }. */
  consumerOptions(queue: string): Options.Consume | undefined {
    return this.consumer(queue).options;
  }

  /**
   * Delivers `payload` to the consumer on `queue` and waits for its callback.
   * A Buffer is sent as-is; anything else is JSON-encoded, as BasePublisher does.
   * Unlike amqplib, an error thrown by the consumer rejects this promise.
   *
   * `properties` lets a test set message properties such as AMQP headers.
   * Returns the message it built, so a test can check that the exact object
   * reached `onMessage`.
   */
  async deliver(
    queue: string,
    payload: unknown,
    properties: Partial<MessageProperties> = {}
  ): Promise<ConsumeMessage> {
    const content = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
    /**
     * A ConsumeMessage has three parts: `content` (the body bytes), `fields`
     * (delivery info from the broker) and `properties` (publisher metadata, incl. headers).
     */
    const msg: ConsumeMessage = {
      content,
      fields: {
        deliveryTag: ++this.deliveryTag,
        /** True would mean "this was delivered before but not acked". */
        redelivered: false,
        exchange: '',
        /** Only correct here because BaseListener names each queue after its routing key. */
        routingKey: queue,
        consumerTag: consumerTag(queue),
      },
      /**
       * `headers: {}` is the default so code that reads msg.properties.headers never hits undefined.
       * The cast is needed because we only fill in the properties a test cares about.
       */
      properties: { headers: {}, ...properties } as MessageProperties,
    };
    /**
     * Awaiting means the test only continues once the listener's callback has
     * finished, so assertions don't race the handler.
     */
    await this.consumer(queue).onMessage(msg);
    return msg;
  }

  /** Simulates the broker cancelling the consumer, which amqplib signals with a null message. */
  async cancel(queue: string): Promise<void> {
    await this.consumer(queue).onMessage(null);
  }

  /**
   * Fails loudly if a test delivers to a queue nobody consumes. That usually
   * means a typo, or the test forgot to call `listen()` first.
   */
  private consumer(queue: string) {
    const consumer = this.consumers.get(queue);
    if (!consumer) {
      throw new Error(`FakeChannel: no consumer registered on queue "${queue}"`);
    }
    return consumer;
  }
}
