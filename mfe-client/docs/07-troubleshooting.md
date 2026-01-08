# Turborepo Troubleshooting Guide

## Common Issues and Solutions

### Cache Issues

#### Problem: Cache not working / Always cache miss

**Symptoms:**

- Every build runs from scratch
- `cache miss` shown for all tasks
- Build times not improving

**Solutions:**

1. **Check inputs configuration:**

```json
{
	"tasks": {
		"build": {
			"inputs": [
				"src/**",
				"package.json",
				"tsconfig.json",
				"!**/*.test.*" // Exclude test files
			]
		}
	}
}
```

2. **Verify outputs exist:**

```bash
# Check if output directories exist after build
ls -la admin/dist
ls -la dashboard/dist

# Update turbo.json if paths are different
"outputs": ["dist/**", "build/**"]
```

3. **Check environment variables:**

```json
{
	"tasks": {
		"build": {
			"env": ["NODE_ENV", "API_URL"] // Add all relevant env vars
		}
	}
}
```

4. **Debug cache key:**

```bash
# See what's affecting the cache
turbo run build --dry-run=json | jq '.tasks[0].hash'

# Force rebuild to test
turbo run build --force
```

#### Problem: Cache too aggressive / Not detecting changes

**Solutions:**

1. **Add missing inputs:**

```json
{
	"globalDependencies": ["**/.env.*", "tsconfig.json", "package-lock.json"]
}
```

2. **Clear cache:**

```bash
# Clear local cache
rm -rf .turbo

# Clear specific package cache
rm -rf admin/.turbo
```

3. **Include hidden files:**

```json
"inputs": [
  "src/**",
  ".*rc*",  // Include .eslintrc, .prettierrc, etc.
  ".env*"
]
```

### Build Order Issues

#### Problem: Dependencies not built in correct order

**Symptoms:**

- "Module not found" errors
- Import errors for shared packages
- Race conditions

**Solutions:**

1. **Configure dependencies correctly:**

```json
{
	"tasks": {
		"shared#build": {
			"outputs": ["dist/**"]
		},
		"admin#build": {
			"dependsOn": ["shared#build"],
			"outputs": ["dist/**"]
		}
	}
}
```

2. **Use topological dependencies:**

```json
{
	"tasks": {
		"build": {
			"dependsOn": ["^build"] // Build dependencies first
		}
	}
}
```

3. **Verify with graph:**

```bash
# Visualize dependency graph
turbo run build --graph

# Open graph.html in browser
open graph.html
```

### Port Conflicts

#### Problem: Multiple services trying to use same port

**Solutions:**

1. **Configure unique ports:**

```bash
# admin/.env
PORT=3001

# dashboard/.env
PORT=3002

# user/.env
PORT=3003
```

2. **Use environment variables in scripts:**

```json
{
	"scripts": {
		"dev": "PORT=${PORT:-3001} rspack serve"
	}
}
```

3. **Kill processes using ports:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use script
npx kill-port 3000 3001 3002 3003
```

### Memory Issues

#### Problem: JavaScript heap out of memory

**Solutions:**

1. **Increase Node memory:**

```json
{
	"scripts": {
		"build": "NODE_OPTIONS='--max-old-space-size=4096' turbo run build"
	}
}
```

2. **Limit concurrency:**

```bash
# Limit parallel tasks
turbo run build --concurrency=2

# Or in turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  },
  "globalConcurrency": 2
}
```

3. **Use incremental builds:**

```bash
# Build only changed packages
turbo run build --filter=[origin/main]
```

### Module Federation Issues

#### Problem: Remote modules not loading

**Solutions:**

1. **Ensure correct build order:**

```json
{
	"tasks": {
		"dev": {
			"persistent": true
		},
		"host#dev": {
			"dependsOn": ["admin#dev", "dashboard#dev", "user#dev"],
			"persistent": true
		}
	}
}
```

2. **Configure public paths:**

```javascript
// rspack.config.ts
module.exports = {
	output: {
		publicPath: 'http://localhost:3001/',
	},
};
```

3. **Check module federation config:**

```javascript
// module-federation.config.ts
module.exports = {
	name: 'admin',
	exposes: {
		'./App': './src/App',
	},
	remotes: {
		shared: 'shared@http://localhost:3004/remoteEntry.js',
	},
};
```

### Environment Variable Issues

#### Problem: Environment variables not being passed

**Solutions:**

1. **Configure in turbo.json:**

```json
{
	"globalEnv": ["NODE_ENV"],
	"tasks": {
		"build": {
			"env": ["API_URL", "PUBLIC_*"]
		}
	}
}
```

2. **Use dotenv:**

```bash
# Install dotenv-cli
pnpm add -D dotenv-cli

