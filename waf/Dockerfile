FROM owasp/modsecurity-crs:nginx-alpine

# Create cert directory
RUN mkdir -p /etc/nginx/certs && \
    rm -rf /var/cache/apk/*

# Disable paranoia level and CRS overrides to allow more traffic
ENV PARANOIA=1
ENV ANOMALY_INBOUND=5
ENV ANOMALY_OUTBOUND=4
ENV ALLOWED_METHODS="GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT|TRACE"

# Copy ModSecurity configuration override
COPY modsecurity.conf /etc/modsecurity.d/modsecurity-custom.conf

# Copy certificate generation script
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh
RUN chmod +x /docker-entrypoint.d/01-create-cert.sh || true

EXPOSE 80 443
