#!/usr/bin/env bash
# FileUpShare — autoupdate script
# Called by the server via: bash /opt/fileupshare/autoupdate.sh
# Reports progress via /tmp/fus-update-progress.json

set -euo pipefail

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
TMP_DIR="/tmp/fileupshare-update-$$"
PROGRESS_FILE="/tmp/fus-update-progress.json"
SVC="fileupshare"

# ── helpers ────────────────────────────────────────────────────────────────────
progress() {
  local pct="$1" step="$2"
  printf '{"step":"%s","pct":%s,"ts":%s}\n' \
    "$step" "$pct" "$(date +%s)" > "$PROGRESS_FILE"
}

fail() {
  printf '{"step":"error","pct":0,"error":"%s","ts":%s}\n' \
    "$1" "$(date +%s)" > "$PROGRESS_FILE"
  exit 1
}

# ── cleanup on exit ─────────────────────────────────────────────────────────
cleanup() {
  rm -rf "$TMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT

# ── 1. DOWNLOAD ─────────────────────────────────────────────────────────────
progress 5 "Скачивание репозитория"
rm -rf "$TMP_DIR"
git clone --depth 1 "https://github.com/${REPO}.git" "$TMP_DIR" \
  || fail "git clone failed"

# ── 2. BACKUP user data ─────────────────────────────────────────────────────
progress 15 "Резервное копирование данных"
BACKUP_DIR="/tmp/fus-backup-$$"
mkdir -p "$BACKUP_DIR"

# database
[ -f "$INSTALL_DIR/server/data.json" ]       && cp "$INSTALL_DIR/server/data.json"       "$BACKUP_DIR/"  || true
[ -f "$INSTALL_DIR/server/db.json" ]         && cp "$INSTALL_DIR/server/db.json"         "$BACKUP_DIR/"  || true

# config / settings
[ -f "$DATA_DIR/config.json" ]               && cp "$DATA_DIR/config.json"               "$BACKUP_DIR/"  || true
[ -f "$INSTALL_DIR/server/config.json" ]     && cp "$INSTALL_DIR/server/config.json"     "$BACKUP_DIR/"  || true

# shares + uploads metadata
[ -d "$DATA_DIR/shares" ]   && cp -r "$DATA_DIR/shares"   "$BACKUP_DIR/"                 || true
[ -d "$DATA_DIR/received" ] && cp -r "$DATA_DIR/received" "$BACKUP_DIR/"                 || true

# ── 3. UPDATE system files ──────────────────────────────────────────────────
progress 30 "Обновление системных файлов"

# copy source files
cp -r "$TMP_DIR/server"         "$INSTALL_DIR/"
cp -r "$TMP_DIR/src"            "$INSTALL_DIR/"
cp    "$TMP_DIR/index.html"     "$INSTALL_DIR/"
cp    "$TMP_DIR/package.json"   "$INSTALL_DIR/"
cp    "$TMP_DIR/package-lock.json" "$INSTALL_DIR/" 2>/dev/null || true
cp    "$TMP_DIR/vite.config.ts" "$INSTALL_DIR/"    2>/dev/null || true
cp    "$TMP_DIR/tsconfig.json"  "$INSTALL_DIR/"    2>/dev/null || true
cp    "$TMP_DIR/autoupdate.sh"  "$INSTALL_DIR/"    2>/dev/null || true
cp    "$TMP_DIR/version.json"   "$INSTALL_DIR/"    2>/dev/null || true

# ── 4. RESTORE user data ────────────────────────────────────────────────────
progress 40 "Восстановление пользовательских данных"

[ -f "$BACKUP_DIR/data.json" ]   && cp "$BACKUP_DIR/data.json"   "$INSTALL_DIR/server/"  || true
[ -f "$BACKUP_DIR/db.json" ]     && cp "$BACKUP_DIR/db.json"     "$INSTALL_DIR/server/"  || true
[ -f "$BACKUP_DIR/config.json" ] && cp "$BACKUP_DIR/config.json" "$DATA_DIR/"            || true

rm -rf "$BACKUP_DIR"

# ── 5. INSTALL dependencies (including devDependencies + vite) ─────────────
progress 55 "Установка зависимостей"
cd "$INSTALL_DIR"

# Always do a clean install so vite and all devDependencies are present
# Remove any stale node_modules to avoid version conflicts
rm -rf node_modules 2>/dev/null || true

# npm ci is faster and reproducible; fall back to npm install if lock is missing
if [ -f package-lock.json ]; then
  npm ci --include=dev 2>&1 || npm install --include=dev 2>&1 || fail "npm install failed"
else
  npm install --include=dev 2>&1 || fail "npm install failed"
fi

# Verify vite is available before building
if ! [ -x "./node_modules/.bin/vite" ]; then
  fail "vite not found after npm install"
fi

# ── 6. BUILD frontend ───────────────────────────────────────────────────────
progress 75 "Сборка фронтенда"
npm run build 2>&1 || fail "npm run build failed"

# Verify build output
[ -f "$INSTALL_DIR/dist/index.html" ] || fail "Build produced no dist/index.html"

# ── 7. RESTART service ──────────────────────────────────────────────────────
progress 90 "Перезапуск сервиса"
systemctl restart "$SVC" 2>&1 || fail "systemctl restart failed"

# ── 8. DONE ─────────────────────────────────────────────────────────────────
sleep 1
progress 100 "Готово"
