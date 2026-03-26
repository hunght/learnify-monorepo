#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "[smoke-mobile] type-check"
npm run type-check

echo "[smoke-mobile] lint"
npm run lint

echo "[smoke-mobile] ui boundaries"
npm run check:ui-boundaries

echo "[smoke-mobile] Ready to run on device: EXPO_PUBLIC_APP_SURFACE=mobile npm start"
