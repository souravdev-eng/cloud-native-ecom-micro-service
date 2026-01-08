# Turborepo Configuration Deep Dive

## Understanding turbo.json

The `turbo.json` file is the heart of Turborepo configuration. It defines how tasks are executed, cached, and orchestrated across your monorepo.

## Complete Configuration Reference

```json
{
	"$schema": "https://turbo.build/schema.json",
	"globalDependencies": ["**/.env.*local", ".env", "tsconfig.json"],
	"globalEnv": ["NODE_ENV", "CI", "VERCEL_URL"],
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**", "build/**", ".next/**"],
			"inputs": ["src/**", "!src/**/*.test.*", "!src/**/*.spec.*"],
			"env": ["NODE_ENV", "API_URL", "PUBLIC_URL"],
			"cache": true,
			"persistent": false
		},
		"dev": {
			"dependsOn": ["^build"],
			"cache": false,
			"persistent": true,
			"env": ["NODE_ENV", "PORT"]
		},
		"test": {
			"dependsOn": ["build"],
			"outputs": ["coverage/**"],
			"inputs": ["src/**", "test/**", "**/*.test.*", "**/*.spec.*"],
			"cache": true
		},
		"lint": {
			"outputs": [],
			"inputs": [
				"**/*.ts",
				"**/*.tsx",
				"**/*.js",
				"**/*.jsx",
				".eslintrc.*",
				"eslint.config.*"
			],
			"cache": true
		},
		"type-check": {
			"dependsOn": ["^build"],
			"outputs": [],
			"cache": true
		},
		"clean": {
			"cache": false
		}
	}
}
```

## Configuration Options Explained

### Global Configuration

#### `$schema`

Points to the JSON schema for validation and IDE support.

#### `globalDependencies`

Files that, when changed, invalidate the cache for all tasks:

```json
"globalDependencies": [
  "**/.env.*local",     // Environment files
  "tsconfig.json",      // TypeScript config
  "package-lock.json",  // Lock files
  ".nvmrc"             // Node version
]
```

#### `globalEnv`

Environment variables that affect all tasks:

```json
"globalEnv": [
  "NODE_ENV",
  "CI",
  "GITHUB_TOKEN"
]
```

### Tasks Configuration

Each task in the tasks configuration can have the following properties:

#### `dependsOn`

Defines task dependencies:

```json
// Depends on the same task in dependencies
"dependsOn": ["^build"]

// Depends on another task in the same package
"dependsOn": ["test"]

// Depends on specific package tasks
"dependsOn": ["shared#build"]

// Multiple dependencies
"dependsOn": ["^build", "test", "shared#build"]
```

#### `outputs`

Files/directories that are cached:

```json
"outputs": [
  "dist/**",           // All files in dist
  "build/**",          // All files in build
  ".next/**",          // Next.js output
  "!dist/**/*.map"     // Exclude source maps
]
```

#### `inputs`

Files that determine cache invalidation:

```json
"inputs": [
  "src/**",            // All source files
  "!**/*.test.*",      // Exclude test files
  "!**/*.md",          // Exclude markdown
  "package.json",      // Include package.json
  "$GLOBAL_ENV_VAR"    // Include env var
]
```

#### `env`

Environment variables that affect the task:

```json
"env": [
  "NODE_ENV",
  "API_URL",
  "PUBLIC_*"           // Wildcard support
]
```

#### `cache`

Whether to cache the task outputs:

```json
"cache": true  // Default: true
```

#### `persistent`

Keep the process running (for dev servers):

```json
"persistent": true  // Default: false
```

## Advanced Configuration Patterns

### 1. Package-Specific Configuration

Override global tasks for specific packages:

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"]
		},
		"admin#build": {
			"dependsOn": ["shared#build"],
			"outputs": ["dist/**", "stats.json"],
			"env": ["ADMIN_API_KEY"]
		}
	}
}
```

### 2. Conditional Task Execution

Use environment variables for conditional behavior:

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"],
			"env": ["NODE_ENV"]
		},
		"build:prod": {
			"dependsOn": ["build"],
			"env": ["PRODUCTION_*"]
		}
	}
}
```

