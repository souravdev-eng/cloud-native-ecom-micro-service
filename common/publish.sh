#!/bin/bash

# Script to publish @ecom-micro/common package with 2FA

echo "📦 Publishing @ecom-micro/common package..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from the common directory."
    exit 1
fi

# Check if NPM_TOKEN is set
if [ -z "$NPM_TOKEN" ]; then
    echo "⚠️  NPM_TOKEN not set. You have two options:"
    echo ""
    echo "Option 1: Use OTP from your authenticator app"
    echo "  npm publish --access public --otp=YOUR_6_DIGIT_CODE"
    echo ""
    echo "Option 2: Set up a granular access token"
    echo "  1. Go to: https://www.npmjs.com/settings/~/tokens"
    echo "  2. Generate a token with 'Bypass 2FA' enabled"
    echo "  3. Run: export NPM_TOKEN=npm_xxxxxxxxxxxxx"
    echo "  4. Run this script again"
    echo ""
    read -p "Do you have an OTP code ready? (y/n): " has_otp
    
    if [ "$has_otp" = "y" ]; then
        read -p "Enter your 6-digit OTP: " otp_code
        npm publish --access public --otp=$otp_code
    else
        echo "Please set up a token first, then run this script again."
        exit 1
    fi
else
    # Use the token
    npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN
    npm publish --access public
    echo "✅ Package published successfully!"
fi