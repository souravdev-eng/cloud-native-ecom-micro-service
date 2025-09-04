# Installation Scripts for @ecom-micro/common

This directory contains scripts to help you install the `@ecom-micro/common` package across your microservices modules.

## Available Scripts

### 1. Install in All Modules (`install-common-all.sh`)

Installs `@ecom-micro/common` in all microservice modules at once.

**Usage:**

```bash
# Install latest version in all modules
./scripts/install-common-all.sh

# Install specific version in all modules
./scripts/install-common-all.sh 2.0.48
```

**Supported Modules:**

- auth
- cart
- notification
- order
- product

### 2. Selective Installation (`install-common-selective.sh`)

Installs `@ecom-micro/common` in specific modules of your choice.

**Usage:**

```bash
# Install latest version in specific modules
./scripts/install-common-selective.sh auth cart

# Install specific version in specific modules
./scripts/install-common-selective.sh 2.0.48 product order

# Install latest version in single module
./scripts/install-common-selective.sh notification
```

**Arguments:**

- `version` (optional): Version of @ecom-micro/common to install (default: latest)
- `moduleN`: One or more module names to install the package in

**Available Modules:**

- `auth` - Authentication service
- `cart` - Shopping cart service
- `notification` - Notification service
- `order` - Order management service
- `product` - Product catalog service

### 3. Convenience Update Script (`update-common.sh`)

Provides shortcuts for common update scenarios with simple commands.

**Usage:**

```bash
# Update all modules
./scripts/update-common.sh all

# Update specific module
./scripts/update-common.sh auth

# Update all backend services
./scripts/update-common.sh backend

# Update with specific version
./scripts/update-common.sh all 2.0.48
```

**Available Commands:**

- `all` - Update all modules
- `auth` - Update auth module only
- `cart` - Update cart module only
- `product` - Update product module only
- `order` - Update order module only
- `notification` - Update notification module only
- `backend` - Update all backend services

### 4. Version Check Script (`check-common-versions.sh`)

Displays current versions of `@ecom-micro/common` across all modules and compares with the latest available version.

**Usage:**

```bash
# Check versions across all modules
./scripts/check-common-versions.sh
```

**Features:**

- Shows current version in each module
- Compares with latest available version from npm
- Provides colored status indicators
- Suggests update commands for outdated modules

### 5. NPM Scripts (`package.json`)

For convenience, you can also use npm scripts from the scripts directory:

```bash
# Navigate to scripts directory
cd scripts

# Run any of the npm scripts
npm run install:all
npm run install:auth
npm run update:backend
npm run help
```

## Features

### 🔧 **Auto Package Manager Detection**

The scripts automatically detect and use the appropriate package manager for each module:

- **npm** - when `package-lock.json` is present
- **yarn** - when `yarn.lock` is present
- **pnpm** - when `pnpm-lock.yaml` is present

### 🎨 **Colored Output**

- 🔵 **Blue** - Information messages
- 🟢 **Green** - Success messages
- 🟡 **Yellow** - Warning messages
- 🔴 **Red** - Error messages

### 📊 **Installation Summary**

Each script provides a detailed summary showing:

- Number of successful installations
- Failed installations (if any)
- Overall status

### 🛡️ **Error Handling**

- Validates module names before installation
- Checks for package.json existence
- Provides clear error messages
- Exits with appropriate status codes

## Examples

### Install Latest Version in All Modules

```bash
./scripts/install-common-all.sh
```

### Install Specific Version in All Modules

```bash
./scripts/install-common-all.sh 2.0.48
```

### Install Latest in Auth and Cart Only

```bash
./scripts/install-common-selective.sh auth cart
```

### Install Specific Version in Product Service

```bash
./scripts/install-common-selective.sh 2.0.48 product
```

### Install Latest in Multiple Services

```bash
./scripts/install-common-selective.sh auth cart order notification
```

## Prerequisites

Before running these scripts, ensure:

1. **Permissions**: Make the scripts executable

   ```bash
   chmod +x scripts/install-common-all.sh
   chmod +x scripts/install-common-selective.sh
   ```

2. **Package Managers**: Have the required package managers installed

   - npm (usually comes with Node.js)
   - yarn (if any modules use it)
   - pnpm (if any modules use it)

3. **Network Access**: Ensure you can access npm registry to download packages

4. **Working Directory**: Run scripts from the project root directory

## Troubleshooting

### Common Issues

**Permission Denied:**

```bash
chmod +x scripts/install-common-all.sh
chmod +x scripts/install-common-selective.sh
```

**Module Not Found:**

- Ensure the module directory exists
- Check that you're running from the project root
- Verify the module name is correct (case-sensitive)

**Package Manager Not Found:**

- Install the required package manager (npm/yarn/pnpm)
- Check your PATH environment variable

**Network Issues:**

- Check internet connectivity
- Verify npm registry access
- Try using a different registry if needed

### Getting Help

For issues with the scripts:

1. Check the colored output for specific error messages
2. Ensure you're in the correct directory
3. Verify all prerequisites are met
4. Check the installation summary for detailed results

## Script Maintenance

When adding new microservice modules:

1. Add the module name to the `MODULES` array in `install-common-all.sh`
2. Add the module name to the validation list in `install-common-selective.sh`
3. Update this README with the new module information

## Version Information

- **Script Version**: 1.0.0
- **Compatible with**: @ecom-micro/common v2.0.0+
- **Node.js**: 14.x or higher recommended
- **Package Managers**: npm 6+, yarn 1.x+, pnpm 6+
