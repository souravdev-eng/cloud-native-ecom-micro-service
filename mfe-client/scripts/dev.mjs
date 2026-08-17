#!/usr/bin/env node
/**
 * ============================================================
 * ONE COMMAND FOR MFE LOCAL DEV
 * ============================================================
 *   pnpm dev
 *
 * Everything it does — and every port it uses — comes from
 * ../dev.config.json. There is nothing else to configure.
 *
 *   1. preflight   kubectl reachable, cluster up, deps installed
 *   2. forward     kubectl port-forward for each backend service,
 *                  supervised and auto-restarted if it drops
 *   3. wait        block until each local port actually accepts TCP
 *   4. serve       turbo run dev for the MFE apps
 *   5. cleanup     one Ctrl+C tears down all of the above
 *
 * Flags:
 *   --only=host,user     start a subset of MFEs (default: all)
 *   --no-forward         MFEs only; assume forwards already exist
 *   --forward-only       port-forwards only; no MFE dev servers
 *   --no-install         skip `pnpm install`
 *   --namespace=<ns>     override dev.config.json cluster.namespace
 *   --help
 * ============================================================
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cfg = require('../config/dev-config.cjs');

const ROOT = cfg.ROOT;

/* ---------------------------------------------------------------- output */

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = paint('1');
const dim = paint('2');
const red = paint('31');
const green = paint('32');
const yellow = paint('33');
const cyan = paint('36');

// Stable per-process colours for log prefixes.
const PREFIX_COLORS = ['36', '35', '32', '33', '34', '96', '95'];
let colorCursor = 0;
const nextColor = () =>
	paint(PREFIX_COLORS[colorCursor++ % PREFIX_COLORS.length]);

const step = (msg) => console.log(`\n${bold(cyan('▶'))} ${bold(msg)}`);
const ok = (msg) => console.log(`  ${green('✓')} ${msg}`);
const warn = (msg) => console.log(`  ${yellow('!')} ${msg}`);
const info = (msg) => console.log(`  ${dim('·')} ${dim(msg)}`);

/** Print and exit now. Never returns — callers can rely on that. */
function fatal(msg, hint) {
	shuttingDown = true;
	killAll('SIGKILL');

	console.error(`\n${red('✗')} ${bold(msg)}`);
	if (hint) console.error(`\n${hint}\n`);
	process.exit(1);
}

/** kubectl is chatty on failure; the last line is the one that matters. */
function lastLine(text) {
	const lines = (text || '')
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	return lines[lines.length - 1] || 'unknown error';
}

/* ----------------------------------------------------------------- flags */

function parseArgs(argv) {
	const flags = {
		only: null,
		forward: true,
		serve: true,
		install: true,
		namespace: null,
	};

	for (const arg of argv) {
		if (arg === '--help' || arg === '-h') {
			printHelp();
			process.exit(0);
		} else if (arg.startsWith('--only=')) {
			flags.only = arg
				.slice('--only='.length)
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		} else if (arg === '--no-forward') {
			flags.forward = false;
		} else if (arg === '--forward-only') {
			flags.serve = false;
		} else if (arg === '--no-install') {
			flags.install = false;
		} else if (arg.startsWith('--namespace=')) {
			flags.namespace = arg.slice('--namespace='.length);
		} else if (arg === '-n') {
			fatal('use --namespace=<ns> rather than -n <ns>');
		} else {
			fatal(`unknown flag: ${arg}`, 'Run with --help to see the options.');
		}
	}

	if (!flags.forward && !flags.serve)
		fatal('--no-forward and --forward-only together would do nothing');

	return flags;
}

function printHelp() {
	const all = cfg.apps().map((a) => a.name);
	console.log(`
${bold('pnpm dev')} — start the MFE stack against backends running in k8s

${bold('Usage')}
  pnpm dev [flags]

${bold('Flags')}
  --only=<a,b>        start only these MFEs (${all.join(', ')})
  --no-forward        skip port-forwards (they are already running)
  --forward-only      open port-forwards and nothing else
  --no-install        skip pnpm install
  --namespace=<ns>    k8s namespace (default: ${cfg.cluster().namespace})
  -h, --help          this message

${bold('Ports')} — all defined in dev.config.json
${cfg
	.apps()
	.map((a) => `  ${String(a.port).padEnd(6)} ${a.name} ${dim(`(${a.role})`)}`)
	.join('\n')}
${cfg
	.backends()
	.map(
		(b) =>
			`  ${String(b.localPort).padEnd(6)} → ${b.service}:${b.remotePort}` +
			(b.required ? '' : dim(' (optional)')),
	)
	.join('\n')}
`);
}

