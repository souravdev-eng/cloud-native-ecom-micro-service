export const mfConfig = {
	name: 'host',
	filename: 'remoteEntry.js',
	remotes: {
		user: 'user@https://mfe-user.ecom.dev/remoteEntry.js',
		dashboard: 'dashboard@https://mfe-dashboard.ecom.dev/remoteEntry.js',
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
