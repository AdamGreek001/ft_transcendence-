#!/bin/sh
# Fix proxy configuration to use internal nginx DNS name
# This runs AFTER all template processing is complete

set -e

echo "Fixing proxy backends to use internal nginx service..."

# Replace localhost with nginx DNS name
sed -i 's|proxy_pass http://localhost:80;|proxy_pass http://nginx:80;|g' /etc/nginx/includes/proxy_backend.conf 2>/dev/null || true
sed -i 's|proxy_pass http://localhost:443;|proxy_pass http://nginx:443;|g' /etc/nginx/includes/proxy_backend_ssl.conf 2>/dev/null || true

echo "Proxy configuration fixed!"
echo "nginx will reload with the corrected proxy backend"
