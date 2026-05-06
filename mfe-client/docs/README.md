# Turborepo Documentation

Welcome to the Turborepo documentation for our micro-frontend architecture! This documentation will help you understand, set up, and effectively use Turborepo in our monorepo.

## 📚 Documentation Structure

### Getting Started

1. **[Introduction to Turborepo](./01-turborepo-introduction.md)** - What is Turborepo and why we use it
2. **[Setup Guide](./02-turborepo-setup.md)** - Step-by-step installation and configuration
3. **[Configuration Deep Dive](./03-turborepo-configuration.md)** - Understanding turbo.json and advanced configurations

### Development

4. **[Best Practices](./04-turborepo-best-practices.md)** - Recommended patterns and workflows
5. **[Migration Guide](./05-migration-guide.md)** - Migrating from Concurrently to Turborepo

### Operations

6. **[CI/CD Integration](./06-turborepo-cicd.md)** - Setting up Turborepo in CI/CD pipelines
7. **[Troubleshooting](./07-troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Installation

```bash
# Install dependencies (including Turborepo)
pnpm install

# Run all development servers
pnpm dev

# Build all packages
pnpm build
```

## 📦 Our Workspace Structure

```
mfe-client/
├── apps/
│   ├── admin/        # Admin panel (@mfe/admin)
│   ├── dashboard/    # Product dashboard (@mfe/dashboard)
│   ├── user/         # User module (@mfe/user)
│   └── host/         # Host application (@mfe/host)
├── packages/
│   └── shared/       # Shared components (@mfe/shared)
├── docs/            # This documentation
├── turbo.json       # Turborepo configuration
└── package.json     # Root workspace configuration
```

## 🎯 Common Commands

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev:admin
pnpm dev:dashboard
pnpm dev:user
pnpm dev:host

# Start multiple specific apps
pnpm turbo run dev --filter=admin --filter=dashboard
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:admin

# Build with dependencies
pnpm turbo run build --filter=admin...

# Build only changed packages
pnpm turbo run build --filter=[origin/main]
```

### Testing & Quality

```bash
# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type checking
pnpm type-check
```

### Utilities

```bash
# Clean build artifacts and cache
pnpm clean
pnpm clean:cache

# View dependency graph
pnpm graph

# Check Turborepo daemon status
pnpm info
```

## 🔄 Migration Status

We've successfully migrated from Concurrently to Turborepo! Here's what's changed:

### Before (Concurrently)

- Sequential builds
- No caching
- Slower CI/CD
- Manual dependency management

### After (Turborepo)

- ✅ Parallel builds
- ✅ Intelligent caching
- ✅ 3-5x faster builds
- ✅ Automatic dependency management
- ✅ Remote caching support

### Fallback Option

If you encounter issues, you can still use the legacy setup:

```bash
pnpm dev:legacy  # Uses old Concurrently setup
```

## 🏗️ Architecture Benefits

### 1. **Incremental Builds**

Only rebuilds what has changed, using intelligent caching.

### 2. **Parallel Execution**

Runs independent tasks simultaneously, maximizing CPU usage.

### 3. **Smart Dependencies**

Automatically understands and respects package dependencies.

### 4. **Remote Caching**

Share build cache across team members and CI/CD.

## 📊 Performance Improvements

| Metric       | Before (Concurrently) | After (Turborepo) | Improvement     |
| ------------ | --------------------- | ----------------- | --------------- |
| Cold Build   | ~45s                  | ~45s              | Same (expected) |
| Cached Build | ~45s                  | ~5s               | 9x faster       |
| CI/CD Build  | ~10min                | ~3min             | 3.3x faster     |
| Dev Startup  | ~30s                  | ~10s              | 3x faster       |

## 🛠️ Troubleshooting Quick Reference

### Cache Issues

```bash
# Clear cache
rm -rf .turbo

# Force rebuild
pnpm turbo run build --force

# Debug cache
pnpm turbo run build --dry-run
```

### Port Conflicts

```bash
# Kill process on port
npx kill-port 3000 3001 3002 3003
```

### Memory Issues

```bash
# Increase Node memory
NODE_OPTIONS='--max-old-space-size=4096' pnpm build
```

## 🤝 Contributing

When adding new packages:

1. Add package to `pnpm-workspace.yaml`
2. Use scoped name: `@mfe/package-name`
3. Add standard scripts (build, dev, lint, etc.)
4. Update `turbo.json` if special configuration needed

## 📚 Learn More

- [Official Turborepo Docs](https://turbo.build/repo/docs)
- [Turborepo Examples](https://github.com/vercel/turbo/tree/main/examples)
- [Discord Community](https://turbo.build/discord)

## 🆘 Getting Help

1. Check the [Troubleshooting Guide](./07-troubleshooting.md)
2. Search existing issues
3. Ask in team chat
4. Create a GitHub issue with:
   - Environment details
   - Error messages
   - Steps to reproduce

## 📈 Next Steps

1. **For Developers**: Start with the [Setup Guide](./02-turborepo-setup.md)
2. **For DevOps**: Check [CI/CD Integration](./06-turborepo-cicd.md)
3. **For Team Leads**: Review [Best Practices](./04-turborepo-best-practices.md)

---

**Last Updated**: January 2025
**Maintained By**: Development Team
