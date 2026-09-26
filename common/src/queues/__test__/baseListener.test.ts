/**
 * Characterisation tests: they pin down what BaseListener does *today*, so the
 * tracing changes in ticket 06 can't silently change it. They assert only on
 * calls made to the channel and on what reaches onMessage, never on private fields.
 */
import { Channel, ConsumeMessage } from 'amqplib';
import { BaseListener } from '../baseListener';
import { ExchangeTypes } from '../../types/exchange.types';
import { RoutingKeyTypes } from '../../types/routingKey.types';
import { FakeChannel } from '../../test/fakeChannel';

/**
 * Test-only event shape: which exchange the listener reads from, and what the
 * parsed message data looks like.
 */
interface CartUpdated {
  exchangeName: ExchangeTypes.CartService;
  data: { cartId: string; items: { productId: string; quantity: number }[] };
}

/** The smallest concrete listener. `listen()` is inherited, and it's what we test. */
class CartUpdatedListener extends BaseListener<CartUpdated> {
  exchangeName: ExchangeTypes.CartService = ExchangeTypes.CartService;
  routingKey = RoutingKeyTypes.CartUpdated;
  /**
   * Instead of real handling logic, onMessage is a Jest mock function that
   * records every call and its arguments. The generics type it like the abstract
   * signature: jest.fn<ReturnType, [ArgumentTypes]>.
   */
  onMessage = jest.fn<void, [CartUpdated['data'], Channel, ConsumeMessage]>();
}

/** Sample message body used by the delivery test. */
const data = { cartId: 'c-1', items: [{ productId: 'p-1', quantity: 2 }] };

describe('BaseListener', () => {
  let fake: FakeChannel;
  let listener: CartUpdatedListener;

  /**
   * Every test needs a listener that has already started, so do that once here.
   * After `await listener.listen()` the fake has recorded all the setup calls
   * and holds the consumer callback, ready for `fake.deliver()`.
   */
  beforeEach(async () => {
    /** listen() logs each received message. Silence it; restoreMocks undoes it after each test. */
    jest.spyOn(console, 'log').mockImplementation(() => { });
    fake = new FakeChannel();
    listener = new CartUpdatedListener(fake.asChannel());
    await listener.listen();
  });

  it('asserts a durable direct exchange named after the event', () => {
    /**
     * The listener declares the exchange too, not just the publisher. Whichever
     * service starts first creates it, so startup order doesn't matter.
     */
    expect(fake.assertedExchanges).toEqual([
      { exchange: 'cart-service', type: 'direct', options: { durable: true } },
    ]);
  });

  it('asserts a durable queue named after the routing key', () => {
    /**
     * Queue name = routing key, so every listener process for 'cart-updated'
     * shares one queue. RabbitMQ then spreads messages across them (competing
     * consumers) rather than giving each process a copy.
     */
    expect(fake.assertedQueues).toEqual([{ queue: 'cart-updated', options: { durable: true } }]);
  });

  it('binds the queue to the exchange with the routing key', () => {
    /**
     * Without a binding, the direct exchange has nowhere to route messages,
     * and they're dropped.
     */
    expect(fake.bindings).toEqual([
      { queue: 'cart-updated', exchange: 'cart-service', pattern: 'cart-updated' },
    ]);
  });

  it('sets prefetch to 1', () => {
    /**
     * Only one unacknowledged message at a time: the next isn't delivered until
     * the current one is acked. Slow but ordered, and fair across consumers.
     */
    expect(fake.prefetchCount).toBe(1);
  });

  it('consumes the queue with manual acknowledgement', () => {
    /**
     * noAck: false means RabbitMQ keeps the message until onMessage explicitly
     * calls channel.ack(msg). If the process crashes first, the message is redelivered.
     */
    expect(fake.consumerOptions('cart-updated')).toEqual({ noAck: false });
  });

  it('parses the JSON body and hands it to onMessage with the channel and raw message', async () => {
    /**
     * Simulate RabbitMQ delivering a message. deliver() JSON-encodes `data`
     * into a Buffer, just as BasePublisher would have.
     */
    const msg = await fake.deliver('cart-updated', data);

    expect(listener.onMessage).toHaveBeenCalledTimes(1);
    /** mock.calls[0] holds the arguments of the first call: (data, channel, msg). */
    const [parsed, channel, raw] = listener.onMessage.mock.calls[0];
    /** toEqual: the listener turned the bytes back into an equal object. */
    expect(parsed).toEqual(data);
    /** toBe (same object): the handler gets the listener's own channel, so it can ack on it... */
    expect(channel).toBe(fake.asChannel());
    /** ...and the untouched raw message, which is what channel.ack() needs. */
    expect(raw).toBe(msg);
  });

  it('ignores a null delivery (consumer cancelled by the broker)', async () => {
    /**
     * amqplib passes null when RabbitMQ cancels the consumer (e.g. the queue was
     * deleted). The listener must not crash or call onMessage with garbage.
     */
    await fake.cancel('cart-updated');

    expect(listener.onMessage).not.toHaveBeenCalled();
  });
});
