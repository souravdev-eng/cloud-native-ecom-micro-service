// Module Federation config for the host shell — dev AND prod.
//
// Remote URLs are derived from mfe-client/dev.config.json:
//   dev  → http://localhost:<app.port>/remoteEntry.js
//   prod → production.remoteUrlPattern
// Add or move a remote by editing dev.config.json, not this file.
const devConfig = require('../config/dev-config.cjs');

export const mfConfig = {
	name: 'host',
	filename: 'remoteEntry.js',
	remotes: devConfig.remotes(),
	shared: {
		react: { singleton: true, eager: true, requiredVersion: '19.1.1' },
		'react-dom': {
			singleton: true,
			eager: true,
			requiredVersion: '19.1.1',
		},
		'react-router-dom': {
			singleton: true,
			eager: true,
			requiredVersion: '^7.7.1',
		},
	},
	dts: false,
};
