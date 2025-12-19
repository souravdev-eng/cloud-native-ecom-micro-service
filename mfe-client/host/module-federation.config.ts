export const mfConfig = {
	name: 'host',
	filename: 'remoteEntry.js',
	remotes: {
		user: 'user@http://localhost:3001/remoteEntry.js',
		dashboard: 'dashboard@http://localhost:3002/remoteEntry.js',
	},
	shared: {
		react: { singleton: true, eager: true, requiredVersion: '19.1.1' },
		'react-dom': {
			singleton: true,
			eager: true,
			requiredVersion: '19.1.1',
		},
	},
};
