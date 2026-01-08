# Turborepo Best Practices

## Project Structure Best Practices

### 1. Consistent Package Naming

Use a consistent naming convention for packages:

```json
// Good: Scoped packages
"@mfe/admin"
"@mfe/dashboard"
"@mfe/user"
"@mfe/shared"

// Bad: Inconsistent naming
"admin-app"
"dashboard"
"user_module"
```

### 2. Organized Workspace Structure

```
mfe-client/
├── apps/                 # Application packages
│   ├── admin/
│   ├── dashboard/
│   ├── host/
│   └── user/
├── packages/            # Shared packages
│   ├── ui/             # Shared UI components
│   ├── utils/          # Shared utilities
│   ├── config/         # Shared configurations
│   └── types/          # Shared TypeScript types
├── docs/               # Documentation
├── scripts/            # Build scripts
├── turbo.json         # Turborepo config
└── package.json       # Root package.json
```

### 3. Dependency Management

```json
// packages/ui/package.json
{
  "name": "@mfe/ui",
  "dependencies": {
    "react": "^19.0.0"  // Shared dependencies
  }
}

// apps/admin/package.json
{
  "name": "@mfe/admin",
  "dependencies": {
    "@mfe/ui": "workspace:*",  // Internal dependencies
    "@mfe/utils": "workspace:*"
  }
}
```

## Task Configuration Best Practices

### 1. Task Naming Conventions

Use consistent, descriptive task names:

```json
{
	"scripts": {
		// Development
		"dev": "start development server",
		"dev:debug": "start with debugging",

		// Building
		"build": "production build",
		"build:dev": "development build",
		"build:analyze": "build with bundle analysis",

		// Testing
		"test": "run tests",
		"test:watch": "run tests in watch mode",
		"test:coverage": "run tests with coverage",

		// Quality checks
		"lint": "run linter",
		"lint:fix": "fix linting issues",
		"type-check": "check TypeScript types",
		"format": "format code",

		// Utilities
		"clean": "clean build artifacts",
		"prebuild": "tasks before build"
	}
}
```

### 2. Task Dependencies

Structure dependencies for optimal parallelization:

```json
{
	"tasks": {
		// Build shared packages first
		"@mfe/ui#build": {
			"outputs": ["dist/**"]
		},
		"@mfe/utils#build": {
			"outputs": ["dist/**"]
		},

		// Apps depend on shared packages
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"]
		},

		// Tests can run after build
		"test": {
			"dependsOn": ["build"],
			"outputs": ["coverage/**"]
		},

		// Linting can run in parallel
		"lint": {
			"outputs": []
		}
	}
}
```

### 3. Cache Optimization

Configure caching for maximum efficiency:

```json
{
	"tasks": {
		"build": {
			// Be specific about inputs
			"inputs": [
				"src/**/*.{ts,tsx,js,jsx}",
				"!src/**/*.test.*",
				"!src/**/*.spec.*",
				"!src/**/*.stories.*",
				"package.json",
				"tsconfig.json"
			],
			// Be specific about outputs
			"outputs": [
				"dist/**",
				"!dist/**/*.map" // Exclude source maps from cache
			],
			// Include relevant env vars
			"env": ["NODE_ENV", "PUBLIC_*"]
		}
	}
}
```

## Development Workflow Best Practices

### 1. Local Development Setup

```bash
# Install dependencies once
pnpm install

# Start specific app with dependencies
pnpm dev --filter=admin...

# Start multiple apps
pnpm dev --filter=admin --filter=dashboard

# Start everything
pnpm dev
```

### 2. Testing Strategy

```json
{
	"tasks": {
		// Unit tests - fast, cached
		"test:unit": {
			"outputs": ["coverage/unit/**"],
			"cache": true
		},

		// Integration tests - slower
		"test:integration": {
			"dependsOn": ["build"],
			"outputs": ["coverage/integration/**"],
			"cache": true
		},

		// E2E tests - no cache
		"test:e2e": {
			"dependsOn": ["build"],
			"cache": false
		}
	}
}
```

### 3. Incremental Migration

When migrating existing projects:

