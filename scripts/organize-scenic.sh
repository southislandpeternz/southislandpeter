#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-photo-organizer"
ORG="$ROOT/scripts/photo-organizer/organize_scenic.py"

if [[ -d "$VENV" ]]; then
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
fi

python3 "$ORG" --root "$ROOT" "$@"
