#!/bin/bash
set -euo pipefail
TOKEN="$(security find-generic-password -s codingvibes-macos-runner-token -w)"
export CODINGVIBES_MACOS_RUNNER_TOKEN="$TOKEN"
if security find-generic-password -s codingvibes-artifact-upload-token >/dev/null 2>&1; then
  export CODINGVIBES_ARTIFACT_UPLOAD_TOKEN="$(security find-generic-password -s codingvibes-artifact-upload-token -w)"
fi
exec /usr/bin/node /opt/codingvibes-macos-runner/server.mjs
