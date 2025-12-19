export const mfConfig = {
	name: 'dashboard',
	filename: 'remoteEntry.js',
	exposes: {
		'./dashboardApp': './src/bootstrap',
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
