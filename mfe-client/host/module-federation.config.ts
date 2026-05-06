export const mfConfig = {
	name: 'host',
	filename: 'remoteEntry.js',
	remotes: {
		user: 'user@http://localhost:3001/remoteEntry.js',
		dashboard: 'dashboard@http://localhost:3002/remoteEntry.js',
		admin: 'admin@http://localhost:3004/remoteEntry.js',
	},
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
