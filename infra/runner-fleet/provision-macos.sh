#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_URL:?Set RUNNER_URL to the GitHub repository/org URL}"
: "${RUNNER_TOKEN:?Set RUNNER_TOKEN to a short-lived GitHub runner registration token}"
: "${RUNNER_NAME:?Set RUNNER_NAME}"
: "${RUNNER_LABELS:?Set RUNNER_LABELS, e.g. codingvibes,macos-xcode,xcode}"
: "${RUNNER_VERSION:?Set RUNNER_VERSION to a pinned Actions Runner release, e.g. 2.328.0}"
: "${RUNNER_SHA256:?Set RUNNER_SHA256 to the exact tarball SHA-256}"

xcode-select -p >/dev/null || { echo 'Xcode Command Line Tools are required; install Xcode and select it first.' >&2; exit 2; }
xcodebuild -version
swift --version
command -v git >/dev/null

ARCH="$(uname -m)"
case "$ARCH" in arm64) A=arm64;; x86_64) A=x64;; *) echo "Unsupported arch: $ARCH" >&2; exit 2;; esac
mkdir -p "$HOME/actions-runner" && cd "$HOME/actions-runner"
VERSION="${RUNNER_VERSION#v}"
URL="https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-osx-${A}-${VERSION}.tar.gz"
curl -fsSL -o runner.tar.gz "$URL"
echo "${RUNNER_SHA256}  runner.tar.gz" | shasum -a 256 -c -
tar xzf runner.tar.gz
./config.sh --unattended --url "$RUNNER_URL" --token "$RUNNER_TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --replace
./svc.sh install
./svc.sh start

# Install the codingVibes control-plane runner as a per-user LaunchAgent. Secrets are stored in Keychain, not the plist.
: "${CODINGVIBES_MACOS_RUNNER_TOKEN:?Set CODINGVIBES_MACOS_RUNNER_TOKEN for the HTTP runner}"
: "${CODINGVIBES_RUNNER_SOURCE:?Set CODINGVIBES_RUNNER_SOURCE to the checked-out infra/runner-fleet/macos-runner directory}"
command -v node >/dev/null || { echo 'Node.js 22+ is required for the HTTP runner' >&2; exit 2; }
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(2)" || { echo 'Node.js 22+ is required' >&2; exit 2; }
sudo mkdir -p /opt/codingvibes-macos-runner
sudo install -m 0755 "$CODINGVIBES_RUNNER_SOURCE/server.mjs" /opt/codingvibes-macos-runner/server.mjs
sudo install -m 0755 "$CODINGVIBES_RUNNER_SOURCE/start.sh" /opt/codingvibes-macos-runner/start.sh
sudo chown -R root:wheel /opt/codingvibes-macos-runner
security add-generic-password -U -a "$USER" -s codingvibes-macos-runner-token -w "$CODINGVIBES_MACOS_RUNNER_TOKEN"
if [[ -n "${CODINGVIBES_ARTIFACT_UPLOAD_TOKEN:-}" ]]; then security add-generic-password -U -a "$USER" -s codingvibes-artifact-upload-token -w "$CODINGVIBES_ARTIFACT_UPLOAD_TOKEN"; fi
PLIST="$HOME/Library/LaunchAgents/com.codingvibes.macos-runner.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cp "$CODINGVIBES_RUNNER_SOURCE/com.codingvibes.macos-runner.plist" "$PLIST"
launchctl bootout "gui/$UID/com.codingvibes.macos-runner" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$PLIST"
launchctl kickstart -k "gui/$UID/com.codingvibes.macos-runner"
