#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

BUMP_TYPE="patch"
TARGET_VERSION=""
REMOTE="origin"
WORKFLOW_NAME="Build Release APK"
PUSH_CHANGES="true"
WATCH_RUN="true"
POLL_SECONDS=5
MAX_POLLS=48

usage() {
  cat <<'USAGE'
Auto-release Android by bumping version, committing, tagging, and pushing.

Usage:
  scripts/release-android.sh [options]

Options:
  --bump <patch|minor|major>   Semver bump type (default: patch)
  --version <x.y.z>            Explicit version (overrides --bump)
  --remote <name>              Git remote to push (default: origin)
  --workflow <name>            Workflow name to watch (default: Build Release APK)
  --no-push                    Do not push commit/tag
  --no-watch                   Do not wait for GitHub Actions release run
  --help                       Show this help

Examples:
  scripts/release-android.sh --bump patch
  scripts/release-android.sh --version 1.2.0
USAGE
}

log() {
  printf '[android-release] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bump)
      BUMP_TYPE="${2:-}"
      shift 2
      ;;
    --version)
      TARGET_VERSION="${2:-}"
      shift 2
      ;;
    --remote)
      REMOTE="${2:-}"
      shift 2
      ;;
    --workflow)
      WORKFLOW_NAME="${2:-}"
      shift 2
      ;;
    --no-push)
      PUSH_CHANGES="false"
      shift
      ;;
    --no-watch)
      WATCH_RUN="false"
      shift
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

if [[ -z "$TARGET_VERSION" ]]; then
  if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
    echo "Invalid --bump: ${BUMP_TYPE} (expected: patch|minor|major)" >&2
    exit 1
  fi
fi

if [[ "$PUSH_CHANGES" == "false" && "$WATCH_RUN" == "true" ]]; then
  echo "--no-watch is required when using --no-push." >&2
  exit 1
fi

require_cmd git
require_cmd node

if [[ "$WATCH_RUN" == "true" ]]; then
  require_cmd gh
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Remote '${REMOTE}' does not exist." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree must be clean before release." >&2
  echo "Commit/stash your changes first." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Release must run from 'main'. Current branch: ${CURRENT_BRANCH}" >&2
  exit 1
fi

read -r NEW_VERSION NEW_VERSION_CODE <<EOF_VERSION
$(TARGET_VERSION="$TARGET_VERSION" BUMP_TYPE="$BUMP_TYPE" node <<'NODE'
const fs = require('fs');

const pkgPath = 'package.json';
const appPath = 'app.json';
const lockPath = 'package-lock.json';

const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseSemver(value) {
  const match = semverRegex.exec(value);
  if (!match) {
    throw new Error(`Invalid semver: ${value}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function bumpVersion(current, bumpType) {
  const [major, minor, patch] = parseSemver(current);
  if (bumpType === 'major') return `${major + 1}.0.0`;
  if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const targetVersion = process.env.TARGET_VERSION || '';
const bumpType = process.env.BUMP_TYPE || 'patch';

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));

const nextVersion = targetVersion ? (() => {
  parseSemver(targetVersion);
  return targetVersion;
})() : bumpVersion(pkg.version, bumpType);

if (!app.expo || typeof app.expo !== 'object') {
  throw new Error('app.json must contain expo object');
}

if (!app.expo.android || typeof app.expo.android !== 'object') {
  app.expo.android = {};
}

const rawVersionCode = app.expo.android.versionCode;
const versionCode = rawVersionCode == null ? 0 : Number(rawVersionCode);
if (!Number.isInteger(versionCode) || versionCode < 0) {
  throw new Error(`Invalid android.versionCode: ${rawVersionCode}`);
}

const nextVersionCode = versionCode + 1;

pkg.version = nextVersion;
app.expo.version = nextVersion;
app.expo.android.versionCode = nextVersionCode;

fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
fs.writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);

if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (typeof lock.version === 'string') {
    lock.version = nextVersion;
  }
  if (lock.packages && lock.packages[''] && typeof lock.packages[''] === 'object') {
    lock.packages[''].version = nextVersion;
  }
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

process.stdout.write(`${nextVersion} ${nextVersionCode}`);
NODE
)
EOF_VERSION

TAG="v${NEW_VERSION}"

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "Tag '${TAG}' already exists locally." >&2
  exit 1
fi

log "Bumped version to ${NEW_VERSION} (android.versionCode=${NEW_VERSION_CODE})"

git add package.json app.json package-lock.json

if git diff --cached --quiet; then
  echo "No release changes staged." >&2
  exit 1
fi

git commit -m "chore(release): android ${TAG}"
git tag -a "$TAG" -m "Android release ${TAG}"

if [[ "$PUSH_CHANGES" == "true" ]]; then
  log "Pushing commit to ${REMOTE}/main"
  git push "$REMOTE" main

  log "Pushing tag ${TAG}"
  git push "$REMOTE" "$TAG"
fi

if [[ "$WATCH_RUN" == "true" ]]; then
  log "Checking gh authentication"
  gh auth status >/dev/null

  log "Ensuring workflow exists: ${WORKFLOW_NAME}"
  gh workflow view "$WORKFLOW_NAME" >/dev/null

  HEAD_SHA="$(git rev-parse HEAD)"
  RUN_ID=""
  log "Waiting for '${WORKFLOW_NAME}' run triggered by tag push (${TAG})"

  for ((i=1; i<=MAX_POLLS; i++)); do
    RUN_ID="$(gh run list \
      --workflow "$WORKFLOW_NAME" \
      --limit 30 \
      --json databaseId,headSha,event \
      -q "map(select(.headSha == \"${HEAD_SHA}\" and .event == \"push\"))[0].databaseId")"

    if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
      break
    fi

    sleep "$POLL_SECONDS"
  done

  if [[ -n "$RUN_ID" && "$RUN_ID" != "null" ]]; then
    log "Watching release workflow run ${RUN_ID}"
    gh run watch "$RUN_ID" --exit-status
  else
    log "Could not find release workflow run for ${TAG}; check Actions tab manually."
  fi
fi

log "Done: ${TAG}"
