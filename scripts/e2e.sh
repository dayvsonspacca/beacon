#!/usr/bin/env bash
# Builds the production Docker image, runs it with the e2e client config,
# and executes the black-box suite in test/ against it.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${BEACON_E2E_PORT:-3971}"
IMAGE=beacon-e2e
CONTAINER=beacon-e2e

docker build -t "$IMAGE" .

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run -d --name "$CONTAINER" \
  -p "$PORT:3000" \
  -v "$PWD/test/fixtures/beacon.e2e.toml:/app/beacon.toml:ro" \
  "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  if curl -fs "http://localhost:$PORT/health" >/dev/null 2>&1; then
    BEACON_URL="http://localhost:$PORT" bun test test
    exit $?
  fi
  sleep 1
done

echo "beacon container never became healthy" >&2
docker logs "$CONTAINER" >&2
exit 1
