FROM owasp/modsecurity-crs:nginx-alpine

# Create cert directory
RUN mkdir -p /etc/nginx/certs && \
    rm -rf /var/cache/apk/*

# Copy certificate generation script
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh
RUN chmod +x /docker-entrypoint.d/01-create-cert.sh || true

EXPOSE 80 443