/* ------------------------------------------------------- child processes */

/** Every long-lived child, so one Ctrl+C can kill them all. */
const children = new Set();
let shuttingDown = false;

function run(cmd, args, { cwd = ROOT, label, color, env } = {}) {
	const child = spawn(cmd, args, {
		cwd,
		env: { ...process.env, ...env },
		stdio: ['ignore', 'pipe', 'pipe'],
		// Own process group per child. turbo spawns rspack, which spawns more —
		// signalling the group is the only way to take the whole tree down.
		detached: true,
	});

	children.add(child);
	child.once('exit', () => children.delete(child));

	if (label) {
		const tint = color || nextColor();
		const prefix = tint(label.padEnd(12));
		// Once we are tearing down, children complain about being signalled.
		// That is expected, so stop relaying it.
		const emit = (line) => {
			if (!shuttingDown) console.log(`${prefix} ${line}`);
		};
		pipeLines(child.stdout, emit);
		pipeLines(child.stderr, emit);
	}

	return child;
}

/** Split a stream into whole lines so prefixes never land mid-line. */
function pipeLines(stream, onLine) {
	let buf = '';
	stream.setEncoding('utf8');
	stream.on('data', (chunk) => {
		buf += chunk;
		let nl;
		while ((nl = buf.indexOf('\n')) !== -1) {
			onLine(buf.slice(0, nl));
			buf = buf.slice(nl + 1);
		}
	});
	stream.on('end', () => {
		if (buf.length) onLine(buf);
	});
}

function sh(cmd, args) {
	const r = spawnSync(cmd, args, { encoding: 'utf8' });
	return {
		code: r.status,
		out: (r.stdout || '').trim(),
		err: (r.stderr || '').trim(),
		failed: r.status !== 0,
	};
}

/* ------------------------------------------------------------- preflight */

function preflight(flags) {
	step('Preflight');

	if (!flags.forward) {
		info('port-forwards skipped (--no-forward)');
		return;
	}

	if (sh('kubectl', ['version', '--client=true', '-o', 'json']).failed)
		fatal(
			'kubectl not found on PATH',
			'Install kubectl, or run with --no-forward if you are tunnelling the\nbackends some other way.',
		);

	const ctx = sh('kubectl', ['config', 'current-context']);
	if (ctx.failed)
		fatal(
			'no active kubectl context',
			'Point kubectl at your dev cluster first, e.g.:\n  kubectl config use-context docker-desktop',
		);
	ok(`context ${bold(ctx.out)}`);

	const ns = namespaceOf(flags);
	const probe = sh('kubectl', ['get', 'namespace', ns]);
	if (probe.failed)
		fatal(
			`cannot reach the cluster (namespace "${ns}")`,
			`kubectl said:\n  ${dim(lastLine(probe.err))}\n\nIs the cluster running? Start the backends with:\n  ${bold('skaffold dev -p backend')}   ${dim('(from the repo root)')}`,
		);
	ok(`namespace ${bold(ns)}`);
}

function namespaceOf(flags) {
	return flags.namespace || cfg.cluster().namespace;
}

function install(flags) {
	if (!flags.install) return;
	step('Installing dependencies');

	const r = spawnSync('pnpm', ['install', '--prefer-offline'], {
		cwd: ROOT,
		stdio: 'inherit',
	});
	if (r.status !== 0)
		fatal(
			'pnpm install failed',
			'Fix the install, or re-run with --no-install.',
		);
	ok('workspace up to date');
}

/* --------------------------------------------------------- port-forwards */

const MAX_RESTARTS = 10;

