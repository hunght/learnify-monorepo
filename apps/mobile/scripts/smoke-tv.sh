#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "[smoke-tv] type-check"
npm run type-check

echo "[smoke-tv] lint"
npm run lint

echo "[smoke-tv] ui boundaries"
npm run check:ui-boundaries

echo "[smoke-tv] Ready to run on device: EXPO_PUBLIC_APP_SURFACE=tv npm start"
