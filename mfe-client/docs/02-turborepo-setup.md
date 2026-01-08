# Turborepo Setup Guide

## Prerequisites

- Node.js 18.0.0 or later
- pnpm 8.0.0 or later (already installed in our project)
- Git

## Installation Steps

### Step 1: Install Turborepo

```bash
# Install turbo as a dev dependency in the root workspace
pnpm add -D turbo -w
```

### Step 2: Create turbo.json Configuration

Create a `turbo.json` file in the root of mfe-client:

```json
{
	"$schema": "https://turbo.build/schema.json",
	"globalDependencies": ["**/.env.*local"],
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**", ".next/**", "build/**"],
			"env": ["NODE_ENV"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		},
		"lint": {
			"outputs": [],
			"inputs": [
				"**/*.ts",
				"**/*.tsx",
				"**/*.js",
				"**/*.jsx",
				"**/*.json",
				"**/*.css",
				"**/*.scss"
			]
		},
		"test": {
			"dependsOn": ["build"],
			"outputs": ["coverage/**"],
			"inputs": ["src/**", "test/**", "tests/**", "**/*.test.*", "**/*.spec.*"]
		},
		"format": {
			"outputs": [],
			"cache": false
		},
		"type-check": {
			"dependsOn": ["^build"],
			"outputs": []
		}
	}
}
```

### Step 3: Update Root package.json

Modify the root `package.json` to use Turborepo:

```json
{
	"name": "mfe-client",
	"private": true,
	"workspaces": ["admin", "dashboard", "user", "host", "shared"],
	"scripts": {
		"build": "turbo run build",
		"dev": "turbo run dev",
		"lint": "turbo run lint",
		"test": "turbo run test",
		"format": "turbo run format",
		"type-check": "turbo run type-check",
		"clean": "turbo run clean",

		// Specific app commands
		"dev:admin": "turbo run dev --filter=admin",
		"dev:dashboard": "turbo run dev --filter=dashboard",
		"dev:user": "turbo run dev --filter=user",
		"dev:host": "turbo run dev --filter=host",

		// Build specific apps
		"build:admin": "turbo run build --filter=admin",
		"build:dashboard": "turbo run build --filter=dashboard",
		"build:user": "turbo run build --filter=user",
		"build:host": "turbo run build --filter=host",

		// Utility commands
		"clean:cache": "rm -rf .turbo node_modules/.cache",
		"graph": "turbo run build --graph",
		"info": "turbo daemon status"
	},
	"devDependencies": {
		"turbo": "^2.0.0"
	}
}
```

### Step 4: Configure Individual Package Scripts

Ensure each package has consistent script names:

**admin/package.json**:

```json
{
	"name": "@mfe/admin",
	"scripts": {
		"dev": "NODE_ENV=development rspack serve",
		"build": "NODE_ENV=production rspack build",
		"lint": "eslint . --ext .ts,.tsx",
		"type-check": "tsc --noEmit",
		"clean": "rm -rf dist .turbo"
	}
}
```

**dashboard/package.json**:

```json
{
	"name": "@mfe/dashboard",
	"scripts": {
		"dev": "NODE_ENV=development rspack serve",
		"build": "NODE_ENV=production rspack build",
		"lint": "eslint . --ext .ts,.tsx",
		"type-check": "tsc --noEmit",
		"clean": "rm -rf dist .turbo"
	}
}
```

### Step 5: Set Up pnpm Workspaces

Create or update `pnpm-workspace.yaml`:

```yaml
packages:
  - 'admin'
  - 'dashboard'
  - 'user'
  - 'host'
  - 'shared'
```

### Step 6: Configure Environment Variables

Create `.env.local` files for each package if needed:

```bash
# admin/.env.local
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Admin Panel

# dashboard/.env.local
VITE_API_URL=http://localhost:3002
VITE_APP_NAME=Dashboard
```

### Step 7: Set Up Remote Caching (Optional)

For team collaboration, set up remote caching:

```bash
# Using Vercel Remote Cache
npx turbo login
npx turbo link

# Or configure custom remote cache
turbo run build --team="your-team" --token="your-token"
```

## Verification

### Test the Setup

```bash
# Run all builds in parallel
pnpm build

# Run development servers
pnpm dev

# Build specific app with dependencies
pnpm build:admin

# Check the dependency graph
pnpm graph

# Run linting across all packages
pnpm lint
```

### Expected Output

```bash
$ pnpm build
• Packages in scope: admin, dashboard, host, shared, user
• Running build in 5 packages
• Remote caching disabled
shared:build: cache miss, executing...
admin:build: cache miss, executing...
dashboard:build: cache miss, executing...
user:build: cache miss, executing...
host:build: cache miss, executing...

Tasks:    5 successful, 5 total
Cached:   0 cached, 5 total
Time:     12.5s
```

## Directory Structure After Setup

```
mfe-client/
├── .turbo/              # Turborepo cache
├── turbo.json           # Turborepo configuration
├── pnpm-workspace.yaml  # pnpm workspace config
├── package.json         # Root package with turbo scripts
├── admin/
│   ├── package.json
│   └── ...
├── dashboard/
│   ├── package.json
│   └── ...
├── user/
│   ├── package.json
│   └── ...
├── host/
│   ├── package.json
│   └── ...
└── shared/
    ├── package.json
    └── ...
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure each app uses different ports
2. **Cache issues**: Run `pnpm clean:cache` to clear cache
3. **Dependency issues**: Run `pnpm install` after configuration changes
4. **Build order issues**: Check `dependsOn` in turbo.json

### Debug Commands

```bash
# View detailed logs
turbo run build --log-level=debug

# Dry run to see what would be executed
turbo run build --dry-run

# Force rebuild without cache
turbo run build --force

# Check daemon status
turbo daemon status

# Stop daemon
turbo daemon stop
```

## Next Steps

- [Configuration Deep Dive](./03-turborepo-configuration.md)
- [Best Practices](./04-turborepo-best-practices.md)
- [CI/CD Integration](./06-turborepo-cicd.md)