# Use in scripts
"build": "dotenv -e .env.local -- turbo run build"
```

3. **Pass explicitly:**

```bash
API_URL=https://api.example.com turbo run build
```

### Workspace Issues

#### Problem: Packages not being detected

**Solutions:**

1. **Check pnpm-workspace.yaml:**

```yaml
packages:
  - 'admin'
  - 'dashboard'
  - 'user'
  - 'host'
  - 'shared'
  # Or use glob patterns
  - 'apps/*'
  - 'packages/*'
```

2. **Verify package.json names:**

```json
// Each package must have unique name
{
	"name": "@mfe/admin",
	"version": "0.0.1"
}
```

3. **Reinstall dependencies:**

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### CI/CD Issues

#### Problem: CI builds failing but local works

**Solutions:**

1. **Check Node version:**

```yaml
# .nvmrc
18.17.0

# CI config
- uses: actions/setup-node@v3
  with:
    node-version-file: '.nvmrc'
```

2. **Use frozen lockfile:**

```bash
# CI should use frozen lockfile
pnpm install --frozen-lockfile
```

3. **Set CI environment:**

```yaml
env:
  CI: true
  NODE_ENV: production
```

### Remote Cache Issues

#### Problem: Remote cache not working

**Solutions:**

1. **Verify credentials:**

```bash
# Login to Vercel
npx turbo login

# Link project
npx turbo link

# Test with explicit token
TURBO_TOKEN=xxx turbo run build
```

2. **Check network:**

```bash
# Test connection
curl -I https://api.vercel.com

# Use proxy if needed
export HTTPS_PROXY=http://proxy.example.com:8080
```

3. **Debug remote cache:**

```bash
# Enable debug logging
TURBO_LOG_LEVEL=debug turbo run build

# Check cache status
turbo run build --dry-run
```

## Debugging Commands

### Information Gathering

```bash
# Turbo version
turbo --version

# Workspace info
turbo run build --dry-run

# Dependency graph
turbo run build --graph

# Cache analysis
turbo run build --dry-run=json | jq

# Daemon status
turbo daemon status
```

### Cache Debugging

```bash
# Check cache location
ls -la .turbo

# Cache size
du -sh .turbo

# Clear cache
rm -rf .turbo

# Disable cache
turbo run build --no-cache

# Force rebuild
turbo run build --force
```

### Performance Debugging

```bash
# Profile build
turbo run build --profile

# Measure time
time turbo run build

# Limit concurrency
turbo run build --concurrency=1

# Verbose output
turbo run build --log-level=debug
```

## Error Messages Explained

### "No tasks were executed"

**Cause:** No tasks match the filter or all tasks are cached.

**Solution:**

```bash
# Check filter
turbo run build --filter=admin --dry-run

# Force execution
turbo run build --force
```

### "Could not find package"

**Cause:** Package not in workspace or incorrectly named.

**Solution:**

```bash
# List all packages
turbo run build --dry-run

# Check package.json name field
cat admin/package.json | grep name
```

### "Workspace not found"

**Cause:** Not in a Turborepo project or missing configuration.

**Solution:**

```bash
# Check for turbo.json
ls turbo.json

# Initialize Turborepo
npx turbo init
```

## Prevention Strategies

### 1. Use Strict Configuration

```json
{
	"$schema": "https://turbo.build/schema.json",
	"tasks": {
		"build": {
			"dependsOn": ["^build"],
			"outputs": ["dist/**"],
			"inputs": ["src/**", "!**/*.test.*"],
			"env": ["NODE_ENV"]
		}
	}
}
```

### 2. Add Validation Scripts

```json
{
	"scripts": {
		"validate": "turbo run build --dry-run",
		"graph": "turbo run build --graph",
		"clean": "turbo run clean && rm -rf .turbo"
	}
}
```

### 3. Monitor Performance

```bash
#!/bin/bash
# monitor.sh

echo "Running build performance test..."
START=$(date +%s)
turbo run build
END=$(date +%s)
DIFF=$((END - START))
echo "Build took $DIFF seconds"

# Check cache hits
turbo run build --dry-run=json | jq '.tasks[] | select(.cache.status == "HIT") | .package'
```

### 4. Regular Maintenance

```bash
# Weekly maintenance
npm update turbo
pnpm update
rm -rf .turbo
turbo daemon stop
turbo daemon clean
```

## Getting Help

### Resources

1. **Official Documentation:** https://turbo.build/repo/docs
2. **GitHub Issues:** https://github.com/vercel/turbo/issues
3. **Discord Community:** https://turbo.build/discord
4. **Stack Overflow:** Tag with `turborepo`

### Reporting Issues

When reporting issues, include:

1. **Environment:**

```bash
turbo --version
node --version
pnpm --version
```

2. **Configuration:**

- turbo.json
- package.json scripts
- Error messages

3. **Reproduction:**

- Minimal reproducible example
- Steps to reproduce
- Expected vs actual behavior

## Next Steps

- [Performance Tuning](./08-performance-tuning.md)
- [Advanced Patterns](./09-advanced-patterns.md)
- [Team Workflows](./10-team-workflows.md)
