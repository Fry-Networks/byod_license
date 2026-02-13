#!/bin/sh
set -eu

TOKEN_FILE=/run/secrets/op_service_account_token

if [ ! -s "$TOKEN_FILE" ]; then
  echo "Missing or empty 1Password service account token file: $TOKEN_FILE" >&2
  exit 1
fi

export OP_SERVICE_ACCOUNT_TOKEN="$(cat "$TOKEN_FILE")"
export OP_CONFIG_DIR=/tmp/op
gosu appuser sh -c "mkdir -p \"$OP_CONFIG_DIR\" && chmod 700 \"$OP_CONFIG_DIR\""

exec gosu appuser op run -- "$@"
