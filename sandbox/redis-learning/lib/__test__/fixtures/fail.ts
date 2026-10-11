/** Always throws, so the test can check that a worker's error reaches the parent. */
export default async function fail(): Promise<never> {
  throw new Error('worker exploded');
}
