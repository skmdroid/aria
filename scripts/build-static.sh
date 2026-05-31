#!/usr/bin/env bash
# Build a fully static export for GitHub Pages (served at sumanthkm.com/aria).
# Server API routes can't exist in an `output: export` build, so we move them
# aside for the build and restore them afterwards.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_DIR="src/app/api"
STASH="$(mktemp -d)/api"

restore() {
  if [ -d "$STASH" ]; then
    rm -rf "$API_DIR"
    mv "$STASH" "$API_DIR"
  fi
}
trap restore EXIT

if [ -d "$API_DIR" ]; then
  mv "$API_DIR" "$STASH"
fi

echo "▸ Building static export (STATIC_EXPORT=1, basePath=/aria)…"
STATIC_EXPORT=1 npx next build

# GitHub Pages runs Jekyll, which ignores folders starting with "_" (like _next).
touch out/.nojekyll

echo "✓ Static site ready in ./out  (deploy to sumanthkm.com/aria)"
