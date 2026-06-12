#!/usr/bin/env bash
set -e

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
TMP_DIR="/tmp/fileupshare-update-$$"

trap 'rm -rf "$TMP_DIR"' EXIT

git clone --depth 1 "https://github.com/${REPO}.git" "$TMP_DIR"

cp -r "$TMP_DIR/server" "$INSTALL_DIR/"
cp -r "$TMP_DIR/src" "$INSTALL_DIR/"
cp "$TMP_DIR/index.html" "$INSTALL_DIR/"
cp "$TMP_DIR/package.json" "$INSTALL_DIR/"
cp "$TMP_DIR/package-lock.json" "$INSTALL_DIR/" 2>/dev/null || true
cp "$TMP_DIR/vite.config.ts" "$INSTALL_DIR/" 2>/dev/null || true
cp "$TMP_DIR/tsconfig.json" "$INSTALL_DIR/" 2>/dev/null || true
cp "$TMP_DIR/autoupdate.sh" "$INSTALL_DIR/" 2>/dev/null || true
cp "$TMP_DIR/version.json" "$INSTALL_DIR/" 2>/dev/null || true

cd "$INSTALL_DIR"
npm install --prefer-offline 2>/dev/null || npm install
npm run build

(sleep 2 && systemctl restart fileupshare) &
