export const mfConfig = {
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App.tsx',
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