function startForwards(flags) {
	if (!flags.forward) return [];

	step('Port-forwarding backend services');

	const ns = namespaceOf(flags);
	const live = [];

	for (const be of cfg.backends()) {
		const exists = !sh('kubectl', ['get', 'service', be.service, '-n', ns])
			.failed;

		if (!exists) {
			if (be.required) {
				// fatal() never returns.
				fatal(
					`service ${be.service} is not in namespace ${ns}`,
					`The MFEs need it — ${be.key} is marked required in dev.config.json.\nStart the backends from the repo root:\n  ${bold('skaffold dev -p backend')}`,
				);
			}
			warn(`${be.service} not deployed — skipping ${be.key} (optional)`);
			continue;
		}

		if (inUseSync(be.localPort)) {
			warn(
				`port ${be.localPort} already in use — reusing it for ${be.key} ` +
					dim('(assuming an existing forward)'),
			);
			live.push({ ...be, adopted: true });
			continue;
		}

		supervise(be, ns);
		live.push(be);
	}

	return live;
}

/** Run one port-forward and bring it back if it dies mid-session. */
function supervise(be, ns, attempt = 0) {
	const label = be.key.toLowerCase();
	const args = [
		'port-forward',
		`service/${be.service}`,
		`${be.localPort}:${be.remotePort}`,
		'-n',
		ns,
		'--address',
		'127.0.0.1',
	];

	const child = run('kubectl', args, { label: `fwd:${label}` });

	child.once('exit', (code) => {
		if (shuttingDown) return;

		if (attempt >= MAX_RESTARTS) {
			console.log(
				`  ${red('✗')} ${be.key} forward died ${MAX_RESTARTS}× — giving up. ` +
					`Is ${be.service} crash-looping?`,
			);
			return;
		}

		console.log(
			`  ${yellow('!')} ${be.key} forward exited (${code}) — restarting ` +
				dim(`(${attempt + 1}/${MAX_RESTARTS})`),
		);
		setTimeout(() => supervise(be, ns, attempt + 1), 1000);
	});

	info(
		`${be.key.padEnd(8)} localhost:${be.localPort} → ${be.service}:${be.remotePort}`,
	);
}

/** A forward reports "Forwarding from…" before it can actually serve; poll TCP. */
async function waitForForwards(live) {
	const pending = live.filter((be) => !be.adopted);
	if (pending.length === 0) return;

	step('Waiting for tunnels');

	const deadline = Date.now() + cfg.cluster().waitForReadySeconds * 1000;
	const remaining = new Set(pending.map((be) => be.key));

	while (remaining.size > 0 && Date.now() < deadline && !shuttingDown) {
		for (const be of pending) {
			if (!remaining.has(be.key)) continue;
			if (await canConnect(be.localPort)) {
				remaining.delete(be.key);
				ok(`${be.key} ready on :${be.localPort}`);
			}
		}
		if (remaining.size > 0) await sleep(500);
	}

	if (remaining.size > 0)
		warn(
			`still no response from ${[...remaining].join(', ')} — ` +
				'starting the MFEs anyway; those calls will fail until the pods are up',
		);
}

function canConnect(port) {
	return new Promise((resolve) => {
		const socket = net.connect({ port, host: '127.0.0.1' });
		const done = (result) => {
			socket.destroy();
			resolve(result);
		};
		socket.setTimeout(800);
		socket.once('connect', () => done(true));
		socket.once('timeout', () => done(false));
		socket.once('error', () => done(false));
	});
}

