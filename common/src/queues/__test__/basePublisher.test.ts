/**
 * Characterisation tests: they pin down what BasePublisher does *today*, so the
 * tracing changes in ticket 06 can't silently change it. If one of these fails
 * after a change, either the change is a regression or the test needs a
 * deliberate update.
 */
import { BasePublisher } from '../basePublisher';
import { ExchangeTypes } from '../../types/exchange.types';
import { RoutingKeyTypes } from '../../types/routingKey.types';
import { FakeChannel } from '../../test/fakeChannel';

/**
 * BasePublisher is abstract and generic over an "event" shape: which exchange
 * it goes to, and what the data looks like. This test-only event plays that role.
 */
interface ProductCreated {
  exchangeName: ExchangeTypes.ProductService;
  data: { id: string; title: string; price: number };
}

/**
 * The smallest concrete publisher: a subclass only has to say which exchange
 * and routing key to use. `publish()` itself is inherited, and it's what we test.
 */
class ProductCreatedPublisher extends BasePublisher<ProductCreated> {
  /**
   * The explicit enum-member type narrows the field to exactly this value,
   * matching `T['exchangeName']` in the abstract declaration.
   */
  exchangeName: ExchangeTypes.ProductService = ExchangeTypes.ProductService;
  routingKey = RoutingKeyTypes.ProductCreated;
}

/** Sample payload shared by every test. */
const data = { id: 'p-1', title: 'Shirt', price: 42 };

describe('BasePublisher', () => {
  let fake: FakeChannel;

  beforeEach(() => {
    /**
     * publish() logs every message with console.log. Silence it so test output
     * stays readable. `restoreMocks: true` in jest.config.js undoes this after each test.
     */
    jest.spyOn(console, 'log').mockImplementation(() => {});
    /** A fresh fake per test, so recorded calls never leak between tests. */
    fake = new FakeChannel();
  });

  it('asserts a durable direct exchange named after the event', async () => {
    await new ProductCreatedPublisher(fake.asChannel()).publish(data);

    /**
     * durable: the exchange survives a RabbitMQ restart.
     * direct: routing is an exact match on the routing key.
     */
    expect(fake.assertedExchanges).toEqual([
      { exchange: 'product-service', type: 'direct', options: { durable: true } },
    ]);
  });

  it('publishes the data as a JSON buffer to the exchange with the routing key', async () => {
    await new ProductCreatedPublisher(fake.asChannel()).publish(data);

    expect(fake.published).toHaveLength(1);
    const [message] = fake.published;
    expect(message.exchange).toBe('product-service');
    expect(message.routingKey).toBe('product-created');
    /** AMQP carries raw bytes, so the payload must be a Buffer... */
    expect(Buffer.isBuffer(message.content)).toBe(true);
    /**
     * ...and decoding those bytes as JSON must give back the original object.
     * This is the contract BaseListener relies on when it JSON.parses the body.
     */
    expect(JSON.parse(message.content.toString())).toEqual(data);
  });

  it('marks the message as persistent', async () => {
    await new ProductCreatedPublisher(fake.asChannel()).publish(data);

    /**
     * persistent: RabbitMQ writes the message to disk, so it survives a broker
     * restart (as long as it sits in a durable queue). toEqual on the whole
     * options object also catches any unexpected extra option.
     */
    expect(fake.published[0].options).toEqual({ persistent: true });
  });

  it('asserts the exchange before publishing', async () => {
    await new ProductCreatedPublisher(fake.asChannel()).publish(data);

    /**
     * The order matters: publishing to an exchange that doesn't exist yet makes
     * RabbitMQ close the channel with an error.
     */
    expect(fake.calls).toEqual(['assertExchange', 'publish']);
  });
});
