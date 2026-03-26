#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_NAME="Build Release APK"
OUTPUT_DIR="./dist-apk"
RUN_INSTALL="false"
REF=""
POLL_SECONDS=3
MAX_POLLS=30

usage() {
  cat <<'USAGE'
Automate Android APK CI flow with GitHub CLI.

Usage:
  scripts/gh-android-apk.sh [options]

Options:
  --ref <git-ref>               Branch/tag/sha to run workflow on (default: current branch)
  --output-dir <path>           Where to download artifact (default: ./dist-apk)
  --install                     Install APK to connected Android device via adb
  --workflow <name>             Workflow name (default: Build Release APK)
  --help                        Show this help
USAGE
}

log() {
  printf '[apk-ci] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --install)
      RUN_INSTALL="true"
      shift
      ;;
    --workflow)
      WORKFLOW_NAME="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd gh
require_cmd git

if [[ -z "$REF" ]]; then
  REF="$(git rev-parse --abbrev-ref HEAD)"
fi

if [[ "$REF" == "HEAD" ]]; then
  echo "Unable to infer branch from detached HEAD. Pass --ref explicitly." >&2
  exit 1
fi

HEAD_SHA="$(git rev-parse "$REF")"
ARTIFACT_NAME="learnify-mobile-release-apk"

log "Checking gh authentication"
gh auth status >/dev/null

log "Ensuring workflow exists: ${WORKFLOW_NAME}"
gh workflow view "$WORKFLOW_NAME" >/dev/null

log "Triggering workflow on ref '${REF}'"
gh workflow run "$WORKFLOW_NAME" --ref "$REF"

RUN_ID=""
for ((i=1; i<=MAX_POLLS; i++)); do
  RUN_ID="$(gh run list \
    --workflow "$WORKFLOW_NAME" \
    --branch "$REF" \
    --event workflow_dispatch \
    --limit 10 \
    --json databaseId,headSha \
    -q "map(select(.headSha == \"${HEAD_SHA}\"))[0].databaseId")"

  if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
    break
  fi

  sleep "$POLL_SECONDS"
done

if [[ -z "$RUN_ID" || "$RUN_ID" == "null" ]]; then
  echo "Could not find dispatched workflow run for ref '${REF}' (sha ${HEAD_SHA})." >&2
  exit 1
fi

log "Run queued: ${RUN_ID}"
log "Watching run until completion"
gh run watch "$RUN_ID" --exit-status

mkdir -p "$OUTPUT_DIR"
log "Downloading artifact '${ARTIFACT_NAME}' to ${OUTPUT_DIR}"
gh run download "$RUN_ID" -n "$ARTIFACT_NAME" -D "$OUTPUT_DIR"

APK_PATH="$(find "$OUTPUT_DIR" -type f -name '*.apk' | head -n 1)"
if [[ -z "$APK_PATH" ]]; then
  echo "Artifact downloaded but no .apk file found in ${OUTPUT_DIR}." >&2
  exit 1
fi

log "APK ready: ${APK_PATH}"

if [[ "$RUN_INSTALL" == "true" ]]; then
  require_cmd adb
  log "Installing APK to connected device"
  adb install -r "$APK_PATH"
  log "Install complete"
fi
