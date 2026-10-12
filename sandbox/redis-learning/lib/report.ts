/**
 * Console output shared by every lab: short labelled lines, then a verdict
 * line marked ✓ (the outcome you want) or ✗ (the failure the lab shows).
 */

/** Numbers print with thousands separators, e.g. 1,742. */
export const fmt = (n: number) => n.toLocaleString('en-US');

const LABEL_WIDTH = 18;
const labelled = (label: string, value: string | number) =>
  `  ${`${label}:`.padEnd(LABEL_WIDTH)} ${typeof value === 'number' ? fmt(value) : value}`;

export function heading(text: string): void {
  console.log(`\n${text}`);
}

export function line(label: string, value: string | number): void {
  console.log(labelled(label, value));
}

export function verdict(label: string, value: string | number, good: boolean): void {
  console.log(`${labelled(label, value)} ${good ? '✓' : '✗'}`);
}
