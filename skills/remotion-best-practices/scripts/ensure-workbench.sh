#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required for the Remotion workbench." >&2
  exit 1
fi

node "$SCRIPT_DIR/ensure-workbench.mjs" "$@"
