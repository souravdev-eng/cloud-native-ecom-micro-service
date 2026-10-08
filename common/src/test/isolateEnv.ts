/**
 * Clears the given env vars before each test and restores their original
 * values after it. Call it inside a `describe` block. Pass `'all'` to clear
 * them once for the whole block instead, for setup done in `beforeAll`.
 */
export const isolateEnv = (keys: string[], scope: 'each' | 'all' = 'each'): void => {
  const saved: Record<string, string | undefined> = {};
  const [before, after] = scope === 'all' ? [beforeAll, afterAll] : [beforeEach, afterEach];

  before(() => {
    for (const key of keys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  after(() => {
    for (const key of keys) {
      /**
       * Assigning `undefined` to `process.env` stores the string "undefined",
       * so a var that was originally unset has to be deleted instead.
       */
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
};
