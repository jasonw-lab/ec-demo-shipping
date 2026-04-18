#!/bin/bash

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCKER_DIR="$SCRIPT_DIR/docker"
ENV_FILE="$DOCKER_DIR/.env"

# Load BASEPATH from .env
if [ -f "$ENV_FILE" ]; then
    BASEPATH=$(grep '^BASEPATH=' "$ENV_FILE" | cut -d '=' -f2-)
    echo "Loaded from: $ENV_FILE"
    echo "BASEPATH: $BASEPATH"
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Validate BASEPATH
if [ -z "$BASEPATH" ]; then
    echo "Error: BASEPATH is not set in .env"
    exit 1
fi

echo "Starting backend deployment..."

# Pull latest changes (skip if uncommitted changes exist)
git pull || echo "Warning: git pull skipped (uncommitted changes exist)"

# Navigate to docker directory
cd "$DOCKER_DIR"

# Rebuild and restart the API container
echo "Building API image..."
docker compose build api

echo "Restarting API container..."
docker compose up -d api

# Wait for container to be healthy
echo "Waiting for API to start..."
sleep 3
docker compose ps api

echo ""
echo "=== Backend deployment completed! ==="
echo "  BASEPATH: $BASEPATH"
echo "  Container: shipping-api"
