#!/bin/bash

# MFE Development Startup Script
# This script starts all MFE applications with configurable API URLs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MFE_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$MFE_ROOT"

print_color $BLUE "Starting MFE Development Environment"
echo

# Check if .env.local exists, if not create from example
if [ ! -f ".env.local" ]; then
    if [ -f "env.example" ]; then
        print_color $YELLOW "Creating .env.local from env.example..."
        cp env.example .env.local
        print_color $GREEN "Created .env.local - you can modify it to change API URLs"
    else
        print_color $YELLOW "Creating default .env.local..."
        cat > .env.local << EOF
# MFE Environment Configuration
REACT_APP_API_BASE_URL=http://localhost
NODE_ENV=development
EOF
        print_color $GREEN "Created default .env.local"
    fi
    echo
fi

# Display current configuration
if [ -f ".env.local" ]; then
    print_color $YELLOW "Current API Configuration:"
    grep "REACT_APP_API_BASE_URL" .env.local || echo "  REACT_APP_API_BASE_URL=http://localhost (default)"
    echo
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_color $YELLOW "Installing dependencies..."
    pnpm install
    echo
fi

print_color $BLUE "Starting MFE applications..."
print_color $YELLOW "This will start:"
echo "  - Host app on http://localhost:3000"
echo "  - User app on http://localhost:3001"
echo "  - Dashboard app on http://localhost:3002"
echo "  - Shared app on http://localhost:3003"
echo

print_color $GREEN "Press Ctrl+C to stop all applications"
echo

# Start all applications
npm run start:dev
