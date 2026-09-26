/**
 * Clears the given env vars before each test and restores their original
 * values after it. Call it inside a `describe` block.
 */
export const isolateEnv = (keys: string[]): void => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
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
