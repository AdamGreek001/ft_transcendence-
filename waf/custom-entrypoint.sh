#!/bin/bash

# Custom entrypoint for WAF to add additional ModSecurity rules after the base image setup

# Wait for the base entrypoint to complete
set -e

# Add ModSecurity rule to disable inspection for notification endpoints
cat >> /etc/modsecurity.d/modsecurity-custom.conf <<'EOF'

# Exclude notification endpoints from CRS rules
SecRule REQUEST_URI "@beginsWith /api/notifications" \
    "id:70000,phase:1,pass,ctl:RuleEngine=Off,nolog"
    
SEC Rule REQUEST_URI "@beginsWith /api/notifications" \
    "id:70001,phase:2,pass,ctl:RuleEngine=Off,nolog"
EOF

# Call the original nginx entrypoint
exec /docker-entrypoint.sh "$@"
