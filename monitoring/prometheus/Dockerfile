FROM prom/prometheus:v2.51.0

# Copy Prometheus configuration
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alert_rules.yml /etc/prometheus/alert_rules.yml

EXPOSE 9090
