#!/bin/bash

# Custom entrypoint for WAF to add additional ModSecurity rules after the base image setup

set -e

# Note: Custom rules are now in /etc/modsecurity.d/modsecurity-custom.conf
# which is copied from modsecurity.conf in the Dockerfile

# Call the original nginx entrypoint
exec /docker-entrypoint.sh "$@"
