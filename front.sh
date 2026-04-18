#!/bin/bash

set -e

# Setup Node.js (Volta)
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
echo "node version: $(node -v)"
echo "npm version: $(npm -v)"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

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

infer_basepath_from_path() {
    local path="$1"

    case "$path" in
        */nginx/*)
            printf '%s\n' "${path%%/nginx/*}"
            return 0
            ;;
    esac

    return 1
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
        "$SCRIPT_DIR/docker/.env"
    do
        candidate="$(extract_basepath_from_file "$source_file" || true)"
        if [ -n "$candidate" ]; then
            BASEPATH="$candidate"
            BASEPATH_SOURCE="$source_file"
            export BASEPATH
            return 0
        fi
    done

    for source_file in "$SCRIPT_DIR" "$(pwd)"; do
        candidate="$(infer_basepath_from_path "$source_file" || true)"
        if [ -n "$candidate" ]; then
            BASEPATH="$candidate"
            BASEPATH_SOURCE="inferred from $source_file"
            export BASEPATH
            return 0
        fi
    done

    return 1
}

resolve_basepath || true

if [ -z "$BASEPATH" ]; then
    echo "Error: BASEPATH is not set"
    echo "Checked environment, shell profile files, and $SCRIPT_DIR/docker/.env"
    exit 1
fi

if [ ! -d "$BASEPATH" ]; then
    echo "Error: BASEPATH does not exist: $BASEPATH"
    exit 1
fi

echo "BASEPATH: $BASEPATH"
echo "BASEPATH source: ${BASEPATH_SOURCE:-unknown}"

# Target application (default: all)
TARGET_APP="${1:-all}"

# Validate target app
case "$TARGET_APP" in
    admin-next-shadcn|admin-antd-pro|admin-ui|all)
        echo "Building: $TARGET_APP"
        ;;
    *)
        echo "Error: Unknown or disabled target app: $TARGET_APP"
        echo "Usage: $0 [admin-next-shadcn|admin-antd-pro|admin-ui|all]"
        exit 1
        ;;
esac

# Pull latest changes (skip if uncommitted changes exist)
git pull || echo "Warning: git pull skipped (uncommitted changes exist)"

build_app() {
    local APP="$1"
    local DEPLOY_DIR="$BASEPATH/nginx/html/shipping-$APP"

    # Resolve build output directory and command per app
    case "$APP" in
        admin-next-shadcn)
            BUILD_OUTPUT="out"
            BUILD_CMD="npm run build"
            ;;
        admin-antd-pro)
            BUILD_OUTPUT="dist"
            BUILD_CMD="UMI_ENV=prod npm run build"
            ;;
        admin-ui)
            BUILD_OUTPUT="out"
            BUILD_CMD="npm run build"
            ;;
        # admin-horizon-ui)
        #     BUILD_OUTPUT="out"
        #     BUILD_CMD="npm run build"
        #     ;;
        # admin-mui)
        #     BUILD_OUTPUT="dist"
        #     BUILD_CMD="npm run build"
        #     ;;
        # admin-square-ui)
        #     BUILD_OUTPUT="out"
        #     BUILD_CMD="npm run build"
        #     ;;
        *)
            echo "Error: Unknown or disabled app: $APP"
            exit 1
            ;;
    esac

    echo ""
    echo "--- Building: $APP ---"

    cd "$SCRIPT_DIR/apps/$APP"

    echo "Installing dependencies..."
    HUSKY=0 npm install

    echo "Building the project..."
    eval "$BUILD_CMD"

    if [ ! -d "$BUILD_OUTPUT" ]; then
        echo "Error: Build output directory '$BUILD_OUTPUT' not found"
        exit 1
    fi

    echo "Creating target directory..."
    rm -rf "${DEPLOY_DIR:?}"
    mkdir -p "$DEPLOY_DIR"

    echo "Copying built assets to $DEPLOY_DIR..."
    cp -r "$BUILD_OUTPUT"/* "$DEPLOY_DIR/"

    echo "=== Deployed: $APP → $DEPLOY_DIR ==="
}

if [ "$TARGET_APP" = "all" ]; then
    build_app "admin-next-shadcn"
    build_app "admin-antd-pro"
    build_app "admin-ui"
    # build_app "admin-horizon-ui"
    # build_app "admin-mui"
    # build_app "admin-square-ui"
else
    build_app "$TARGET_APP"
fi

echo ""
echo "=== Build and deployment completed! ==="
echo "  App:      $TARGET_APP"
echo "  BASEPATH: $BASEPATH"
