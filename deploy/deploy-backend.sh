#!/bin/bash
# Deploy script for the enginemonitor backend on snpdnd.
# Usage: ./deploy/deploy-backend.sh [ref]        (ref: branch, tag or commit; default: integration)
# Obsolete predecessor: ../deployMaster (ecogium/forever era).
set -u

REF="${1:-integration}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE="enginemonitor"
PING_URL="http://127.0.0.1:8000/api/server/ping"

cd "$APP_DIR" || { echo "ERROR: cannot cd to $APP_DIR"; exit 1; }

echo "== Deploy backend: ref=$REF =="

# --- Preflight ---------------------------------------------------------------
if [ ! -d .git ]; then echo "ERROR: not a git repo: $APP_DIR"; exit 1; fi
if ! systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE}\.service"; then
  echo "ERROR: systemd unit ${SERVICE}.service not found"; exit 1
fi

OLD_COMMIT="$(git rev-parse --short HEAD)"
echo "Current commit: $OLD_COMMIT"

# Rollback anchor: keep the last known-good dist
if [ -d dist ]; then rm -rf dist.previous && cp -a dist dist.previous; fi

# --- Fetch & checkout --------------------------------------------------------
if ! git fetch origin; then echo "FETCH FAILED - aborting"; exit 1; fi
if ! git checkout "$REF"; then echo "CHECKOUT FAILED for $REF - aborting"; exit 1; fi
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "HEAD" ]; then
  if ! git pull --ff-only origin "$BRANCH"; then echo "PULL FAILED - aborting"; exit 1; fi
fi
NEW_COMMIT="$(git rev-parse --short HEAD)"
echo "Target commit:  $NEW_COMMIT"

# --- Dependencies (full ci when the lockfile changed or build tools missing) --
NEED_CI=0
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ] || git diff --quiet "$OLD_COMMIT" "$NEW_COMMIT" -- package-lock.json; then
  : # lockfile unchanged
else
  NEED_CI=1
fi
if [ ! -x node_modules/.bin/npm-run-all ] || [ ! -x node_modules/.bin/tsc ]; then
  echo "build tools missing from node_modules (runtime-only install) -> npm ci required"
  NEED_CI=1
fi
if [ "$NEED_CI" = "1" ]; then
  echo "running npm ci (full, includes dev dependencies needed to build)"
  if ! npm ci --no-audit --no-fund; then echo "NPM CI FAILED - aborting (dist untouched)"; exit 1; fi
else
  echo "package-lock.json unchanged and build tools present -> skipping npm ci"
fi

# --- Build -------------------------------------------------------------------
# Note: `npm run build` (npm-run-all clean lint tsc) does not work on Linux:
# /bin/sh expands the lint glob `src/**` before eslint sees it (the build
# historically ran on Windows; CI runs tsc+tests only). Deploy runs the
# equivalent steps directly and skips the lint --fix source mutation:
if ! (./node_modules/.bin/rimraf dist && ./node_modules/.bin/tsc); then
  echo "BUILD FAILED"
  if [ -d dist.previous ]; then rm -rf dist && cp -a dist.previous dist; echo "Previous dist restored (service keeps running old code)"; fi
  exit 1
fi

# --- Restart & health check --------------------------------------------------
sudo systemctl restart "$SERVICE"
sleep 4

if systemctl is-active --quiet "$SERVICE" && curl -sf "$PING_URL" >/dev/null; then
  echo "HEALTH OK"
  echo "== Deployed: $OLD_COMMIT -> $NEW_COMMIT =="
else
  echo "HEALTH FAILED - rolling back dist"
  if [ -d dist.previous ]; then
    rm -rf dist && cp -a dist.previous dist
    sudo systemctl restart "$SERVICE"
    sleep 4
    if systemctl is-active --quiet "$SERVICE" && curl -sf "$PING_URL" >/dev/null; then
      echo "ROLLBACK OK - service healthy on previous dist ($OLD_COMMIT)"
    else
      echo "ROLLBACK ALSO FAILED - manual attention required"
    fi
  else
    echo "No dist.previous available - manual attention required"
  fi
  exit 1
fi

DIRTY="$(git status --short | head -5)"
if [ -n "$DIRTY" ]; then echo "NOTE: working tree dirty after build (eslint --fix may have touched files):"; echo "$DIRTY"; fi
