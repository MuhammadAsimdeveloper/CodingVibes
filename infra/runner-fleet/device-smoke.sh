#!/usr/bin/env bash
set -euo pipefail
APK="${1:?APK path required}"
PACKAGE_ID="${2:?Android package id required}"
ACTIVITY="${3:-}"
: "${ADB_SERIAL:=}"
ADB=(adb); [[ -n "$ADB_SERIAL" ]] && ADB+=( -s "$ADB_SERIAL" )
"${ADB[@]}" wait-for-device
"${ADB[@]}" install -r "$APK"
if [[ -n "$ACTIVITY" ]]; then "${ADB[@]}" shell am start -n "${PACKAGE_ID}/${ACTIVITY}"; fi
"${ADB[@]}" shell pm list packages "$PACKAGE_ID" | grep -Fq "$PACKAGE_ID"
"${ADB[@]}" shell getprop ro.build.version.sdk
printf '%s\n' '{"installed":true,"verified":true}'
