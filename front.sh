#!/bin/bash

set -e

# Load user environment
source "$HOME/.bashrc"

# Setup Node.js (Volta)
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
echo "node version: $(node -v)"
echo "npm version: $(npm -v)"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/docker/.env"

# Load BASEPATH: use existing env var, or fall back to .env file
if [ -z "$BASEPATH" ]; then
    if [ -f "$ENV_FILE" ]; then
        BASEPATH=$(grep '^BASEPATH=' "$ENV_FILE" | cut -d '=' -f2-)
        echo "Loaded BASEPATH from: $ENV_FILE"
    else
        echo "Error: BASEPATH is not set and .env file not found at $ENV_FILE"
        exit 1
    fi
else
    echo "Using existing BASEPATH from environment"
fi
echo "BASEPATH: $BASEPATH"

# Validate BASEPATH
if [ -z "$BASEPATH" ]; then
    echo "Error: BASEPATH is not set in environment or .env"
    exit 1
fi

# Target application (default: admin-next-shadcn)
TARGET_APP="${1:-admin-next-shadcn}"

# Validate target app
case "$TARGET_APP" in
    admin-next-shadcn|admin-antd-pro)
        echo "Building: $TARGET_APP"
        ;;
    *)
        echo "Error: Unknown target app: $TARGET_APP"
        echo "Usage: $0 [admin-next-shadcn|admin-antd-pro]"
        exit 1
        ;;
esac

# Deploy directory
DEPLOY_DIR="$BASEPATH/nginx/html/shipping-$TARGET_APP"

echo "Starting build process for $TARGET_APP..."

# Pull latest changes (skip if uncommitted changes exist)
git pull || echo "Warning: git pull skipped (uncommitted changes exist)"

# Navigate to the frontend directory
cd "$SCRIPT_DIR/apps/$TARGET_APP"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
if [ "$TARGET_APP" = "admin-antd-pro" ]; then
    UMI_ENV=prod npm run build
else
    npm run build
fi

# Determine output directory
if [ "$TARGET_APP" = "admin-next-shadcn" ]; then
    BUILD_OUTPUT="out"
else
    BUILD_OUTPUT="dist"
fi

# Check if build output exists
if [ ! -d "$BUILD_OUTPUT" ]; then
    echo "Error: Build output directory '$BUILD_OUTPUT' not found"
    exit 1
fi

# Create target directory
echo "Creating target directory..."
rm -rf "${DEPLOY_DIR:?}"
mkdir -p "$DEPLOY_DIR"

# Copy the built assets to the target directory
echo "Copying built assets to $DEPLOY_DIR..."
cp -r "$BUILD_OUTPUT"/* "$DEPLOY_DIR/"

echo ""
echo "=== Build and deployment completed! ==="
echo "  App:      $TARGET_APP"
echo "  BASEPATH: $BASEPATH"
echo "  Dist:     $DEPLOY_DIR"
