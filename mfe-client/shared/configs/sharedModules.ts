/**
 * Optimized shared dependencies configuration for Module Federation
 * Provides better bundle optimization, version management, and performance
 */

// Core React dependencies that should always be shared as singletons
const CORE_SINGLETONS = {
	react: {
		singleton: true,
		eager: true,
		requiredVersion: '^18.3.1',
		strictVersion: false,
	},
	'react-dom': {
		singleton: true,
		eager: true,
		requiredVersion: '^18.3.1',
		strictVersion: false,
	},
};

// UI framework dependencies that should be shared
const UI_DEPENDENCIES = {
	'@mui/material': {
		singleton: true,
		eager: false,
		requiredVersion: '^5.0.0',
		strictVersion: false,
	},
	'@mui/icons-material': {
		singleton: true,
		eager: false,
		requiredVersion: '^5.0.0',
		strictVersion: false,
	},
	'@mui/styles': {
		singleton: true,
		eager: false,
		requiredVersion: '^5.0.0',
		strictVersion: false,
	},
	'@emotion/react': {
		singleton: true,
		eager: false,
		requiredVersion: '^11.0.0',
		strictVersion: false,
	},
	'@emotion/styled': {
		singleton: true,
		eager: false,
		requiredVersion: '^11.0.0',
		strictVersion: false,
	},
};

// GraphQL and data fetching dependencies
const DATA_DEPENDENCIES = {
	'@apollo/client': {
		singleton: true,
		eager: false,
		requiredVersion: '^3.0.0',
		strictVersion: false,
	},
	graphql: {
		singleton: true,
		eager: false,
		requiredVersion: '^16.0.0',
		strictVersion: false,
	},
	'aws-appsync-auth-link': {
		singleton: true,
		eager: false,
		requiredVersion: '^3.0.0',
		strictVersion: false,
	},
	'aws-appsync-subscription-link': {
		singleton: true,
		eager: false,
		requiredVersion: '^3.0.0',
		strictVersion: false,
	},
};

// Form and validation dependencies
const FORM_DEPENDENCIES = {
	formik: {
		singleton: true,
		eager: false,
		requiredVersion: '^2.0.0',
		strictVersion: false,
	},
	yup: {
		singleton: true,
		eager: false,
		requiredVersion: '^1.0.0',
		strictVersion: false,
	},
};

// Utility and routing dependencies
const UTILITY_DEPENDENCIES = {
	'react-router-dom': {
		singleton: true,
		eager: false,
		requiredVersion: '^5.0.0',
		strictVersion: false,
	},
	'react-toastify': {
		singleton: true,
		eager: false,
		requiredVersion: '^10.0.0',
		strictVersion: false,
	},
	moment: {
		singleton: true,
		eager: false,
		requiredVersion: '^2.0.0',
		strictVersion: false,
	},
	'cross-fetch': {
		singleton: true,
		eager: false,
		requiredVersion: '^4.0.0',
		strictVersion: false,
	},
	buffer: {
		singleton: true,
		eager: false,
		requiredVersion: '^6.0.0',
		strictVersion: false,
	},
};

// Dependencies that should NOT be shared (development tools, build tools, etc.)
const EXCLUDED_DEPENDENCIES = new Set([
	// Build tools
	'webpack',
	'webpack-cli',
	'webpack-dev-server',
	'webpack-merge',
	'babel-loader',
	'css-loader',
	'style-loader',
	'file-loader',
	'html-webpack-plugin',
	'clean-webpack-plugin',
	'webpack-bundle-analyzer',
	'dotenv-webpack',
	'source-map-loader',

	// Testing tools
	'jest',
	'@jest/globals',
	'babel-jest',
	'jest-environment-jsdom',
	'@testing-library/react',
	'@testing-library/dom',
	'@testing-library/jest-dom',
	'@testing-library/user-event',
	'@testing-library/react-hooks',

	// TypeScript and Babel
	'typescript',
	'ts-node',
	'@babel/core',
	'@babel/preset-env',
	'@babel/preset-react',
	'@babel/preset-typescript',
	'@babel/plugin-transform-runtime',
	'@babel/plugin-transform-react-jsx',

	// Type definitions
	'@types/react',
	'@types/react-dom',
	'@types/node',
	'@types/jest',
	'@types/react-router-dom',
	'@types/history',

	// Storybook
	'storybook',
	'@storybook/react-webpack5',
	'@storybook/addon-essentials',
	'@storybook/addon-docs',
	'@storybook/addon-onboarding',
	'@storybook/addon-webpack5-compiler-swc',
	'eslint-plugin-storybook',

	// Other dev dependencies
	'identity-obj-proxy',
	'uuid',
	'add',
	'clsx',
	'dompurify',
	'firebase',
	'realm-web',
	'axios',
	'date-fns',
	'dayjs',
	'@date-io/date-fns',
	'@mui/base',
	'@mui/lab',
	'@mui/system',
	'@mui/x-date-pickers',
	'@react-pdf/renderer',
	'react-datepicker',
	'@material-ui/icons',
]);

