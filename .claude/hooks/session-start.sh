#!/bin/bash
# Prepares Higgsfield in Claude Code cloud sessions.
# - Installs the Higgsfield CLI (the container is ephemeral, so this runs every session).
# - Restores CLI credentials from the HIGGSFIELD_CREDENTIALS_JSON environment secret.
#   Produce that value by running `higgsfield auth login` on a machine with a browser,
#   then copying the contents of ~/.config/higgsfield/credentials.json into the
#   environment's secrets (cloud environment menu in the session title bar -> Edit).
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v higgsfield >/dev/null 2>&1; then
  npm i -g @higgsfield/cli
fi

if [ -n "${HIGGSFIELD_CREDENTIALS_JSON:-}" ]; then
  mkdir -p "$HOME/.config/higgsfield"
  umask 077
  printf '%s' "$HIGGSFIELD_CREDENTIALS_JSON" > "$HOME/.config/higgsfield/credentials.json"
  echo "Higgsfield credentials restored from HIGGSFIELD_CREDENTIALS_JSON."
else
  echo "HIGGSFIELD_CREDENTIALS_JSON not set; Higgsfield CLI is installed but not authenticated."
fi
