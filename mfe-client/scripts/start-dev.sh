#!/bin/bash
# ============================================================
# DEPRECATED — kept so existing muscle memory keeps working.
#
# Use instead:
#   pnpm dev            # port-forwards + all MFEs
#   pnpm dev:help       # every flag and port
#
# scripts/dev.mjs replaces this: it also opens the kubectl
# port-forwards the MFEs need, and reads every port from
# dev.config.json instead of hardcoding them.
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "⚠️  scripts/start-dev.sh is deprecated — running 'pnpm dev' instead."
echo ""

exec node "$SCRIPT_DIR/dev.mjs" "$@"
