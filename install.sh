#!/usr/bin/env bash
set -e

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"

G='\e[0;32m'
C='\e[0;36m'
W='\e[1;37m'
D='\e[2m'
N='\e[0m'

echo ""
echo -e "  ${C}╔══════════════════════════════════════════╗${N}"
echo -e "  ${C}          ${W}F i l e U p S h a r e${N}"
echo -e "  ${C}╚══════════════════════════════════════════╝${N}"
echo ""
echo -e "  ${D}Панель управления раздачами и загрузками${N}"
echo -e "  ${D}файлов на вашем Linux VPS${N}"
echo ""

if [ "$EUID" -ne 0 ]; then
  echo -e "  \e[0;31mЗапустите от root: sudo bash install.sh${N}"
  exit 1
fi

echo -e "  ${D}Обновление пакетов...${N}"
apt-get update -qq >/dev/null 2>&1 || yum update -q -y >/dev/null 2>&1 || true
echo -e "  ${G}✓${N} Пакеты обновлены"

for dep in git curl; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    echo -e "  ${D}Установка ${dep}...${N}"
    apt-get install -y "$dep" >/dev/null 2>&1 || yum install -y "$dep" >/dev/null 2>&1 || true
  fi
done
echo -e "  ${G}✓${N} Зависимости"

if ! command -v node >/dev/null 2>&1; then
  echo -e "  ${D}Установка Node.js 20...${N}"
  curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
  apt-get install -y nodejs >/dev/null 2>&1 || true
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
    yum install -y nodejs >/dev/null 2>&1 || true
  fi
fi
echo -e "  ${G}✓${N} Node.js $(node -v 2>/dev/null || echo 'installed')"

mkdir -p "$INSTALL_DIR" "$DATA_DIR/shares" "$DATA_DIR/received"

echo -e "  ${D}Загрузка из репозитория...${N}"
cd /tmp
rm -rf File-Up-Share
git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || {
  echo -e "  \e[0;31m✗ Не удалось клонировать репозиторий${N}"
  exit 1
}
echo -e "  ${G}✓${N} Репозиторий загружен"

echo -e "  ${D}Копирование файлов...${N}"
cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null || true
cp -r /tmp/File-Up-Share/.* "$INSTALL_DIR/" 2>/dev/null || true
echo -e "  ${G}✓${N} Файлы скопированы"

echo -e "  ${D}Установка модулей...${N}"
cd "$INSTALL_DIR"
npm install --production >/dev/null 2>&1
echo -e "  ${G}✓${N} Модули установлены"

if [ -f "$INSTALL_DIR/package.json" ] && grep -q '"build"' "$INSTALL_DIR/package.json"; then
  echo -e "  ${D}Сборка панели...${N}"
  npm run build >/dev/null 2>&1 || true
  echo -e "  ${G}✓${N} Панель собрана"
fi

PORT=3000
while ss -tlnp 2>/dev/null | grep -q ":${PORT} "; do
  PORT=$((PORT + 1))
done

cat > /etc/systemd/system/${SERVICE_NAME}.service << UNIT
[Unit]
Description=FileUpShare Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment=PORT=${PORT}
Environment=DATA_DIR=${DATA_DIR}
Environment=NODE_ENV=production
ExecStart=$(which node) ${INSTALL_DIR}/server/index.cjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null 2>&1
systemctl restart "$SERVICE_NAME"

sleep 2

cat > /usr/local/bin/update-fileupshare << 'UPDSCRIPT'
#!/bin/bash
cd /tmp && rm -rf File-Up-Share
git clone --depth 1 https://github.com/LarsGravesen-invilink/File-Up-Share.git >/dev/null 2>&1
cp -r /tmp/File-Up-Share/* /opt/fileupshare/ 2>/dev/null
cd /opt/fileupshare && npm install --production >/dev/null 2>&1
if grep -q '"build"' /opt/fileupshare/package.json 2>/dev/null; then
  npm run build >/dev/null 2>&1 || true
fi
systemctl restart fileupshare
echo "FileUpShare обновлён"
UPDSCRIPT
chmod +x /usr/local/bin/update-fileupshare

cat > /usr/local/bin/uninstall-fileupshare << 'UNSCRIPT'
#!/bin/bash
systemctl stop fileupshare 2>/dev/null
systemctl disable fileupshare 2>/dev/null
rm -f /etc/systemd/system/fileupshare.service
systemctl daemon-reload
rm -rf /opt/fileupshare
rm -rf /var/lib/fileupshare
rm -f /usr/local/bin/update-fileupshare
rm -f /usr/local/bin/uninstall-fileupshare
echo "FileUpShare удалён"
UNSCRIPT
chmod +x /usr/local/bin/uninstall-fileupshare

rm -rf /tmp/File-Up-Share

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo -e "  ${G}══════════════════════════════════════════${N}"
echo -e "  ${W}FileUpShare установлен!${N}"
echo -e "  ${G}══════════════════════════════════════════${N}"
echo ""
echo -e "  ${C}Панель:${N} ${W}http://${SERVER_IP}:${PORT}${N}"
echo -e "  ${C}Порт:${N}   ${W}${PORT}${N}"
echo ""
echo -e "  ${D}Данные: ${DATA_DIR}${N}"
echo -e "  ${D}Панель: ${INSTALL_DIR}${N}"
echo ""
echo -e "  ${D}Команды:${N}"
echo -e "  ${C}update-fileupshare${N}    — обновить"
echo -e "  ${C}uninstall-fileupshare${N} — удалить"
echo -e "  ${C}systemctl status fileupshare${N}"
echo -e "  ${C}systemctl restart fileupshare${N}"
echo ""
echo -e "  ${D}by LarsGravesen | invilink${N}"
echo ""