### 3. Parallel Task Groups

Run unrelated tasks in parallel:

```json
{
	"tasks": {
		"check": {
			"dependsOn": ["lint", "type-check", "test"]
		},
		"lint": {
			"outputs": []
		},
		"type-check": {
			"outputs": []
		},
		"test": {
			"outputs": ["coverage/**"]
		}
	}
}
```

### 4. Workspace Dependencies

Configure cross-package dependencies:

```json
{
	"tasks": {
		"host#build": {
			"dependsOn": [
				"admin#build",
				"dashboard#build",
				"user#build",
				"shared#build"
			]
		}
	}
}
```

## Environment-Specific Configurations

### Development Configuration

```json
{
	"tasks": {
		"dev": {
			"cache": false,
			"persistent": true,
			"dependsOn": [
				"shared#build" // Only build shared in dev
			]
		}
	}
}
```

### Production Configuration

```json
{
	"tasks": {
		"build:prod": {
			"dependsOn": ["^build", "test", "lint"],
			"outputs": ["dist/**"],
			"env": ["NODE_ENV", "PRODUCTION_*", "SENTRY_*"]
		}
	}
}
```

### CI Configuration

```json
{
	"tasks": {
		"ci": {
			"dependsOn": ["build", "test", "lint", "type-check"],
			"cache": true
		}
	}
}
```

## Filtering and Scoping

### Filter by Package

```bash
# Run build for admin only
turbo run build --filter=admin

# Run build for admin and its dependencies
turbo run build --filter=admin...

# Run build for packages that depend on shared
turbo run build --filter=...shared

# Run build for packages matching pattern
turbo run build --filter="@mfe/*"
```

### Filter by Git Changes

```bash
# Build only changed packages since main
turbo run build --filter=[main]

# Build changed packages and their dependents
turbo run build --filter=...[main]
```

### Scope Examples

```bash
# Multiple filters
turbo run build --filter=admin --filter=dashboard

# Exclude packages
turbo run build --filter=!admin

# Complex filtering
turbo run build --filter="@mfe/*" --filter=!*test*
```

## Performance Optimization

### 1. Optimize Inputs/Outputs

```json
{
	"tasks": {
		"build": {
			"inputs": [
				"src/**",
				"!**/*.test.*", // Exclude test files
				"!**/*.stories.*", // Exclude Storybook files
				"!**/*.md" // Exclude docs
			],
			"outputs": [
				"dist/**",
				"!dist/**/*.map" // Don't cache source maps
			]
		}
	}
}
```

### 2. Smart Dependency Configuration

```json
{
	"tasks": {
		// Shared utilities built first
		"shared#build": {
			"outputs": ["dist/**"]
		},
		// Apps depend on shared
		"@mfe/*#build": {
			"dependsOn": ["shared#build", "^build"]
		}
	}
}
```

### 3. Cache Strategy

```json
{
	"tasks": {
		// Always cache builds
		"build": {
			"cache": true,
			"outputs": ["dist/**"]
		},
		// Never cache dev servers
		"dev": {
			"cache": false,
			"persistent": true
		},
		// Cache test results
		"test": {
			"cache": true,
			"outputs": ["coverage/**"]
		}
	}
}
```

## Debugging Configuration

### Verbose Output

```bash
# See what Turborepo is doing
turbo run build --log-level=debug

# Dry run to preview execution
turbo run build --dry-run

# Show task graph
turbo run build --graph
```

### Cache Analysis

```bash
# Check cache status
turbo run build --dry-run=json

# Force cache miss
turbo run build --force

# Skip cache reads
turbo run build --no-cache

# Skip cache writes
turbo run build --no-cache-write
```

## Next Steps

- [Best Practices](./04-turborepo-best-practices.md)
- [Migration Guide](./05-migration-guide.md)
- [CI/CD Integration](./06-turborepo-cicd.md)
