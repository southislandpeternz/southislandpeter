#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-photo-organizer"
AUDIT="$ROOT/scripts/photo-organizer/accuracy_audit.py"

if [[ -d "$VENV" ]]; then
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
fi

python3 "$AUDIT" --root "$ROOT" "$@"