/** Synchronous "is anything bound here" check, for the adopt-existing case. */
function inUseSync(port) {
	const r = sh('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
	return !r.failed && r.out.length > 0;
}

/* ----------------------------------------------------------- dev servers */

function startApps(flags) {
	const all = cfg.apps();
	let selected = all;

	if (flags.only) {
		const names = all.map((a) => a.name);
		const unknown = flags.only.filter((n) => !names.includes(n));
		if (unknown.length)
			fatal(
				`unknown app(s): ${unknown.join(', ')}`,
				`dev.config.json defines: ${names.join(', ')}`,
			);
		selected = all.filter((a) => flags.only.includes(a.name));
	}

	step('Starting MFE dev servers');
	for (const a of selected)
		info(`${a.name.padEnd(10)} http://localhost:${a.port}  ${dim(a.role)}`);

	// turbo filters on package name (@mfe/host), not directory name.
	const filters = selected.flatMap((a) => [
		'--filter',
		cfg.packageName(a.name),
	]);
	const turbo = path.join(ROOT, 'node_modules', '.bin', 'turbo');
	if (!existsSync(turbo))
		fatal(
			'turbo is not installed',
			'Run `pnpm install` in mfe-client/ (or drop --no-install).',
		);

	const child = run(turbo, ['run', 'dev', ...filters], {
		label: 'turbo',
		color: paint('90'),
		env: { NODE_ENV: 'development', FORCE_COLOR: useColor ? '1' : '0' },
	});

	child.once('exit', (code) => {
		if (shuttingDown) return;
		fatal(
			`turbo exited with code ${code}`,
			'A dev server failed to start. Check the turbo output above.',
		);
	});

	return selected;
}

/** Don't claim READY until the dev servers are actually accepting requests. */
async function waitForApps(selected) {
	const deadline = Date.now() + cfg.cluster().waitForReadySeconds * 1000;
	const remaining = new Set(selected.map((a) => a.name));

	while (remaining.size > 0 && Date.now() < deadline && !shuttingDown) {
		for (const a of selected) {
			if (!remaining.has(a.name)) continue;
			if (await canConnect(a.port)) remaining.delete(a.name);
		}
		if (remaining.size > 0) await sleep(500);
	}

	if (remaining.size > 0 && !shuttingDown)
		warn(
			`${[...remaining].join(', ')} not serving yet — see the turbo output above`,
		);
}

/* -------------------------------------------------------------- shutdown */

function killAll(signal) {
	for (const child of children) {
		// Negative pid = the whole process group, so turbo's own children
		// (rspack dev servers) go down too instead of being orphaned.
		try {
			process.kill(-child.pid, signal);
		} catch {
			try {
				child.kill(signal);
			} catch {
				/* already gone */
			}
		}
	}
}

/** Graceful teardown, used for Ctrl+C. */
function shutdown(code = 0) {
	if (shuttingDown) return;
	shuttingDown = true;

	console.log(`\n${bold(yellow('■'))} ${bold('Shutting down')}`);
	killAll('SIGTERM');

	// Give children a moment to exit cleanly, then hard-stop.
	setTimeout(() => {
		killAll('SIGKILL');
		console.log(`${green('✓')} all processes stopped\n`);
		process.exit(code);
	}, 1200);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ main */

async function main() {
	const flags = parseArgs(process.argv.slice(2));

	for (const signal of ['SIGINT', 'SIGTERM']) {
		process.on(signal, () => shutdown(0));
	}

	console.log(
		bold('\n🧩  MFE dev stack') +
			dim(`  ${path.relative(process.cwd(), ROOT) || '.'}`),
	);

	preflight(flags);
	install(flags);

	const live = startForwards(flags);
	await waitForForwards(live);
	if (shuttingDown) return;

	if (!flags.serve) {
		step('Tunnels only');
		info('port-forwards are open — Ctrl+C to close them');
		return;
	}

	const apps = startApps(flags);
	await waitForApps(apps);
	if (shuttingDown) return;

	summary(apps, live, flags);
}

function summary(apps, live, flags) {
	const shell = apps.find((a) => a.role === 'shell');
	const endpoints = cfg.endpoints('development');

	console.log(`
${bold(green('READY'))}

  ${bold('Open')}   ${cyan(shell ? `http://localhost:${shell.port}` : `http://localhost:${apps[0].port}`)}

  ${bold('MFEs')}
${apps.map((a) => `    ${a.name.padEnd(10)} http://localhost:${a.port}`).join('\n')}

  ${bold('APIs')}${flags.forward ? '' : dim('  (forwards not managed by this script)')}
${live.length ? live.map((b) => `    ${b.key.padEnd(10)} ${endpoints[b.key]}`).join('\n') : dim('    none')}

${dim('  Ctrl+C stops the dev servers and closes every tunnel.')}
`);
}

main().catch((err) => {
	console.error(`\n${red('✗')} ${err.stack || err.message}`);
	shutdown(1);
});
