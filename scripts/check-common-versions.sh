#!/bin/bash

# Script to check current versions of @ecom-micro/common across all modules
# Usage: ./scripts/check-common-versions.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}$1${NC}"
}

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

# Function to get version from package.json
get_common_version() {
    local module_path=$1
    local package_json="$module_path/package.json"
    
    if [[ ! -f "$package_json" ]]; then
        echo "N/A (no package.json)"
        return
    fi
    
    # Extract version using node -e or python/grep fallback
    if command -v node >/dev/null 2>&1; then
        local version=$(node -e "
            try {
                const pkg = require('$package_json');
                const commonDep = pkg.dependencies && pkg.dependencies['@ecom-micro/common'];
                console.log(commonDep || 'Not installed');
            } catch(e) {
                console.log('Error reading package.json');
            }
        " 2>/dev/null)
        echo "$version"
    else
        # Fallback using grep and sed
        local version=$(grep -o '"@ecom-micro/common"[[:space:]]*:[[:space:]]*"[^"]*"' "$package_json" 2>/dev/null | sed 's/.*"@ecom-micro\/common"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "Not installed")
        echo "$version"
    fi
}

# Function to get latest version from npm
get_latest_version() {
    if command -v npm >/dev/null 2>&1; then
        npm view @ecom-micro/common version 2>/dev/null || echo "Unknown"
    else
        echo "Unknown (npm not available)"
    fi
}

# Main execution
print_header "========================================"
print_header "  @ecom-micro/common Version Report"
print_header "========================================"
echo

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Get latest version from npm
print_status "Fetching latest version from npm registry..."
LATEST_VERSION=$(get_latest_version)
print_success "Latest available version: $LATEST_VERSION"
echo

# Define modules to check
MODULES=(
    "auth"
    "cart" 
    "notification"
    "order"
    "product"
)

# Check versions in each module
print_header "Module Version Report:"
print_header "$(printf "%-15s %-20s %-10s" "Module" "Current Version" "Status")"
print_header "$(printf "%-15s %-20s %-10s" "------" "---------------" "------")"

OUTDATED_MODULES=()
UP_TO_DATE_COUNT=0
NOT_INSTALLED_COUNT=0

for module in "${MODULES[@]}"; do
    if [[ -d "$module" ]]; then
        current_version=$(get_common_version "$ROOT_DIR/$module")
        
        # Determine status
        status=""
        color=""
        if [[ "$current_version" == "Not installed" ]] || [[ "$current_version" == "N/A"* ]]; then
            status="❌ Missing"
            color=$RED
            ((NOT_INSTALLED_COUNT++))
        elif [[ "$current_version" == *"$LATEST_VERSION"* ]] || [[ "$current_version" == "^$LATEST_VERSION" ]] || [[ "$current_version" == "~$LATEST_VERSION" ]]; then
            status="✅ Latest"
            color=$GREEN
            ((UP_TO_DATE_COUNT++))
        else
            status="⚠️  Outdated"
            color=$YELLOW
            OUTDATED_MODULES+=("$module")
        fi
        
        echo -e "${color}$(printf "%-15s %-20s %-10s" "$module" "$current_version" "$status")${NC}"
    else
        echo -e "${RED}$(printf "%-15s %-20s %-10s" "$module" "Directory missing" "❌ Error")${NC}"
    fi
done

echo
print_header "========================================"
print_header "Summary:"
echo -e "${GREEN}✅ Up to date: $UP_TO_DATE_COUNT modules${NC}"
echo -e "${YELLOW}⚠️  Outdated: ${#OUTDATED_MODULES[@]} modules${NC}"
echo -e "${RED}❌ Missing: $NOT_INSTALLED_COUNT modules${NC}"

if [[ ${#OUTDATED_MODULES[@]} -gt 0 ]]; then
    echo
    print_warning "Outdated modules: ${OUTDATED_MODULES[*]}"
    echo
    print_status "To update all modules to latest version:"
    echo "  ./scripts/install-common-all.sh latest"
    echo
    print_status "To update specific modules:"
    echo "  ./scripts/install-common-selective.sh latest ${OUTDATED_MODULES[*]}"
    echo
    print_status "Using the convenience script:"
    echo "  ./scripts/update-common.sh all"
fi

if [[ $NOT_INSTALLED_COUNT -gt 0 ]]; then
    echo
    print_error "Some modules are missing @ecom-micro/common dependency!"
    print_status "Run the installation script to add it:"
    echo "  ./scripts/install-common-all.sh latest"
fi

echo
print_header "========================================"
