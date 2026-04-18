#!/bin/bash

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DOCKER_DIR="$SCRIPT_DIR/docker"
ENV_FILE="$DOCKER_DIR/.env"

normalize_basepath() {
    local value="$1"

    value="$(printf '%s' "$value" | tr -d '\r')"
    value="$(printf '%s' "$value" | sed -E "s/[[:space:]]+$//; s/^['\"]//; s/['\"]$//; s/[[:space:]]+#.*$//")"

    if [ -n "$value" ]; then
        value="$(eval "printf '%s' \"$value\"")"
    fi

    printf '%s\n' "$value"
}

extract_basepath_from_file() {
    local file="$1"
    local line

    [ -f "$file" ] || return 1

    line="$(grep -E '^[[:space:]]*(export[[:space:]]+)?BASEPATH[[:space:]]*=' "$file" | tail -n 1 || true)"
    [ -n "$line" ] || return 1

    line="$(printf '%s\n' "$line" \
        | sed -E "s/^[[:space:]]*(export[[:space:]]+)?BASEPATH[[:space:]]*=[[:space:]]*//")"

    normalize_basepath "$line"
}

resolve_basepath() {
    local candidate=""
    local source_file=""

    candidate="$(normalize_basepath "${BASEPATH:-}")"
    if [ -n "$candidate" ]; then
        BASEPATH="$candidate"
        BASEPATH_SOURCE="environment"
        export BASEPATH
        return 0
    fi

    for source_file in \
        "$HOME/.bashrc" \
        "$HOME/.bash_profile" \
        "$HOME/.profile" \
        "$HOME/.zshrc" \
        "$HOME/.zprofile" \
        "$ENV_FILE"
    do
        candidate="$(extract_basepath_from_file "$source_file" || true)"
        if [ -n "$candidate" ]; then
            BASEPATH="$candidate"
            BASEPATH_SOURCE="$source_file"
            export BASEPATH
            return 0
        fi
    done

    return 1
}

resolve_basepath || true

if [ -n "$BASEPATH" ]; then
    echo "BASEPATH: $BASEPATH"
    echo "BASEPATH source: ${BASEPATH_SOURCE:-unknown}"
else
    echo "Warning: BASEPATH is not set; continuing because backend deployment does not require it"
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
echo "  BASEPATH: ${BASEPATH:-"(not set)"}"
echo "  Container: shipping-api"
