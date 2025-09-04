# Quick Reference - @ecom-micro/common Scripts

## 🚀 Most Common Commands

```bash
# Check current versions across all modules
./scripts/check-common-versions.sh

# Update all modules to latest version
./scripts/update-common.sh all

# Update specific modules
./scripts/update-common.sh auth cart

# Install latest in all modules
./scripts/install-common-all.sh

# Install specific version in selected modules
./scripts/install-common-selective.sh 2.0.48 auth product
```

## 📋 Available Scripts

| Script | Purpose | Quick Usage |
| --- | --- | --- |
| `check-common-versions.sh` | Check versions across modules | `./scripts/check-common-versions.sh` |
| `install-common-all.sh` | Install in all modules | `./scripts/install-common-all.sh [version]` |
| `install-common-selective.sh` | Install in specific modules | `./scripts/install-common-selective.sh [version] module1 module2` |
| `update-common.sh` | Convenience update script | `./scripts/update-common.sh <command> [version]` |

## 🎯 Update Commands (Convenience Script)

| Command        | Description                     |
| -------------- | ------------------------------- |
| `all`          | Update all modules              |
| `auth`         | Update auth module only         |
| `cart`         | Update cart module only         |
| `product`      | Update product module only      |
| `order`        | Update order module only        |
| `notification` | Update notification module only |
| `backend`      | Update all backend services     |

## 🏗️ Available Modules

- **auth** - Authentication service
- **cart** - Shopping cart service
- **notification** - Notification service
- **order** - Order management service
- **product** - Product catalog service

## 💡 Pro Tips

1. **Always check versions first**: `./scripts/check-common-versions.sh`
2. **Use the convenience script**: `./scripts/update-common.sh` for quick updates
3. **Test with specific modules first** before updating all
4. **Scripts auto-detect package managers** (npm/yarn/pnpm)

## 📦 NPM Scripts Alternative

```bash
cd scripts
npm run help                  # Show available npm scripts
npm run install:all          # Install in all modules
npm run update:backend       # Update all backend services
```

---

📖 **Full documentation**: See [README.md](./README.md) for complete details
