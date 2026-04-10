#!/bin/sh
set -e

echo "Starting HashiCorp Vault..."

if [ "${NODE_ENV}" = "production" ]; then
    echo "Starting Vault in server mode..."
    vault server -config=/vault/config/config.hcl &
    VAULT_PID=$!

    sleep 3

    echo "Vault started. Manual init/unseal required in production."
    echo "Run: vault operator init"
    echo "Then: vault operator unseal <key>"
    wait $VAULT_PID
else
    echo "Starting Vault in dev mode..."
    vault server -dev \
        -dev-root-token-id="${VAULT_DEV_ROOT_TOKEN_ID:-dev-root-token}" \
        -dev-listen-address="0.0.0.0:8200" &
    VAULT_PID=$!

    sleep 2

    export VAULT_ADDR="http://127.0.0.1:8200"
    export VAULT_TOKEN="${VAULT_DEV_ROOT_TOKEN_ID:-dev-root-token}"

    echo "Configuring secrets engine..."

    vault secrets enable -path=secret kv-v2 2>/dev/null || true

    echo "Storing secrets in Vault..."

    vault kv put secret/ft_transcendence \
        jwt_secret="${JWT_SECRET:-dev-jwt-secret-change-in-production}" \
        jwt_expiration="${JWT_EXPIRATION:-15m}" \
        jwt_refresh_expiration="${JWT_REFRESH_EXPIRATION:-7d}" \
        google_client_id="${GOOGLE_CLIENT_ID:-placeholder}" \
        google_client_secret="${GOOGLE_CLIENT_SECRET:-placeholder}" \
        google_callback_url="${GOOGLE_CALLBACK_URL:-placeholder}" \
        postgres_host="${POSTGRES_HOST:-postgres}" \
        postgres_port="${POSTGRES_PORT:-5432}" \
        postgres_user="${POSTGRES_USER:-transcendence}" \
        postgres_password="${POSTGRES_PASSWORD:-placeholder}" \
        postgres_db="${POSTGRES_DB:-transcendence}" \
        totp_app_name="${TOTP_APP_NAME:-ft_transcendence}" \
        2>/dev/null || true

    vault kv put secret/monitoring \
        grafana_user="${GF_SECURITY_ADMIN_USER:-admin}" \
        grafana_password="${GF_SECURITY_ADMIN_PASSWORD:-change-in-production}" \
        2>/dev/null || true

    vault kv put secret/app \
        node_env="${NODE_ENV:-development}" \
        cors_origin="${CORS_ORIGIN:-https://localhost:8443}" \
        upload_dir="${UPLOAD_DIR:-/app/uploads}" \
        max_file_size="${MAX_FILE_SIZE:-10485760}" \
        2>/dev/null || true

    echo "========================================"
    echo "Vault dev mode ready!"
    echo "========================================"
    echo "Vault Address: http://localhost:8200"
    echo "Vault Token: ${VAULT_TOKEN}"
    echo ""
    echo "To view secrets:"
    echo "  export VAULT_TOKEN=${VAULT_TOKEN}"
    echo "  vault kv list secret/"
    echo "  vault kv get secret/ft_transcendence"
    echo "========================================"

    wait $VAULT_PID
fi
