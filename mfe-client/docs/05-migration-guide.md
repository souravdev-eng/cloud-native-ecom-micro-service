# Migration Guide: From Concurrently to Turborepo

## Current Setup Analysis

Your current setup uses:

- **concurrently**: For running multiple dev servers
- **pnpm**: For package management
- **Manual scripts**: For individual app commands
- **No caching**: Rebuilds everything every time

## Migration Steps

### Phase 1: Preparation (No Breaking Changes)

#### Step 1: Audit Current Scripts

Current scripts in root `package.json`:

```json
{
	"scripts": {
		"dev:user": "cd user && npm run start",
		"dev:dashboard": "cd dashboard && npm run start",
		"dev:admin": "cd admin && npm run start",
		"dev:host": "cd host && npm run start",
		"dev": "concurrently \"npm run dev:user\" \"npm run dev:dashboard\" \"npm run dev:admin\" \"npm run dev:host\""
	}
}
```

#### Step 2: Standardize Package Names

Update each package.json:

```json
// admin/package.json
{
	"name": "@mfe/admin", // Add scoped name
	"version": "0.0.1",
	"scripts": {
		"start": "NODE_ENV=development rspack serve", // Keep existing
		"dev": "NODE_ENV=development rspack serve", // Add standard name
		"build": "NODE_ENV=production rspack build"
	}
}
```

#### Step 3: Create pnpm-workspace.yaml

```yaml
packages:
  - 'admin'
  - 'dashboard'
  - 'user'
  - 'host'
  - 'shared'
```

### Phase 2: Install Turborepo (Non-Breaking)

#### Step 1: Install Dependencies

```bash
# Install turbo
pnpm add -D turbo -w

# Update all dependencies
pnpm install
```

#### Step 2: Create Basic turbo.json

Start with minimal configuration:

```json
{
	"$schema": "https://turbo.build/schema.json",
	"tasks": {
		"build": {
			"outputs": ["dist/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		}
	}
}
```

#### Step 3: Test Turborepo Alongside Existing Scripts

Add new scripts without removing old ones:

```json
{
	"scripts": {
		// Keep existing scripts
		"dev:old": "concurrently \"npm run dev:user\" \"npm run dev:dashboard\" \"npm run dev:admin\" \"npm run dev:host\"",

		// Add Turborepo scripts
		"dev": "turbo run dev",
		"build": "turbo run build"
	}
}
```

### Phase 3: Gradual Migration

#### Step 1: Migrate Development Workflow

```bash
# Test new dev command
pnpm dev

# If successful, update team documentation
# If issues, can still use pnpm dev:old
```

#### Step 2: Migrate Build Process

```bash
# Test build with Turborepo
pnpm build

# Compare output with old build
# Verify all assets are generated correctly
```

#### Step 3: Add More Tasks

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"]
		},
		"dev": {
			"cache": false,
			"persistent": true
		},
		"lint": {
			"outputs": []
		},
		"test": {
			"dependsOn": ["build"],
			"outputs": ["coverage/**"]
		}
	}
}
```

### Phase 4: Optimization

#### Step 1: Configure Dependencies

```json
{
	"tasks": {
		"shared#build": {
			"outputs": ["dist/**"]
		},
		"admin#build": {
			"dependsOn": ["shared#build"],
			"outputs": ["dist/**"]
		},
		"dashboard#build": {
			"dependsOn": ["shared#build"],
			"outputs": ["dist/**"]
		},
		"user#build": {
			"dependsOn": ["shared#build"],
			"outputs": ["dist/**"]
		},
		"host#build": {
			"dependsOn": [
				"admin#build",
				"dashboard#build",
				"user#build",
				"shared#build"
			],
			"outputs": ["dist/**"]
		}
	}
}
```

#### Step 2: Add Caching Configuration

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**", "!dist/**/*.map"],
			"inputs": ["src/**", "!src/**/*.test.*", "!src/**/*.spec.*"],
			"env": ["NODE_ENV"]
		}
	}
}
```

