/**
 * Test helper that records everything written to `process.stdout` while it is
 * active. The logger writes to stdout (that's what Alloy tails in the cluster),
 * so reading stdout back is the only honest way to assert on log output.
 */
export interface CapturedStdout {
  /** Everything written so far, split on newlines, with empty lines dropped. */
  lines(): Promise<string[]>;
  /** The captured lines parsed as JSON; throws if any line isn't JSON. */
  json(): Promise<Record<string, any>[]>;
  /** Stops capturing and puts the real `process.stdout.write` back. */
  restore(): void;
}

export const captureStdout = (): CapturedStdout => {
  const chunks: string[] = [];

  /**
   * Replacing `write` (instead of wrapping it) keeps log noise out of the Jest
   * output. `restoreMocks: true` in jest.config.js also undoes this spy after
   * each test, so a test that forgets `restore()` can't leak it.
   */
  const spy = jest
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array): boolean => {
      chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
      return true;
    });

  /**
   * Winston hands entries to its transports through Node streams, which can
   * deliver on a later tick. Waiting one macrotask lets every pending write land
   * before a test reads the output.
   */
  const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

  const lines = async () => {
    await flush();
    return chunks
      .join('')
      .split('\n')
      .filter((line) => line.trim() !== '');
  };

  return {
    lines,
    json: async () => (await lines()).map((line) => JSON.parse(line)),
    restore: () => spy.mockRestore(),
  };
};
