/**
 * Loader for dev.config.json — the single source of truth for MFE dev wiring.
 *
 * Consumed by:
 *   - scripts/dev.mjs        → which port-forwards to open, which apps to start
 *   - <app>/rspack.config.ts → devServer.port, output.publicPath, __API_ENDPOINTS__
 *
 * CommonJS on purpose: the rspack configs are TypeScript compiled by ts-node
 * with `module: CommonJS`, so they can `require()` this directly.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'dev.config.json');

let cached = null;

/** Parsed dev.config.json (cached). */
function load() {
	if (cached) return cached;

	let raw;
	try {
		raw = fs.readFileSync(CONFIG_PATH, 'utf8');
	} catch (err) {
		throw new Error(
			`Cannot read ${CONFIG_PATH}. It is required by every rspack config and by scripts/dev.mjs.\n${err.message}`,
		);
	}

	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		throw new Error(`dev.config.json is not valid JSON: ${err.message}`);
	}

	validate(parsed);
	cached = parsed;
	return cached;
}

function validate(cfg) {
	const fail = (msg) => {
		throw new Error(`dev.config.json: ${msg}`);
	};

	if (!Array.isArray(cfg.apps) || cfg.apps.length === 0)
		fail('`apps` must be a non-empty array');
	if (!Array.isArray(cfg.backends)) fail('`backends` must be an array');
	if (!cfg.production || !cfg.production.apiBaseUrl)
		fail('`production.apiBaseUrl` is required');

	const seenPorts = new Map();
	const claim = (port, owner) => {
		if (!Number.isInteger(port)) fail(`${owner} has a non-integer port`);
		if (seenPorts.has(port))
			fail(
				`port ${port} is claimed by both ${seenPorts.get(port)} and ${owner}`,
			);
		seenPorts.set(port, owner);
	};

	for (const app of cfg.apps) {
		if (!app.name) fail('every app needs a `name`');
		claim(app.port, `app "${app.name}"`);
	}
	for (const be of cfg.backends) {
		if (!be.key) fail('every backend needs a `key`');
		if (!be.service) fail(`backend "${be.key}" needs a \`service\``);
		claim(be.localPort, `backend "${be.key}"`);
	}
}

/** All apps, `shared` (the library) first so remotes can resolve it. */
function apps() {
	const list = [...load().apps];
	return list.sort((a, b) => order(a) - order(b));
}

function order(app) {
	if (app.role === 'library') return 0;
	if (app.role === 'remote') return 1;
	return 2; // shell last — it federates the remotes
}

function app(name) {
	const found = load().apps.find((a) => a.name === name);
	if (!found)
		throw new Error(
			`dev.config.json has no app named "${name}" (have: ${load()
				.apps.map((a) => a.name)
				.join(', ')})`,
		);
	return found;
}

/**
 * The workspace package name for an app, e.g. "shared" → "@mfe/shared".
 *
 * turbo --filter matches on package name, not directory, so this is read from
 * the app's own package.json rather than guessed.
 */
function packageName(name) {
	const dir = app(name).dir || name;
	const pkgPath = path.join(ROOT, dir, 'package.json');

	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	} catch (err) {
		throw new Error(
			`app "${name}" in dev.config.json has no readable package.json at ${pkgPath}\n${err.message}`,
		);
	}

	if (!pkg.name) throw new Error(`${pkgPath} has no "name" field`);
	return pkg.name;
}

function backends() {
	return load().backends;
}

function cluster() {
	return { namespace: 'default', waitForReadySeconds: 120, ...load().cluster };
}

const isProd = (mode) => (mode || process.env.NODE_ENV) === 'production';

/**
 * Base URL of every backend, keyed by `backends[].key`.
 *
 * dev  → the local end of each `kubectl port-forward` (http://localhost:3100, …)
 * prod → the single ingress host, which routes /api/* to the right service
 *
 * Override any one of them without touching the config:
 *   MFE_AUTH_URL=http://staging.internal pnpm dev
 * Or move every dev endpoint off localhost (e.g. to a remote docker host):
 *   MFE_API_HOST=192.168.1.20 pnpm dev
 */
function endpoints(mode) {
	const cfg = load();
	const out = {};

	if (isProd(mode)) {
		const base = stripTrailingSlash(
			process.env.MFE_API_BASE_URL || cfg.production.apiBaseUrl,
		);
		for (const be of cfg.backends) out[be.key] = base;
	} else {
		const host = process.env.MFE_API_HOST || 'localhost';
		for (const be of cfg.backends)
			out[be.key] = `http://${host}:${be.localPort}`;
	}

	// Per-service override always wins.
	for (const be of cfg.backends) {
		const override = process.env[`MFE_${be.key}_URL`];
		if (override) out[be.key] = stripTrailingSlash(override);
	}

	return out;
}

/** Module Federation remote entries for the host shell. */
function remotes(mode) {
	const cfg = load();
	const pattern = cfg.production.remoteUrlPattern;
	const out = {};

	for (const a of cfg.apps) {
		if (a.role !== 'remote') continue;
		out[a.name] = isProd(mode)
			? `${a.name}@${pattern.replace('{name}', a.name)}`
			: `${a.name}@http://localhost:${a.port}/remoteEntry.js`;
	}
	return out;
}

/**
 * `rspack.DefinePlugin` payload. Every app gets `__API_ENDPOINTS__` inlined at
 * build time, so `src/**` never hardcodes a port again.
 */
function defineEntries(mode) {
	return {
		__API_ENDPOINTS__: JSON.stringify(endpoints(mode)),
	};
}

/**
 * devServer + output block for an app's rspack config.
 *
 * publicPath is where the bundle's own chunks are fetched from, and for a
 * federated remote that must be wherever the remote is really served:
 *   dev  → this app's dev server, absolute so the host on :3000 can pull
 *          chunks from a remote on :3001 instead of resolving them against
 *          its own origin
 *   prod → 'auto', so the bundle infers its origin from the URL its own
 *          script was loaded from. A baked-in host would be wrong the moment
 *          the same artifact is served from a different domain or path.
 */
function serve(name, mode) {
	const { port } = app(name);
	return {
		port,
		publicPath: isProd(mode) ? 'auto' : `http://localhost:${port}/`,
	};
}

function stripTrailingSlash(url) {
	return url.replace(/\/+$/, '');
}

module.exports = {
	ROOT,
	CONFIG_PATH,
	load,
	apps,
	app,
	packageName,
	backends,
	cluster,
	endpoints,
	remotes,
	defineEntries,
	serve,
};
