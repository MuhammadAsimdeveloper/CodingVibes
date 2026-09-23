#!/usr/bin/env bash
set -euo pipefail
kind="${1:?runner kind required}"
case "$kind" in
  android) java -version; sdkmanager --version; gradle --version; adb version ;;
  flutter) flutter --version; dart --version ;;
  rust) rustc --version; cargo --version; cargo tauri --version ;;
  *) echo "unknown runner: $kind" >&2; exit 2 ;;
esac
