FROM owasp/modsecurity-crs:nginx-alpine

USER root

# Copy custom ModSecurity configuration
COPY modsecurity.conf /etc/modsecurity.d/modsecurity-override.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh

RUN chmod +x /docker-entrypoint.d/01-create-cert.sh && \
    mkdir -p /etc/nginx/certs && \
    rm -rf /var/cache/apk/*

# Strict paranoia level and anomaly thresholds
ENV PARANOIA=2
ENV ANOMALY_INBOUND=4
ENV ANOMALY_OUTBOUND=4
ENV ALLOWED_METHODS="GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS"

# Copy ModSecurity configuration override
COPY modsecurity.conf /etc/modsecurity.d/modsecurity-custom.conf

# Copy certificate generation script
COPY create-local-cert.sh /docker-entrypoint.d/01-create-cert.sh
RUN chmod +x /docker-entrypoint.d/01-create-cert.sh || true

EXPOSE 80 443
