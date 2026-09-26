/**
 * These tests cover what the logger masks before writing a line. Leak tests
 * search the raw stdout text rather than one parsed field, so a secret
 * escaping through any path (message, nested field, stack trace) fails them.
 */
import { createLogger } from '../logger';
import { captureStdout, CapturedStdout } from '../../test/captureStdout';
import { isolateEnv } from '../../test/isolateEnv';

describe('createLogger redaction', () => {
  let stdout: CapturedStdout;

  /** Without NODE_ENV and LOG_FORMAT the logger writes JSON, which these tests parse. */
  isolateEnv(['NODE_ENV', 'LOG_FORMAT']);

  beforeEach(() => {
    stdout = captureStdout();
  });

  afterEach(() => {
    stdout.restore();
  });

  /** Joins every captured line so a leak anywhere in the output is found. */
  const rawOutput = async () => (await stdout.lines()).join('\n');

  it('masks fields with secret names at any depth', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.info('login attempt', {
      password: 'hunter2-plain',
      token: 'reset-token-value',
      authorization: 'Bearer eyJhbGciOi.header-value',
      cookie: 'session=cookie-value',
      body: { newPassword: 'nested-password', accessToken: 'nested-token' },
      headers: [{ Authorization: 'Bearer array-auth-value' }],
      jwt: 'jwt-value',
      clientSecret: 'client-secret-value',
      card: { number: '4242424242424242', cvc: '123' },
      userId: 'u-1',
    });

    const output = await rawOutput();
    for (const secret of [
      'hunter2-plain',
      'reset-token-value',
      'header-value',
      'cookie-value',
      'nested-password',
      'nested-token',
      'array-auth-value',
      'jwt-value',
      'client-secret-value',
      '4242424242424242',
    ]) {
      expect(output).not.toContain(secret);
    }

    /** Non-sensitive fields must survive, or the logs lose their value. */
    const [line] = await stdout.json();
    expect(line.userId).toBe('u-1');
    expect(line.password).toBe('[REDACTED]');
    expect(line.body.newPassword).toBe('[REDACTED]');
  });

  it('masks email addresses in fields, messages and error text', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.info('password reset requested for jane.doe@example.com', { email: 'jane.doe@example.com' });
    logger.error('send failed', { error: new Error('rejected recipient jane.doe@example.com') });

    const output = await rawOutput();
    expect(output).not.toContain('jane.doe@example.com');
    /**
     * The domain is kept on purpose: "all gmail.com sends fail" is still a
     * useful signal, while the local part identifies the person.
     */
    const [first] = await stdout.json();
    expect(first.email).toBe('j***@example.com');
    expect(first.message).toBe('password reset requested for j***@example.com');
  });

  it('masks Stripe secret keys wherever they appear', async () => {
    const logger = createLogger({ service: 'order-service' });

    logger.warn('stripe misconfigured: sk_test_51Habcdefghijklmnop', { hint: 'whsec_abcdefghijklmnop' });

    const output = await rawOutput();
    expect(output).not.toContain('sk_test_51Habcdefghijklmnop');
    expect(output).not.toContain('whsec_abcdefghijklmnop');
  });

  it('does not modify the objects the caller passed in', async () => {
    const logger = createLogger({ service: 'auth-service' });
    const body = { email: 'jane.doe@example.com', password: 'hunter2-plain' };

    logger.info('signup', { body });

    await stdout.lines();
    /**
     * Redaction must copy, not mutate: callers often log the same object they
     * go on to save or send.
     */
    expect(body).toEqual({ email: 'jane.doe@example.com', password: 'hunter2-plain' });
  });

  it('masks secrets in pretty development output too', async () => {
    process.env.NODE_ENV = 'development';
    const logger = createLogger({ service: 'auth-service' });

    logger.info('login for jane.doe@example.com', { password: 'hunter2-plain' });

    const output = await rawOutput();
    expect(output).not.toContain('hunter2-plain');
    expect(output).not.toContain('jane.doe@example.com');
  });

  it('masks compound secret names without masking look-alike fields', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.info('state', {
      /** The auth signup form really spells its confirmation field this way. */
      passwordConform: 'confirm-value',
      STRIPE_SECRET_KEY: 'stripe-key-value',
      'x-api-key': 'api-key-value',
      'set-cookie': 'set-cookie-value',
      discardedCount: 3,
      cardinality: 12,
      tokenizer: 'bpe',
    });

    const [line] = await stdout.json();
    expect(line).toMatchObject({
      passwordConform: '[REDACTED]',
      STRIPE_SECRET_KEY: '[REDACTED]',
      'x-api-key': '[REDACTED]',
      'set-cookie': '[REDACTED]',
      /**
       * These only contain "card" or "token" as a substring. Masking them
       * would hide useful data without protecting anything.
       */
      discardedCount: 3,
      cardinality: 12,
      tokenizer: 'bpe',
    });
  });

  it('masks every email in a string, including at the edges and before punctuation', async () => {
    const logger = createLogger({ service: 'notification-service' });

    logger.info('a.b@example.com, c@mail.example.org. Sent by x+tag@example.co.uk');

    const [line] = await stdout.json();
    expect(line.message).toBe('a***@example.com, c***@mail.example.org. Sent by x***@example.co.uk');
  });

  it('leaves strings that only look partly like emails alone', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.info('handle @someone, host user@localhost, price 3@5.00');

    const [line] = await stdout.json();
    expect(line.message).toBe('handle @someone, host user@localhost, price 3@5.00');
  });

  it('masks a hostile email-like string in linear time', async () => {
    const logger = createLogger({ service: 'auth-service' });
    /**
     * "a@a.a.a.a…" is the classic input that makes a backtracking email regex
     * take quadratic time; the original regex took about 6s on it. Linear
     * matching takes milliseconds, so 500ms leaves headroom on slow CI.
     */
    const hostile = 'a@' + 'a.'.repeat(50_000) + '!';

    const started = performance.now();
    logger.info('login attempt', { input: hostile });
    await stdout.lines();

    expect(performance.now() - started).toBeLessThan(500);
  });

  it('logs an object referenced twice in full, not as circular', async () => {
    const logger = createLogger({ service: 'cart-service' });
    const product = { id: 'p-1', price: 10 };

    logger.info('cart diff', { before: product, after: product });

    const [line] = await stdout.json();
    expect(line.after).toEqual({ id: 'p-1', price: 10 });
  });

  it('still marks a real cycle instead of recursing forever', async () => {
    const logger = createLogger({ service: 'cart-service' });
    const node: Record<string, unknown> = { id: 'n-1' };
    node.self = node;

    logger.info('graph', { node });

    const [line] = await stdout.json();
    expect(line.node).toEqual({ id: 'n-1', self: '[Circular]' });
  });

  it('truncates very deep objects instead of overflowing the stack', async () => {
    const logger = createLogger({ service: 'etl-service' });
    const root: Record<string, unknown> = {};
    let cursor = root;
    for (let depth = 0; depth < 20_000; depth += 1) {
      cursor.next = {};
      cursor = cursor.next as Record<string, unknown>;
    }

    logger.info('deep payload', { root });

    const output = await rawOutput();
    expect(output).toContain('[Truncated]');
  });

  it('masks the values an object exposes through toJSON', async () => {
    const logger = createLogger({ service: 'auth-service' });
    /**
     * JSON.stringify calls toJSON and prints its result. Mongoose documents
     * work this way, so masking the object's own fields alone isn't enough.
     */
    const doc = { toJSON: () => ({ password: 'tojson-password', email: 'jane.doe@example.com' }) };

    logger.info('saved user', { doc });

    const output = await rawOutput();
    expect(output).not.toContain('tojson-password');
    expect(output).not.toContain('jane.doe@example.com');
  });

  it('logs the fields of an object whose toJSON returns itself', async () => {
    const logger = createLogger({ service: 'auth-service' });
    const user = {
      name: 'Jane',
      password: 'self-password',
      toJSON() {
        return this;
      },
    };

    logger.info('loaded user', { user });

    const [line] = await stdout.json();
    expect(line.user).toEqual({ name: 'Jane', password: '[REDACTED]' });
  });

  it('still logs the line when reading a field throws', async () => {
    const logger = createLogger({ service: 'auth-service' });
    const payload = {
      id: 'o-1',
      get broken(): string {
        throw new Error('getter exploded');
      },
    };

    logger.info('order state', { payload });

    const [line] = await stdout.json();
    expect(line.payload).toEqual({ id: 'o-1', broken: '[Unreadable]' });
  });

  it('logs nested errors, Maps and Sets with their contents masked', async () => {
    const logger = createLogger({ service: 'notification-service' });

    logger.info('send failed', {
      details: { cause: new Error('rejected jane.doe@example.com') },
      headers: new Map([
        ['authorization', 'Bearer map-secret'],
        ['x-request-id', 'r-1'],
      ]),
      recipients: new Set(['jane.doe@example.com']),
    });

    const output = await rawOutput();
    expect(output).not.toContain('map-secret');
    expect(output).not.toContain('jane.doe@example.com');
    const [line] = await stdout.json();
    expect(line.details.cause).toMatchObject({ name: 'Error', message: 'rejected j***@example.com' });
    expect(line.headers).toEqual({ authorization: '[REDACTED]', 'x-request-id': 'r-1' });
    expect(line.recipients).toEqual(['j***@example.com']);
  });

  it('stops walking a huge shared structure instead of hanging', async () => {
    const logger = createLogger({ service: 'product-service' });
    /**
     * Each level has 10 fields pointing at the same child. Walking every path
     * would visit 10^10 objects, so the walk must give up at a node limit.
     */
    let level: Record<string, unknown> = { leaf: true };
    for (let depth = 0; depth < 10; depth += 1) {
      const child = level;
      level = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`k${i}`, child]));
    }

    const started = performance.now();
    logger.info('catalog tree', { tree: level });
    const output = await rawOutput();

    expect(performance.now() - started).toBeLessThan(500);
    expect(output).toContain('[Truncated]');
  });

  it('masks emails that are joined, trailed by symbols, non-ASCII or uppercase', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.info('a@b.com@c.com | j@e.com@ | user@example.com_foo | José@example.com | JANE@EXAMPLE.COM');

    const [line] = await stdout.json();
    expect(line.message).not.toContain('a@b.com');
    expect(line.message).not.toContain('b.com@c.com');
    expect(line.message).toContain('j***@e.com@');
    expect(line.message).toContain('u***@example.com_foo');
    expect(line.message).toContain('J***@example.com');
    expect(line.message).toContain('J***@EXAMPLE.COM');
  });

  it('masks session, signature, credential and dotted secret names', async () => {
    const logger = createLogger({ service: 'order-service' });

    logger.info('request', {
      'card.number': '4242424242424242',
      'api.key': 'dotted-api-key',
      refresh_token: 'refresh-value',
      sessionId: 'session-value',
      'connect.sid': 'sid-value',
      'Stripe-Signature': 'signature-value',
      credentials: 'credential-value',
      pwd: 'pwd-value',
      passcode: 'passcode-value',
      bearer: 'bearer-value',
      cvv2: '123',
    });

    const output = await rawOutput();
    for (const secret of [
      '4242424242424242',
      'dotted-api-key',
      'refresh-value',
      'session-value',
      'sid-value',
      'signature-value',
      'credential-value',
      'pwd-value',
      'passcode-value',
      'bearer-value',
    ]) {
      expect(output).not.toContain(secret);
    }
    const [line] = await stdout.json();
    expect(line.cvv2).toBe('[REDACTED]');
  });

  it('masks secret query parameters in logged URLs and bare query strings', async () => {
    const logger = createLogger({ service: 'auth-service' });

    /** The auth service emails exactly this kind of link for a password reset. */
    logger.info('reset link opened', {
      url: '/auth/reset-password?token=reset-abc123&email=jane.doe%40example.com',
      query: 'access_token=bare-query-token&page=2',
    });
    logger.info('redirect to /login?next=/cart&password=in-message-pw');

    const output = await rawOutput();
    for (const secret of ['reset-abc123', 'bare-query-token', 'in-message-pw', 'jane.doe%40example.com']) {
      expect(output).not.toContain(secret);
    }
    const [line, message] = await stdout.json();
    /** Harmless parameters stay readable, and the encoded email is decoded before it's masked. */
    expect(line.url).toBe('/auth/reset-password?token=[REDACTED]&email=j***@example.com');
    expect(line.query).toBe('access_token=[REDACTED]&page=2');
    expect(message.message).toBe('redirect to /login?next=/cart&password=[REDACTED]');
  });

  it('leaves ordinary key=value text alone', async () => {
    const logger = createLogger({ service: 'product-service' });

    logger.info('cache stats hits=42&misses=3', { filter: 'price[gte]=10&category=shoes' });

    const [line] = await stdout.json();
    expect(line.message).toBe('cache stats hits=42&misses=3');
    expect(line.filter).toBe('price[gte]=10&category=shoes');
  });
});
