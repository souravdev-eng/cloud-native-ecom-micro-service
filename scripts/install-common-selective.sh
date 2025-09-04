#!/bin/bash

# Script to install @ecom-micro/common package in specific modules
# Usage: ./scripts/install-common-selective.sh [version] module1 [module2] [module3] ...
# Example: ./scripts/install-common-selective.sh latest auth cart
# Example: ./scripts/install-common-selective.sh 2.0.48 product
# Example: ./scripts/install-common-selective.sh auth cart (uses latest version)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [version] module1 [module2] [module3] ..."
    echo ""
    echo "Arguments:"
    echo "  version    Optional. Version of @ecom-micro/common to install (default: latest)"
    echo "  moduleN    Module names to install the package in"
    echo ""
    echo "Available modules:"
    echo "  auth, cart, notification, order, product"
    echo ""
    echo "Examples:"
    echo "  $0 latest auth cart          # Install latest version in auth and cart"
    echo "  $0 2.0.48 product           # Install specific version in product"
    echo "  $0 auth cart notification   # Install latest version in multiple modules"
}

# Function to detect package manager
detect_package_manager() {
    local module_path=$1
    
    if [[ -f "$module_path/pnpm-lock.yaml" ]]; then
        echo "pnpm"
    elif [[ -f "$module_path/yarn.lock" ]]; then
        echo "yarn"
    elif [[ -f "$module_path/package-lock.json" ]]; then
        echo "npm"
    else
        echo "npm" # default fallback
    fi
}

# Function to validate module name
is_valid_module() {
    local module=$1
    local valid_modules=("auth" "cart" "notification" "order" "product")
    
    for valid in "${valid_modules[@]}"; do
        if [[ "$module" == "$valid" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to install package in a module
install_in_module() {
    local module_name=$1
    local module_path=$2
    local version=$3
    
    if [[ ! -d "$module_path" ]]; then
        print_error "Module directory '$module_name' not found"
        return 1
    fi
    
    if [[ ! -f "$module_path/package.json" ]]; then
        print_error "No package.json found in $module_name"
        return 1
    fi
    
    print_status "Installing @ecom-micro/common@$version in $module_name..."
    
    # Detect package manager
    local pkg_manager=$(detect_package_manager "$module_path")
    print_status "Using $pkg_manager for $module_name"
    
    # Change to module directory
    cd "$module_path"
    
    # Install based on package manager
    case $pkg_manager in
        "pnpm")
            if [[ "$version" == "latest" ]]; then
                pnpm add @ecom-micro/common@latest
            else
                pnpm add @ecom-micro/common@$version
            fi
            ;;
        "yarn")
            if [[ "$version" == "latest" ]]; then
                yarn add @ecom-micro/common@latest
            else
                yarn add @ecom-micro/common@$version
            fi
            ;;
        "npm")
            if [[ "$version" == "latest" ]]; then
                npm install @ecom-micro/common@latest
            else
                npm install @ecom-micro/common@$version
            fi
            ;;
    esac
    
    if [[ $? -eq 0 ]]; then
        print_success "Successfully installed @ecom-micro/common@$version in $module_name"
        return 0
    else
        print_error "Failed to install @ecom-micro/common@$version in $module_name"
        return 1
    fi
}

# Main execution
if [[ $# -eq 0 ]]; then
    print_error "No arguments provided"
    show_usage
    exit 1
fi

# Parse arguments
VERSION=""
MODULES=()

# Check if first argument is a version or module
if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ "$1" == "latest" ]]; then
    VERSION=$1
    shift
else
    VERSION="latest"
fi

# Remaining arguments are modules
MODULES=("$@")

if [[ ${#MODULES[@]} -eq 0 ]]; then
    print_error "No modules specified"
    show_usage
    exit 1
fi

# Validate all modules first
for module in "${MODULES[@]}"; do
    if ! is_valid_module "$module"; then
        print_error "Invalid module name: $module"
        print_status "Valid modules are: auth, cart, notification, order, product"
        exit 1
    fi
done

print_status "Starting installation of @ecom-micro/common@$VERSION in selected modules..."

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Track installation results
SUCCESS_COUNT=0
FAILED_MODULES=()

# Install in each specified module
for module in "${MODULES[@]}"; do
    if install_in_module "$module" "$ROOT_DIR/$module" "$VERSION"; then
        ((SUCCESS_COUNT++))
    else
        FAILED_MODULES+=("$module")
    fi
    echo # Add blank line for readability
done

# Summary
echo "=================================="
print_status "Installation Summary:"
print_success "Successfully installed in $SUCCESS_COUNT out of ${#MODULES[@]} modules"

if [[ ${#FAILED_MODULES[@]} -gt 0 ]]; then
    print_error "Failed installations in: ${FAILED_MODULES[*]}"
    exit 1
else
    print_success "All installations completed successfully!"
fi
