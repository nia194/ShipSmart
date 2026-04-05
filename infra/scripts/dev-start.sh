#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ShipSmart — Local Development Startup Script
# Usage: bash infra/scripts/dev-start.sh [web|java|python|all]
#
# Prerequisites:
#   - Node 22+ and pnpm 9+ installed
#   - Java 25 installed (or use SDKMAN: sdk install java 25-open)
#   - Python 3.13 installed
#   - uv v0.6.5+ installed (curl -LsSf https://astral.sh/uv/install.sh | sh)
#   - apps/web/.env.local copied from apps/web/.env.example and filled in
#   - apps/api-java/.env copied from apps/api-java/.env.example and filled in
#   - apps/api-python/.env copied from apps/api-python/.env.example and filled in
# ─────────────────────────────────────────────────────────────────────────────

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="${1:-all}"

check_env() {
  local dir="$1"
  local file="$dir/.env"
  if [ ! -f "$file" ]; then
    echo "⚠  Missing $file — copy from $dir/.env.example and fill in values"
    exit 1
  fi
}

start_web() {
  echo "▶ Starting React frontend (port 5173)..."
  cd "$REPO_ROOT"
  pnpm install
  pnpm nx serve web &
}

start_java() {
  check_env "$REPO_ROOT/apps/api-java"
  echo "▶ Starting Spring Boot Java API (port 8080)..."
  cd "$REPO_ROOT/apps/api-java"
  # Load .env into the current shell
  set -a; source .env; set +a
  ./gradlew bootRun &
}

start_python() {
  check_env "$REPO_ROOT/apps/api-python"
  echo "▶ Starting FastAPI Python API (port 8000)..."
  cd "$REPO_ROOT/apps/api-python"
  uv sync
  uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
}

case "$TARGET" in
  web)
    start_web
    ;;
  java)
    start_java
    ;;
  python)
    start_python
    ;;
  all)
    start_web
    start_java
    start_python
    echo ""
    echo "✓ All services starting:"
    echo "  Web     → http://localhost:5173"
    echo "  Java    → http://localhost:8080"
    echo "  Python  → http://localhost:8000"
    echo ""
    echo "  Java health  → http://localhost:8080/api/v1/health"
    echo "  Python health → http://localhost:8000/health"
    echo "  Python docs  → http://localhost:8000/docs"
    echo ""
    wait
    ;;
  *)
    echo "Usage: $0 [web|java|python|all]"
    exit 1
    ;;
esac
