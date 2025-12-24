import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import * as RefreshPlugin from '@rspack/plugin-react-refresh';
import * as path from 'node:path';

const isDev = process.env.NODE_ENV === 'development';

// Import the appropriate module federation config
const mfConfig = isDev
	? require('./module-federation.config').mfConfig
	: require('./module-federation.config.prod').mfConfig;

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

export default defineConfig({
	context: __dirname,
	entry: {
		main: './src/index.tsx',
	},
	resolve: {
		extensions: ['...', '.ts', '.tsx', '.jsx'],
	},

	devServer: {
		port: 3001,
		historyApiFallback: true,
		watchFiles: [path.resolve(__dirname, 'src')],
	},
	output: {
		uniqueName: 'user',
		publicPath: 'http://localhost:3001/',
	},

	experiments: {
		css: true,
	},

	module: {
		rules: [
			{
				test: /\.svg$/,
				type: 'asset',
			},
			{
				test: /\.css$/,
				use: ['postcss-loader'],
				type: 'css',
			},
			{
				test: /\.(jsx?|tsx?)$/,
				use: [
					{
						loader: 'builtin:swc-loader',
						options: {
							jsc: {
								parser: {
									syntax: 'typescript',
									tsx: true,
								},
								transform: {
									react: {
										runtime: 'automatic',
										development: isDev,
										refresh: isDev,
									},
								},
							},
							env: { targets },
						},
					},
				],
			},
		],
	},
	plugins: [
		new rspack.HtmlRspackPlugin({
			template: './index.html',
		}),
		new rspack.DefinePlugin({
			'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(
				process.env.STRIPE_PUBLISHABLE_KEY || ''
			),
		}),
		new ModuleFederationPlugin(mfConfig),
		isDev ? new RefreshPlugin() : null,
	].filter(Boolean),
	optimization: {
		minimizer: [
			new rspack.SwcJsMinimizerRspackPlugin(),
			new rspack.LightningCssMinimizerRspackPlugin({
				minimizerOptions: { targets },
			}),
		],
	},
});
