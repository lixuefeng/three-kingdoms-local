#!/bin/bash
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required. Install it from https://nodejs.org, then try again."
  read -r -p "Press Enter to exit…" _sgs_wait
  exit 1
fi
node server.mjs
read -r -p "Server stopped. Press Enter to close…" _sgs_wait
