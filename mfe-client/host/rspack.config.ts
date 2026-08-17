import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import * as RefreshPlugin from '@rspack/plugin-react-refresh';
import * as path from 'node:path';

const isDev = process.env.NODE_ENV === 'development';

// Ports and API endpoints come from mfe-client/dev.config.json — the single
// source of truth shared with scripts/dev.mjs. Never hardcode them here.
const devConfig = require('../config/dev-config.cjs');
const serve = devConfig.serve('host');

// One federation config for both modes — it resolves remote URLs from
// dev.config.json based on NODE_ENV.
const mfConfig = require('./module-federation.config').mfConfig;

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

export default defineConfig({
	context: __dirname,
	entry: {
		main: './src/index.ts',
	},
	resolve: {
		extensions: ['...', '.ts', '.tsx', '.jsx'],
	},

	devServer: {
		port: serve.port,
		historyApiFallback: true,
		watchFiles: [path.resolve(__dirname, 'src')],
	},
	output: {
		uniqueName: 'host',
		publicPath: serve.publicPath,
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
		new rspack.DefinePlugin(devConfig.defineEntries()),
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
