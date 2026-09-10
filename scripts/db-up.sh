#!/usr/bin/env bash
set -euo pipefail

# Start local PostgreSQL for DP00 using Docker Compose.
# Requires Docker Desktop / Docker Engine.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to start PostgreSQL. Install Docker, then rerun: pnpm db:up" >&2
  exit 1
fi

docker compose up -d postgres
docker compose ps