#### Step 3: Set Up Remote Caching

```bash
# Login to Vercel
npx turbo login

# Link repository
npx turbo link

# Or use custom cache
export TURBO_TOKEN="your-token"
export TURBO_TEAM="your-team"
```

### Phase 5: Clean Up

#### Step 1: Remove Old Scripts

After confirming everything works:

```json
{
	"scripts": {
		// Remove old scripts
		// "dev:user": "cd user && npm run start",
		// "dev:dashboard": "cd dashboard && npm run start",

		// Keep Turborepo scripts
		"dev": "turbo run dev",
		"build": "turbo run build"
	}
}
```

#### Step 2: Remove Unnecessary Dependencies

```bash
# Remove concurrently if no longer needed
pnpm remove concurrently -w
```

## Migration Checklist

- [ ] Audit current scripts and dependencies
- [ ] Standardize package names and scripts
- [ ] Create pnpm-workspace.yaml
- [ ] Install Turborepo
- [ ] Create basic turbo.json
- [ ] Test Turborepo commands alongside existing ones
- [ ] Migrate dev workflow
- [ ] Migrate build process
- [ ] Add additional tasks (lint, test)
- [ ] Configure task dependencies
- [ ] Set up caching
- [ ] Set up remote caching (optional)
- [ ] Update CI/CD pipelines
- [ ] Update documentation
- [ ] Remove old scripts and dependencies
- [ ] Train team on new workflow

## Rollback Plan

If issues arise during migration:

1. **Keep old scripts**: Don't delete them immediately
2. **Use feature flags**: Toggle between old and new systems
3. **Gradual rollout**: Migrate one app at a time
4. **Backup configuration**: Keep copies of working configs

```json
// Backup approach
{
	"scripts": {
		"dev": "turbo run dev",
		"dev:legacy": "concurrently ...",
		"dev:safe": "npm run dev || npm run dev:legacy"
	}
}
```

## Common Migration Issues

### Issue 1: Port Conflicts

**Problem**: Multiple apps trying to use the same port

**Solution**: Configure different ports:

```json
// admin/.env
PORT=3001

// dashboard/.env
PORT=3002

// user/.env
PORT=3003

// host/.env
PORT=3000
```

### Issue 2: Module Federation Issues

**Problem**: Module federation not working with Turborepo

**Solution**: Ensure build order:

```json
{
	"tasks": {
		"host#dev": {
			"dependsOn": ["admin#dev", "dashboard#dev", "user#dev"],
			"persistent": true
		}
	}
}
```

### Issue 3: Environment Variables

**Problem**: Environment variables not being picked up

**Solution**: Configure in turbo.json:

```json
{
	"globalEnv": ["NODE_ENV"],
	"tasks": {
		"build": {
			"env": ["API_URL", "PUBLIC_URL"]
		}
	}
}
```

### Issue 4: Cache Invalidation

**Problem**: Changes not being detected

**Solution**: Configure inputs properly:

```json
{
	"tasks": {
		"build": {
			"inputs": ["src/**", "package.json", "tsconfig.json", "rspack.config.ts"]
		}
	}
}
```

## Performance Comparison

### Before (Concurrently)

```
Build time: ~45 seconds
No caching
Sequential builds
Manual dependency management
```

### After (Turborepo)

```
Initial build: ~45 seconds
Cached build: ~5 seconds
Parallel execution
Automatic dependency management
Remote caching available
```

## Next Steps After Migration

1. **Optimize caching**: Fine-tune inputs/outputs
2. **Set up remote caching**: Share cache across team
3. **Add more tasks**: testing, linting, formatting
4. **Integrate with CI/CD**: Update pipelines
5. **Monitor performance**: Track build times
6. **Document workflows**: Update team guides

## Support and Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Migration Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Community Discord](https://turbo.build/discord)
- Internal documentation: `./docs/`
