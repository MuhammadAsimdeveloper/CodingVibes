#!/usr/bin/env bash
set -euo pipefail
: "${REGISTRY:=ghcr.io/codingvibes}"
: "${VERSION:=2.6.0}"
command -v docker >/dev/null || { echo 'Docker is required' >&2; exit 2; }
for kind in android flutter rust; do
  image="${REGISTRY}/runner-${kind}:${VERSION}"
  docker build --pull --platform linux/amd64 -t "$image" -f "runners/images/${kind}/Dockerfile" .
  docker inspect --format='{{index .RepoDigests 0}}' "$image" || true
done
