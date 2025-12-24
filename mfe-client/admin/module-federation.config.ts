export const mfConfig = {
	name: 'admin',
	filename: 'remoteEntry.js',
	exposes: {
		'./adminApp': './src/bootstrap',
	},
	shared: {
		react: { singleton: true, eager: true, requiredVersion: '19.1.1' },
		'react-dom': {
			singleton: true,
			eager: true,
			requiredVersion: '19.1.1',
		},
	},
	// Disable DTS generation in development to avoid @mf-types.zip errors
	dts: false,
};
