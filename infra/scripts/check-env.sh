#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ShipSmart — Environment Variable Checker
# Verifies that required .env files exist and key variables are set.
# Usage: bash infra/scripts/check-env.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ERRORS=0

check_var() {
  local file="$1"
  local var="$2"
  if ! grep -q "^${var}=.\+" "$file" 2>/dev/null; then
    echo "  ✗ $var is missing or empty in $file"
    ERRORS=$((ERRORS + 1))
  else
    echo "  ✓ $var"
  fi
}

echo "── Checking apps/web/.env.local ─────────────────────────────────────────"
WEB_ENV="$REPO_ROOT/apps/web/.env.local"
if [ ! -f "$WEB_ENV" ]; then
  echo "  ✗ Missing $WEB_ENV — copy from apps/web/.env.example"
  ERRORS=$((ERRORS + 1))
else
  check_var "$WEB_ENV" "VITE_SUPABASE_URL"
  check_var "$WEB_ENV" "VITE_SUPABASE_ANON_KEY"
  check_var "$WEB_ENV" "VITE_JAVA_API_BASE_URL"
  check_var "$WEB_ENV" "VITE_PYTHON_API_BASE_URL"
fi

echo ""
echo "── Checking apps/api-java/.env ──────────────────────────────────────────"
JAVA_ENV="$REPO_ROOT/apps/api-java/.env"
if [ ! -f "$JAVA_ENV" ]; then
  echo "  ✗ Missing $JAVA_ENV — copy from apps/api-java/.env.example"
  ERRORS=$((ERRORS + 1))
else
  check_var "$JAVA_ENV" "DATABASE_URL"
  check_var "$JAVA_ENV" "SUPABASE_URL"
  check_var "$JAVA_ENV" "SUPABASE_SERVICE_ROLE_KEY"
fi

echo ""
echo "── Checking apps/api-python/.env ────────────────────────────────────────"
PYTHON_ENV="$REPO_ROOT/apps/api-python/.env"
if [ ! -f "$PYTHON_ENV" ]; then
  echo "  ✗ Missing $PYTHON_ENV — copy from apps/api-python/.env.example"
  ERRORS=$((ERRORS + 1))
else
  check_var "$PYTHON_ENV" "SUPABASE_URL"
  check_var "$PYTHON_ENV" "SUPABASE_SERVICE_ROLE_KEY"
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "✗ $ERRORS issue(s) found. Fix them before starting services."
  exit 1
else
  echo "✓ All environment variables are configured."
fi