```bash
# Phase 1: Basic setup
npm install -D turbo
echo '{"tasks": {"build": {"outputs": ["dist/**"]}}}' > turbo.json

# Phase 2: Add more tasks
turbo run build --dry-run  # Test configuration

# Phase 3: Optimize caching
turbo run build --graph     # Analyze dependencies

# Phase 4: Add remote caching
turbo login && turbo link
```

## Performance Best Practices

### 1. Minimize Inputs

```json
{
	"tasks": {
		"build": {
			"inputs": [
				// Only include necessary files
				"src/**/*.{ts,tsx}",
				"!**/*.test.*",
				"!**/*.md",
				"!**/fixtures/**",
				"!**/mocks/**"
			]
		}
	}
}
```

### 2. Optimize Output Caching

```json
{
	"tasks": {
		"build": {
			"outputs": [
				"dist/**",
				// Don't cache temporary files
				"!dist/.cache/**",
				"!dist/**/*.map",
				"!dist/stats.json"
			]
		}
	}
}
```

### 3. Use Remote Caching

```bash
# Set up Vercel Remote Cache
npx turbo login
npx turbo link

# Or use custom remote cache
TURBO_TOKEN=xxx TURBO_TEAM=yyy turbo run build
```

## CI/CD Best Practices

### 1. GitHub Actions Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ vars.TURBO_TEAM }}

      - name: Test
        run: pnpm test

      - name: Lint
        run: pnpm lint
```

### 2. Optimize CI Builds

```json
{
	"tasks": {
		"ci": {
			"dependsOn": ["build", "test", "lint", "type-check"]
		},
		"ci:changed": {
			// Only run on changed packages
			"dependsOn": ["build", "test"],
			"cache": true
		}
	}
}
```

### 3. Docker Integration

```dockerfile
# Dockerfile with Turborepo
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm turbo

# Copy workspace files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build with Turborepo
RUN turbo run build --filter=admin

# Production stage
FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
```

## Debugging Best Practices

### 1. Debugging Commands

```bash
# Verbose logging
turbo run build --log-level=debug

# Analyze task graph
turbo run build --graph

# Check what would run
turbo run build --dry-run

# Output execution details as JSON
turbo run build --dry-run=json

# Force rebuild
turbo run build --force

# Check daemon status
turbo daemon status
```

### 2. Cache Debugging

```bash
# Check cache hits/misses
turbo run build --dry-run | grep "cache"

# Clear cache
rm -rf .turbo

# Disable cache for debugging
turbo run build --no-cache

# Check cache size
du -sh .turbo
```

### 3. Common Issues and Solutions

| Issue             | Solution                            |
| ----------------- | ----------------------------------- |
| Cache not working | Check inputs/outputs configuration  |
| Slow builds       | Optimize inputs, use remote caching |
| Port conflicts    | Use different ports per app         |
| Dependency issues | Check `dependsOn` configuration     |
| Memory issues     | Increase Node heap size             |

## Security Best Practices

### 1. Environment Variables

```json
{
	"globalEnv": [
		"NODE_ENV" // Only include necessary vars
	],
	"tasks": {
		"build": {
			"env": [
				"PUBLIC_*", // Only public vars
				"!*SECRET*", // Exclude secrets
				"!*TOKEN*", // Exclude tokens
				"!*KEY*" // Exclude keys
			]
		}
	}
}
```

### 2. Git Security

```gitignore
# .gitignore
.turbo
.env*.local
*.log
dist/
build/
node_modules/
```

### 3. Remote Cache Security

```bash
# Use environment variables for tokens
export TURBO_TOKEN="your-secure-token"
export TURBO_TEAM="your-team"

# Never commit tokens
echo "TURBO_TOKEN=xxx" >> .env.local
```

## Monitoring and Metrics

### 1. Build Performance Tracking

```bash
# Measure build time
time turbo run build

# Generate performance report
turbo run build --profile

# Analyze bundle size
turbo run build:analyze
```

### 2. Cache Effectiveness

```bash
# Check cache hit rate
turbo run build --dry-run=json | jq '.tasks[].cache'

# Monitor cache size
watch -n 5 'du -sh .turbo'
```

## Next Steps

- [Migration Guide](./05-migration-guide.md)
- [CI/CD Integration](./06-turborepo-cicd.md)
- [Troubleshooting Guide](./07-troubleshooting.md)
