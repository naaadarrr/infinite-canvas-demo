#!/bin/bash
# Vercel build script for apps/demo
# Runs from apps/demo as the Vercel root directory.
# Builds monorepo dependencies (core → widget) before building the Next.js app.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

echo "==> [vercel-build] Repo root: $REPO_ROOT"
echo "==> [vercel-build] Node: $(node -v), pnpm: $(pnpm -v)"

echo "==> [vercel-build] Building @tc/infinite-core..."
pnpm --filter @tc/infinite-core build

echo "==> [vercel-build] Building @tc/infinite-widget..."
pnpm --filter @tc/infinite-widget build

echo "==> [vercel-build] Building demo (next build)..."
pnpm --filter demo build

echo "==> [vercel-build] Done."
