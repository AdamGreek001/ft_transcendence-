FROM owasp/modsecurity-crs:nginx-alpine

USER root

# Copy custom ModSecurity configuration
COPY modsecurity.conf /etc/modsecurity.d/modsecurity-override.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh
COPY 99-fix-proxy.sh /docker-entrypoint.d/99-fix-proxy.sh

RUN chmod +x /docker-entrypoint.d/01-create-cert.sh && \
    chmod +x /docker-entrypoint.d/99-fix-proxy.sh && \
    mkdir -p /etc/nginx/certs && \
    rm -rf /var/cache/apk/*

EXPOSE 80 443
