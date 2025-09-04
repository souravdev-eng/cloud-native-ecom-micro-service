#!/bin/bash

# Convenience script for common update scenarios
# This script provides shortcuts for the most common use cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

show_usage() {
    echo "Quick Update Script for @ecom-micro/common"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  all [version]           Update all modules to latest or specific version"
    echo "  auth [version]          Update auth module only"
    echo "  cart [version]          Update cart module only"
    echo "  product [version]       Update product module only"
    echo "  order [version]         Update order module only"
    echo "  notification [version]  Update notification module only"
    echo "  backend [version]       Update all backend services (auth, cart, product, order, notification)"
    echo ""
    echo "Examples:"
    echo "  $0 all                  # Update all modules to latest"
    echo "  $0 all 2.0.48          # Update all modules to specific version"
    echo "  $0 auth                 # Update auth module to latest"
    echo "  $0 cart 2.0.47         # Update cart module to specific version"
    echo "  $0 backend              # Update all backend services to latest"
    echo ""
}

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-}" in
    "all")
        print_status "Updating all modules..."
        "$SCRIPT_DIR/install-common-all.sh" "${2:-latest}"
        ;;
    "auth")
        print_status "Updating auth module..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" auth
        ;;
    "cart")
        print_status "Updating cart module..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" cart
        ;;
    "product")
        print_status "Updating product module..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" product
        ;;
    "order")
        print_status "Updating order module..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" order
        ;;
    "notification")
        print_status "Updating notification module..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" notification
        ;;
    "backend")
        print_status "Updating all backend services..."
        "$SCRIPT_DIR/install-common-selective.sh" "${2:-latest}" auth cart product order notification
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        print_error "No command specified"
        show_usage
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
