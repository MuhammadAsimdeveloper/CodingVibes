#!/usr/bin/env bash
set -euo pipefail
# Provisions a Linux host for codingVibes build runners. It intentionally does not
# accept or print GitHub credentials; provide a short-lived RUNNER_TOKEN at execution time.
: "${RUNNER_URL:?Set RUNNER_URL to the GitHub repository/org URL}"
: "${RUNNER_TOKEN:?Set RUNNER_TOKEN to a short-lived GitHub runner registration token}"
: "${RUNNER_NAME:?Set RUNNER_NAME}"
: "${RUNNER_LABELS:?Set RUNNER_LABELS, e.g. codingvibes,android-builder,x64}"
: "${RUNNER_VERSION:?Set RUNNER_VERSION to a pinned Actions Runner release, e.g. 2.328.0}"
: "${RUNNER_SHA256:?Set RUNNER_SHA256 to the exact tarball SHA-256}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl docker.io jq git unzip
sudo systemctl enable --now docker

ARCH="$(uname -m)"
case "$ARCH" in x86_64) A=x64;; aarch64|arm64) A=arm64;; *) echo "Unsupported arch: $ARCH" >&2; exit 2;; esac
mkdir -p "$HOME/actions-runner" && cd "$HOME/actions-runner"
VERSION="${RUNNER_VERSION#v}"
URL="https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-${A}-${VERSION}.tar.gz"
curl -fsSL -o runner.tar.gz "$URL"
echo "${RUNNER_SHA256}  runner.tar.gz" | sha256sum -c -
tar xzf runner.tar.gz
./config.sh --unattended --url "$RUNNER_URL" --token "$RUNNER_TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --replace
sudo ./svc.sh install "$(id -un)"
sudo ./svc.sh start
