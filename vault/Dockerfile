FROM hashicorp/vault:1.15

# Copy configuration
COPY config.hcl /vault/config/config.hcl
COPY entrypoint.sh /usr/local/bin/vault-entrypoint.sh

RUN chmod +x /usr/local/bin/vault-entrypoint.sh

EXPOSE 8200

ENTRYPOINT ["/usr/local/bin/vault-entrypoint.sh"]
