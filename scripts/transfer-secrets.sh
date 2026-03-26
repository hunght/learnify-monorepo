#!/usr/bin/env bash
# transfer-secrets.sh — Copy secrets from a .env-style file into a GitHub repo.
#
# Usage:
#   ./scripts/transfer-secrets.sh --file <secrets-file> --repo <owner/repo>
#
# The secrets file should contain KEY=VALUE pairs, one per line.
# Lines starting with # are ignored. Values may be single- or double-quoted.
#
# Example secrets file:
#   BUILD_CERTIFICATE_BASE64=MIIG...base64...
#   P12_PASSWORD=my-password
#   APPLE_ID=dev@example.com
#
# To create the template, run:
#   ./scripts/transfer-secrets.sh --template

set -euo pipefail

REPO=""
SECRETS_FILE=""
DRY_RUN="false"
SHOW_TEMPLATE="false"

TARGET_REPO="hunght/learnify-monorepo"

DESKTOP_SECRETS=(
  BUILD_CERTIFICATE_BASE64
  P12_PASSWORD
  KEYCHAIN_PASSWORD
  APPLE_SIGNING_IDENTITY
  APPLE_ID
  APPLE_ID_PASSWORD
  APPLE_TEAM_ID
  VITE_PUBLIC_POSTHOG_KEY
  VITE_PUBLIC_POSTHOG_HOST
)

usage() {
  cat <<'EOF'
Usage:
  transfer-secrets.sh --file <path>           Transfer secrets from file to repo
  transfer-secrets.sh --template              Print a template secrets file to fill in
  transfer-secrets.sh --interactive           Prompt for each secret value interactively

Options:
  --file <path>       Path to secrets file (KEY=VALUE format)
  --repo <owner/repo> Target GitHub repo (default: hunght/learnify-monorepo)
  --dry-run           Print what would be set without actually setting
  --interactive       Prompt for each secret value interactively
  --template          Print a blank template secrets file
  --help              Show this help

Examples:
  # Fill in the template, then transfer
  ./scripts/transfer-secrets.sh --template > .secrets.env
  # (edit .secrets.env with real values)
  ./scripts/transfer-secrets.sh --file .secrets.env

  # Interactive mode — enter each value when prompted
  ./scripts/transfer-secrets.sh --interactive
EOF
}

print_template() {
  cat <<'EOF'
# LearnifyTube secrets — fill in values then run:
#   ./scripts/transfer-secrets.sh --file <this-file>
#
# WARNING: Never commit this file. It is already in .gitignore.

# ── macOS code signing ──────────────────────────────────────────────────────
# Base64-encoded .p12 certificate file:
#   base64 -i Certificates.p12 | pbcopy
BUILD_CERTIFICATE_BASE64=

# Password used when exporting the .p12 certificate from Keychain
P12_PASSWORD=

# A strong random password for the temporary CI keychain
KEYCHAIN_PASSWORD=

# The exact identity string from: security find-identity -v -p codesigning
# e.g. "Developer ID Application: Your Name (TEAMID)"
APPLE_SIGNING_IDENTITY=

# ── Apple notarization ───────────────────────────────────────────────────────
# Your Apple Developer account email
APPLE_ID=

# App-specific password from appleid.apple.com
APPLE_ID_PASSWORD=

# 10-char team ID from developer.apple.com/account
APPLE_TEAM_ID=

# ── Analytics (optional) ─────────────────────────────────────────────────────
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
EOF
}

interactive_mode() {
  local repo="${1}"
  echo "Setting secrets interactively for ${repo}"
  echo "Press Enter to skip a secret (it will not be changed)."
  echo ""

  for secret in "${DESKTOP_SECRETS[@]}"; do
    printf "  %s: " "$secret"
    read -r -s value
    echo ""
    if [[ -z "$value" ]]; then
      echo "  ↳ skipped"
      continue
    fi
    printf '%s' "$value" | gh secret set "$secret" --repo "$repo"
    echo "  ↳ set ✓"
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      SECRETS_FILE="${2:-}"
      shift 2
      ;;
    --repo)
      TARGET_REPO="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    --interactive)
      SHOW_TEMPLATE="interactive"
      shift
      ;;
    --template)
      SHOW_TEMPLATE="template"
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

if [[ "$SHOW_TEMPLATE" == "template" ]]; then
  print_template
  exit 0
fi

if [[ "$SHOW_TEMPLATE" == "interactive" ]]; then
  interactive_mode "$TARGET_REPO"
  echo ""
  echo "Done. Secrets set in ${TARGET_REPO}"
  exit 0
fi

if [[ -z "$SECRETS_FILE" ]]; then
  echo "Error: --file or --interactive is required." >&2
  usage
  exit 1
fi

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "Error: secrets file not found: ${SECRETS_FILE}" >&2
  exit 1
fi

echo "Transferring secrets to ${TARGET_REPO}"
echo ""

set_count=0
skip_count=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Parse KEY=VALUE (strip optional surrounding quotes from value)
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    raw_value="${BASH_REMATCH[2]}"

    # Strip surrounding single or double quotes
    if [[ "$raw_value" =~ ^\'(.*)\'$ ]] || [[ "$raw_value" =~ ^\"(.*)\"$ ]]; then
      value="${BASH_REMATCH[1]}"
    else
      value="$raw_value"
    fi

    if [[ -z "$value" ]]; then
      echo "  SKIP  ${key}  (empty value)"
      ((skip_count++)) || true
      continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
      echo "  DRY   ${key}  (${#value} chars)"
    else
      printf '%s' "$value" | gh secret set "$key" --repo "$TARGET_REPO"
      echo "  SET   ${key}  ✓"
      ((set_count++)) || true
    fi
  else
    echo "  WARN  Skipping unrecognized line: ${line}" >&2
  fi
done < "$SECRETS_FILE"

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo "Dry run complete. No secrets were changed."
else
  echo "Done. ${set_count} secret(s) set, ${skip_count} skipped."
fi
