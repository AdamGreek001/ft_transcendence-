FROM postgres:16-alpine

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

# Clean up
RUN rm -rf /var/cache/apk/*
