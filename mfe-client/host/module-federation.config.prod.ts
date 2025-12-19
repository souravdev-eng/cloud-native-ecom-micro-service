export const mfConfig = {
	name: 'host',
	filename: 'remoteEntry.js',
	remotes: {
		user: 'user@http://mfe-user.ecom.local/remoteEntry.js',
		dashboard: 'dashboard@http://mfe-dashboard.ecom.local/remoteEntry.js',
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
};
