#!/usr/bin/env bash
#
# Runs the full Track A pipeline against the Sample LEA worked example and
# prints the coverage report. Pass --open to also try to open the stripped
# OpenAPI doc in Swagger UI (best effort; requires `npx`).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PROFILE="examples/sample-lea/sample-lea.profile.yaml"
BASE="examples/ed-fi-base/openapi-5.2.yaml"
OUT="output"

echo "==> Building packages"
npm run build --silent

echo "==> Validating profile against base spec"
node packages/edfi-profile-cli/dist/cli.js validate --profile "$PROFILE" --base "$BASE" || true

echo
echo "==> Generating artifacts"
node packages/edfi-profile-cli/dist/cli.js generate \
  --profile "$PROFILE" --base "$BASE" --out-dir "$OUT"

echo
echo "==> Coverage report ($OUT/coverage.md)"
echo "------------------------------------------------------------"
cat "$OUT/coverage.md"
echo "------------------------------------------------------------"

if [[ "${1:-}" == "--open" ]]; then
  echo
  echo "==> Rendering the stripped spec in Swagger UI (Ctrl-C to stop)"
  npx --yes swagger-ui-watcher "$OUT/openapi-stripped.yaml" || \
    echo "Could not launch Swagger UI; open $OUT/openapi-stripped.yaml in editor.swagger.io instead."
fi
