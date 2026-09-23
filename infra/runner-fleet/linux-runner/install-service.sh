#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TOKEN:?Set CODINGVIBES_LINUX_RUNNER_TOKEN}"
: "${IMAGE_ANDROID:?Set digest-pinned Android image}"
: "${IMAGE_FLUTTER:?Set digest-pinned Flutter image}"
: "${IMAGE_RUST:?Set digest-pinned Rust image}"
: "${DEP_NETWORK:?Set codingvibes-deps-* network}"
: "${SOURCE_ROOT:?Set SOURCE_ROOT to the checked-out codingVibes runner files}"
command -v node >/dev/null || { echo 'Node.js 22+ is required' >&2; exit 2; }
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(2)" || { echo 'Node.js 22+ is required' >&2; exit 2; }
command -v docker >/dev/null || { echo 'Docker is required' >&2; exit 2; }
if [[ ! "$DEP_NETWORK" =~ ^codingvibes-deps-[a-z0-9-]{1,48}$ ]]; then echo 'unsafe dependency network' >&2; exit 2; fi
sudo useradd --system --create-home --home-dir /var/lib/codingvibes-runner --shell /usr/sbin/nologin codingvibes-runner 2>/dev/null || true
sudo install -d -o codingvibes-runner -g docker -m 0750 /var/lib/codingvibes-runner/runs
sudo install -d -o root -g root -m 0755 /opt/codingvibes-runner
sudo install -m 0755 "$SOURCE_ROOT/server.mjs" /opt/codingvibes-runner/server.mjs
sudo tee /etc/codingvibes/linux-runner.env >/dev/null <<EOF
PORT=${PORT:-8788}
NODE_ENV=production
CODINGVIBES_LINUX_RUNNER_TOKEN=${RUNNER_TOKEN}
CODINGVIBES_LINUX_WORK_ROOT=/var/lib/codingvibes-runner/runs
CODINGVIBES_ANDROID_RUNNER_IMAGE=${IMAGE_ANDROID}
CODINGVIBES_FLUTTER_RUNNER_IMAGE=${IMAGE_FLUTTER}
CODINGVIBES_RUST_RUNNER_IMAGE=${IMAGE_RUST}
CODINGVIBES_DEPENDENCY_NETWORK=${DEP_NETWORK}
CODINGVIBES_ARTIFACT_UPLOAD_URL=${CODINGVIBES_ARTIFACT_UPLOAD_URL:-}
CODINGVIBES_ARTIFACT_UPLOAD_TOKEN=${CODINGVIBES_ARTIFACT_UPLOAD_TOKEN:-}
EOF
sudo chmod 0600 /etc/codingvibes/linux-runner.env
sudo install -m 0644 "$SOURCE_ROOT/systemd.service" /etc/systemd/system/codingvibes-linux-runner.service
sudo systemctl daemon-reload
sudo systemctl enable --now codingvibes-linux-runner
curl -fsS http://127.0.0.1:${PORT:-8788}/health
