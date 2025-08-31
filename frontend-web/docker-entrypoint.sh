#!/bin/sh
set -e

# Replace placeholder with env var
API_URL=${VITE_API_URL:-http://localhost:4000}
sed "s|\$VITE_API_URL|$API_URL|g" /usr/share/nginx/html/config.template.js > /usr/share/nginx/html/config.js

exec "$@"