/**
 * Get optimized shared dependencies configuration for Module Federation
 * @param {Object} packageJson - The package.json object of the current module
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeAllDeps - Whether to include all dependencies (default: false)
 * @param {Set} options.additionalExclusions - Additional dependencies to exclude
 * @param {Object} options.customConfig - Custom configuration overrides
 * @returns {Object} Shared dependencies configuration
 */
const getSharedDeps = (packageJson, options = {}) => {
	const {
		includeAllDeps = false,
		additionalExclusions = new Set(),
		customConfig = {},
	} = options;

	// Start with core singletons
	const shared = { ...CORE_SINGLETONS };

	// Add categorized dependencies
	Object.assign(shared, UI_DEPENDENCIES);
	Object.assign(shared, DATA_DEPENDENCIES);
	Object.assign(shared, FORM_DEPENDENCIES);
	Object.assign(shared, UTILITY_DEPENDENCIES);

	// If includeAllDeps is true, add all remaining dependencies
	if (includeAllDeps && packageJson.dependencies) {
		Object.keys(packageJson.dependencies).forEach((dep) => {
			// Skip if already configured or explicitly excluded
			if (
				shared[dep] ||
				EXCLUDED_DEPENDENCIES.has(dep) ||
				additionalExclusions.has(dep)
			) {
				return;
			}

			// Add with default configuration
			shared[dep] = {
				singleton: true,
				eager: false,
				requiredVersion: packageJson.dependencies[dep],
				strictVersion: false,
			};
		});
	}

	// Apply custom configuration overrides
	Object.keys(customConfig).forEach((dep) => {
		if (shared[dep]) {
			shared[dep] = { ...shared[dep], ...customConfig[dep] };
		}
	});

	return shared;
};

/**
 * Get shared dependencies optimized for production builds
 * @param {Object} packageJson - The package.json object
 * @returns {Object} Production-optimized shared dependencies
 */
const getProductionSharedDeps = (packageJson) => {
	return getSharedDeps(packageJson, {
		includeAllDeps: false, // Only include essential dependencies in production
		customConfig: {
			// Optimize core dependencies for production
			react: {
				singleton: true,
				eager: true,
				requiredVersion: '^18.3.1',
				strictVersion: true, // Stricter version checking in production
			},
			'react-dom': {
				singleton: true,
				eager: true,
				requiredVersion: '^18.3.1',
				strictVersion: true,
			},
			'react-router-dom': {
				singleton: true,
				eager: true,
				requiredVersion: '^5.2.0',
				strictVersion: true,
			},
		},
	});
};

/**
 * Get shared dependencies optimized for development builds
 * @param {Object} packageJson - The package.json object
 * @returns {Object} Development-optimized shared dependencies
 */
const getDevelopmentSharedDeps = (packageJson) => {
	return getSharedDeps(packageJson, {
		includeAllDeps: true, // Include more dependencies for better development experience
		customConfig: {
			// More lenient version checking in development
			react: {
				singleton: true,
				eager: true,
				requiredVersion: '^18.3.1',
				strictVersion: false,
			},
			'react-dom': {
				singleton: true,
				eager: true,
				requiredVersion: '^18.3.1',
				strictVersion: false,
			},
		},
	});
};

module.exports = {
	getSharedDeps,
	getProductionSharedDeps,
	getDevelopmentSharedDeps,
	CORE_SINGLETONS,
	UI_DEPENDENCIES,
	DATA_DEPENDENCIES,
	FORM_DEPENDENCIES,
	UTILITY_DEPENDENCIES,
	EXCLUDED_DEPENDENCIES,
};
