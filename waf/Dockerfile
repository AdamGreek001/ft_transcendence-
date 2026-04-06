FROM owasp/modsecurity-crs:nginx-alpine

# Copy custom ModSecurity configuration
COPY modsecurity.conf /etc/modsecurity.d/modsecurity-override.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /etc/nginx/certs && \
    rm -rf /var/cache/apk/*
    
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh
RUN chmod +x /docker-entrypoint.d/01-create-cert.sh || true

EXPOSE 80 443
