import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * Regression guard for the course: runs every local lab's --check against
 * the compose profile it needs, several times over, and exits non-zero on
 * any mismatch. If a Redis or client upgrade stops a lab showing what its
 * lesson claims, this is what catches it.
 *
 * Adding a lab means adding one entry here.
 */
const LABS = [
  { id: '00', profile: 'single', script: 'labs/00-shared-state/index.ts' },
];

/** Race labs must fail the same way every run, so one pass isn't enough to trust them. */
const RUNS = 3;

const root = path.join(__dirname, '..');
const tsx = path.join(root, 'node_modules', '.bin', 'tsx');

function sh(command: string, args: string[]): number {
  return spawnSync(command, args, { cwd: root, stdio: 'inherit' }).status ?? 1;
}

const failures: string[] = [];
for (const profile of new Set(LABS.map((lab) => lab.profile))) {
  console.log(`\n=== Starting the ${profile} profile`);
  if (sh('docker', ['compose', '--profile', profile, 'up', '-d', '--wait']) !== 0) {
    failures.push(`profile ${profile} did not start`);
    continue;
  }
  for (const lab of LABS.filter((l) => l.profile === profile)) {
    for (let run = 1; run <= RUNS; run++) {
      console.log(`\n=== lab ${lab.id}, check ${run}/${RUNS}`);
      if (sh(tsx, [lab.script, '--check']) !== 0) failures.push(`lab ${lab.id} check ${run}`);
    }
  }
}

console.log(`\n=== ${failures.length ? `FAILED: ${failures.join(', ')}` : `All labs verified (${RUNS} runs each) ✓`}`);
process.exitCode = failures.length ? 1 : 0;
