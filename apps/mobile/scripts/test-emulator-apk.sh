#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_NAME="Build Release APK"
ARTIFACT_NAME="learnify-mobile-release-apk"
OUTPUT_DIR="./dist-apk"
REF="main"
RUN_ID=""
DEVICE_ID=""
PACKAGE_NAME="com.learnifytube.mobile"
LAUNCH_APP="true"
AUTO_START_EMULATOR="true"
EMULATOR_AVD=""
BOOT_TIMEOUT_SECONDS=420
EMULATOR_LOG_PATH="/tmp/learnify-emulator.log"

usage() {
  cat <<'USAGE'
Download latest release APK artifact and install it to an Android emulator.

Usage:
  scripts/test-emulator-apk.sh [options]

Options:
  --run-id <id>               Use a specific workflow run id
  --ref <branch>              Branch to search successful runs from (default: main)
  --workflow <name>           Workflow name (default: Build Release APK)
  --artifact <name>           Artifact name (default: learnify-mobile-release-apk)
  --output-dir <path>         Download directory (default: ./dist-apk)
  --device <adb-id>           Target device id (default: first running emulator)
  --avd <name>                AVD name to boot if no emulator is running
  --no-start-emulator         Do not auto-start emulator when none is running
  --boot-timeout <seconds>    Wait timeout for emulator boot (default: 420)
  --package <applicationId>   App package name to launch (default: com.learnifytube.mobile)
  --no-launch                 Install only, do not launch app
  --help                      Show this help
USAGE
}

log() {
  printf '[emulator-test] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

find_running_emulator() {
  adb devices | awk '/^emulator-[0-9]+[[:space:]]+device$/{print $1; exit}'
}

find_emulator_command() {
  if command -v emulator >/dev/null 2>&1; then
    command -v emulator
    return 0
  fi

  local sdk_root="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
  if [[ -n "$sdk_root" && -x "$sdk_root/emulator/emulator" ]]; then
    echo "$sdk_root/emulator/emulator"
    return 0
  fi

  return 1
}

wait_for_boot() {
  local device_id="$1"
  local timeout="$2"
  local waited=0

  adb -s "$device_id" wait-for-device >/dev/null 2>&1 || true

  while (( waited < timeout )); do
    local boot_prop
    boot_prop="$(adb -s "$device_id" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' | tr -d '\n')"
    if [[ "$boot_prop" == "1" ]]; then
      adb -s "$device_id" shell input keyevent 82 >/dev/null 2>&1 || true
      return 0
    fi

    sleep 2
    waited=$((waited + 2))
  done

  return 1
}

start_emulator_if_needed() {
  local running
  running="$(find_running_emulator || true)"
  if [[ -n "$running" ]]; then
    DEVICE_ID="$running"
    return 0
  fi

  if [[ "$AUTO_START_EMULATOR" != "true" ]]; then
    return 1
  fi

  local emulator_cmd
  if ! emulator_cmd="$(find_emulator_command)"; then
    echo "No running emulator and Android emulator binary not found in PATH/ANDROID_SDK_ROOT." >&2
    exit 1
  fi

  if [[ -z "$EMULATOR_AVD" ]]; then
    EMULATOR_AVD="$("$emulator_cmd" -list-avds | head -n 1)"
  fi

  if [[ -z "$EMULATOR_AVD" ]]; then
    echo "No Android AVD found. Create one in Android Studio Device Manager first." >&2
    exit 1
  fi

  log "Starting emulator AVD '${EMULATOR_AVD}'"
  nohup "$emulator_cmd" -avd "$EMULATOR_AVD" -no-snapshot-save -no-boot-anim >"$EMULATOR_LOG_PATH" 2>&1 &

  local waited=0
  while (( waited < BOOT_TIMEOUT_SECONDS )); do
    running="$(find_running_emulator || true)"
    if [[ -n "$running" ]]; then
      DEVICE_ID="$running"
      break
    fi
    sleep 2
    waited=$((waited + 2))
  done

  if [[ -z "$DEVICE_ID" ]]; then
    echo "Emulator did not appear in adb within ${BOOT_TIMEOUT_SECONDS}s. Log: ${EMULATOR_LOG_PATH}" >&2
    exit 1
  fi

  log "Waiting for emulator boot completion on ${DEVICE_ID}"
  if ! wait_for_boot "$DEVICE_ID" "$BOOT_TIMEOUT_SECONDS"; then
    echo "Emulator boot did not complete in ${BOOT_TIMEOUT_SECONDS}s. Log: ${EMULATOR_LOG_PATH}" >&2
    exit 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --run-id)
      RUN_ID="${2:-}"
      shift 2
      ;;
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    --workflow)
      WORKFLOW_NAME="${2:-}"
      shift 2
      ;;
    --artifact)
      ARTIFACT_NAME="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --device)
      DEVICE_ID="${2:-}"
      shift 2
      ;;
    --avd)
      EMULATOR_AVD="${2:-}"
      shift 2
      ;;
    --no-start-emulator)
      AUTO_START_EMULATOR="false"
      shift
      ;;
    --boot-timeout)
      BOOT_TIMEOUT_SECONDS="${2:-}"
      shift 2
      ;;
    --package)
      PACKAGE_NAME="${2:-}"
      shift 2
      ;;
    --no-launch)
      LAUNCH_APP="false"
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

