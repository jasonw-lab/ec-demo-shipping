#!/bin/bash
# Generate RSA key pair for JWT RS256 signing
# Usage: ./scripts/generate-jwt-keys.sh [output_dir]

set -e

OUTPUT_DIR="${1:-./keys}"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Generate 2048-bit RSA private key
echo "Generating RSA private key..."
openssl genrsa -out "$OUTPUT_DIR/jwt-private.pem" 2048

# Extract public key from private key
echo "Extracting RSA public key..."
openssl rsa -in "$OUTPUT_DIR/jwt-private.pem" -pubout -out "$OUTPUT_DIR/jwt-public.pem"

# Set permissions
chmod 600 "$OUTPUT_DIR/jwt-private.pem"
chmod 644 "$OUTPUT_DIR/jwt-public.pem"

echo ""
echo "JWT RSA keys generated successfully:"
echo "  Private key: $OUTPUT_DIR/jwt-private.pem"
echo "  Public key:  $OUTPUT_DIR/jwt-public.pem"
echo ""
echo "Add the following to your .env file:"
echo ""
echo "  JWT_PRIVATE_KEY_PATH=$OUTPUT_DIR/jwt-private.pem"
echo "  JWT_PUBLIC_KEY_PATH=$OUTPUT_DIR/jwt-public.pem"
echo ""
echo "WARNING: Keep the private key secure and never commit it to version control!"
