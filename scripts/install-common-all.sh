#!/bin/bash

# Script to install @ecom-micro/common package in all modules
# Usage: ./scripts/install-common-all.sh [version]
# Example: ./scripts/install-common-all.sh latest
# Example: ./scripts/install-common-all.sh 2.0.48

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default version
VERSION=${1:-"latest"}

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

# Function to install package in a module
install_in_module() {
    local module_name=$1
    local module_path=$2
    
    if [[ ! -f "$module_path/package.json" ]]; then
        print_warning "No package.json found in $module_name, skipping..."
        return
    fi
    
    print_status "Installing @ecom-micro/common@$VERSION in $module_name..."
    
    # Detect package manager
    local pkg_manager=$(detect_package_manager "$module_path")
    print_status "Using $pkg_manager for $module_name"
    
    # Change to module directory
    cd "$module_path"
    
    # Install based on package manager
    case $pkg_manager in
        "pnpm")
            if [[ "$VERSION" == "latest" ]]; then
                pnpm add @ecom-micro/common@latest
            else
                pnpm add @ecom-micro/common@$VERSION
            fi
            ;;
        "yarn")
            if [[ "$VERSION" == "latest" ]]; then
                yarn add @ecom-micro/common@latest
            else
                yarn add @ecom-micro/common@$VERSION
            fi
            ;;
        "npm")
            if [[ "$VERSION" == "latest" ]]; then
                npm install @ecom-micro/common@latest
            else
                npm install @ecom-micro/common@$VERSION
            fi
            ;;
    esac
    
    if [[ $? -eq 0 ]]; then
        print_success "Successfully installed @ecom-micro/common@$VERSION in $module_name"
    else
        print_error "Failed to install @ecom-micro/common@$VERSION in $module_name"
        return 1
    fi
    
    # Go back to root directory
    cd - > /dev/null
}

# Main execution
print_status "Starting installation of @ecom-micro/common@$VERSION in all modules..."

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Define modules that use the common package (excluding common itself and non-Node.js modules)
MODULES=(
    "auth"
    "cart"
    "notification"
    "order"
    "product"
)

# Track installation results
SUCCESS_COUNT=0
FAILED_MODULES=()

# Install in each module
for module in "${MODULES[@]}"; do
    if [[ -d "$module" ]]; then
        if install_in_module "$module" "$ROOT_DIR/$module"; then
            ((SUCCESS_COUNT++))
        else
            FAILED_MODULES+=("$module")
        fi
        echo # Add blank line for readability
    else
        print_warning "Module directory '$module' not found, skipping..."
    fi
done

# Summary
echo "=================================="
print_status "Installation Summary:"
print_success "Successfully installed in $SUCCESS_COUNT modules"

if [[ ${#FAILED_MODULES[@]} -gt 0 ]]; then
    print_error "Failed installations in: ${FAILED_MODULES[*]}"
    exit 1
else
    print_success "All installations completed successfully!"
fi
