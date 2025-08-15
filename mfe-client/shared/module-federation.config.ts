export const mfConfig = {
  name: 'sheared',
  filename: 'remoteEntry.js',
  exposes: {},
  shared: {
    react: { singleton: true, eager: true, requiredVersion: '19.1.1' },
    'react-dom': {
      singleton: true,
      eager: true,
      requiredVersion: '19.1.1',
    },
  },
};