require_cmd gh
require_cmd adb

if ! [[ "$BOOT_TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || [[ "$BOOT_TIMEOUT_SECONDS" -le 0 ]]; then
  echo "Invalid --boot-timeout: ${BOOT_TIMEOUT_SECONDS}" >&2
  exit 1
fi

log "Checking gh authentication"
gh auth status >/dev/null

if [[ -z "$RUN_ID" ]]; then
  log "Finding latest successful run for workflow '${WORKFLOW_NAME}' on ref '${REF}'"
  RUN_ID="$(gh run list \
    --workflow "$WORKFLOW_NAME" \
    --branch "$REF" \
    --limit 30 \
    --json databaseId,conclusion \
    -q 'map(select(.conclusion == "success"))[0].databaseId')"
fi

if [[ -z "$RUN_ID" || "$RUN_ID" == "null" ]]; then
  echo "Could not find a successful run for workflow '${WORKFLOW_NAME}' on ref '${REF}'." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
log "Downloading artifact '${ARTIFACT_NAME}' from run ${RUN_ID}"
gh run download "$RUN_ID" -n "$ARTIFACT_NAME" -D "$OUTPUT_DIR"

APK_PATH="$(find "$OUTPUT_DIR" -type f -name '*.apk' | head -n 1)"
if [[ -z "$APK_PATH" ]]; then
  echo "Downloaded artifact but no APK found in ${OUTPUT_DIR}." >&2
  exit 1
fi

if [[ -z "$DEVICE_ID" ]]; then
  start_emulator_if_needed
fi

if [[ -z "$DEVICE_ID" ]]; then
  echo "No running emulator found. Start one, pass --device, or omit --no-start-emulator." >&2
  exit 1
fi

if ! adb devices | awk '$2 == "device" {print $1}' | grep -Fxq "$DEVICE_ID"; then
  echo "Device '${DEVICE_ID}' is not connected in adb devices output." >&2
  exit 1
fi

log "Installing APK to ${DEVICE_ID}: ${APK_PATH}"
adb -s "$DEVICE_ID" install -r "$APK_PATH"

if [[ "$LAUNCH_APP" == "true" ]]; then
  log "Launching app package '${PACKAGE_NAME}' on ${DEVICE_ID}"
  adb -s "$DEVICE_ID" shell monkey -p "$PACKAGE_NAME" -c android.intent.category.LAUNCHER 1 >/dev/null
fi

log "Done"
