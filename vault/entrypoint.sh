#!/bin/sh
set -e

echo "Starting HashiCorp Vault..."

# In development mode, Vault starts unsealed with a root token
# In production, remove --dev and use proper unsealing
if [ "${NODE_ENV}" = "production" ]; then
    echo "Starting Vault in server mode..."
    vault server -config=/vault/config/config.hcl &
    VAULT_PID=$!

    # Wait for Vault to be ready
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

    # Wait for Vault to be ready
    sleep 2

    export VAULT_ADDR="http://127.0.0.1:8200"
    export VAULT_TOKEN="${VAULT_DEV_ROOT_TOKEN_ID:-dev-root-token}"

    echo "Configuring secrets engine..."

    # Enable KV secrets engine v2
    vault secrets enable -path=secret kv-v2 2>/dev/null || true

    # Store application secrets
    vault kv put secret/ft_transcendence \
        jwt_secret="${JWT_SECRET:-change-me}" \
        google_client_id="${GOOGLE_CLIENT_ID:-placeholder}" \
        google_client_secret="${GOOGLE_CLIENT_SECRET:-placeholder}" \
        postgres_password="${POSTGRES_PASSWORD:-placeholder}" \
        2>/dev/null || true

    echo "Vault dev mode ready with secrets configured."
    wait $VAULT_PID
fi
