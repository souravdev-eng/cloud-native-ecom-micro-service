export const mfConfig = {
    name: 'user',
    filename: 'remoteEntry.js',
    exposes: {
        './UserApp': './src/bootstrap',
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
