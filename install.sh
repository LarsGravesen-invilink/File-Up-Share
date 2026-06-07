#!/usr/bin/env bash

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SVC="fileupshare"

R='\e[0;31m' G='\e[0;32m' Y='\e[1;33m' C='\e[0;36m' W='\e[1;37m' D='\e[2m' N='\e[0m'

banner() {
  clear
  echo ""
  echo -e "  ${C}╔══════════════════════════════════════════╗${N}"
  echo -e "  ${C}          ${W}F i l e U p S h a r e${N}"
  echo -e "  ${C}╚══════════════════════════════════════════╝${N}"
  echo ""
}

ok()   { echo -e "  ${G}✓${N} $1"; }
warn() { echo -e "  ${Y}!${N} $1"; }
err()  { echo -e "  ${R}✗${N} $1"; }
info() { echo -e "  ${D}$1${N}"; }

banner

if [ "$(id -u)" -ne 0 ]; then
  err "Запустите от root: ${W}sudo bash install.sh${N}"
  exit 1
fi

ALREADY_INSTALLED=0
if [ -f "$INSTALL_DIR/server/index.cjs" ] && systemctl is-active "$SVC" >/dev/null 2>&1; then
  ALREADY_INSTALLED=1
fi

if [ "$ALREADY_INSTALLED" -eq 1 ]; then
  echo -e "  ${W}FileUpShare уже установлен и работает${N}"
  echo ""
  echo -e "  ${D}Выберите действие:${N}"
  echo -e "  ${C}1${N} — Обновить"
  echo -e "  ${C}2${N} — Переустановить"
  echo -e "  ${C}3${N} — Выйти"
  echo ""
  printf "  Выбор: "
  read -r CHOICE
  case "$CHOICE" in
    1)
      echo ""
      info "Обновление..."
      cd /tmp && rm -rf File-Up-Share
      git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || { err "Ошибка загрузки"; exit 1; }
      cp -r /tmp/File-Up-Share/server "$INSTALL_DIR/" 2>/dev/null
      cp -r /tmp/File-Up-Share/src "$INSTALL_DIR/" 2>/dev/null
      cp /tmp/File-Up-Share/package.json "$INSTALL_DIR/" 2>/dev/null
      cp /tmp/File-Up-Share/vite.config.ts "$INSTALL_DIR/" 2>/dev/null
      cp /tmp/File-Up-Share/tsconfig.json "$INSTALL_DIR/" 2>/dev/null
      cp /tmp/File-Up-Share/index.html "$INSTALL_DIR/" 2>/dev/null
      cd "$INSTALL_DIR"
      npm install >/dev/null 2>&1
      npm run build >/dev/null 2>&1
      systemctl restart "$SVC"
      rm -rf /tmp/File-Up-Share
      echo ""
      ok "Обновлено и перезапущено"
      exit 0
      ;;
    3) exit 0 ;;
    *) info "Переустановка..." ;;
  esac
  echo ""
fi

echo -e "  ${D}Введите домен или оставьте пустым для IP${N}"
echo ""
printf "  ${W}Домен: ${N}"
read -r INPUT_DOMAIN

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')

echo ""
echo -e "  ${W}Подготовка${N}"
echo ""

export DEBIAN_FRONTEND=noninteractive

apt-get update -qq >/dev/null 2>&1 || true
ok "Репозитории"

for pkg in git curl nginx; do
  if ! dpkg -l "$pkg" 2>/dev/null | grep -q "^ii"; then
    apt-get install -y "$pkg" >/dev/null 2>&1 || true
  fi
done
ok "git, curl, nginx"

if ! command -v node >/dev/null 2>&1; then
  info "Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
fi
if command -v node >/dev/null 2>&1; then
  ok "Node.js $(node -v)"
else
  err "Node.js не установлен"
  exit 1
fi

echo ""
echo -e "  ${W}Установка FileUpShare${N}"
echo ""

mkdir -p "$INSTALL_DIR" "$DATA_DIR/shares" "$DATA_DIR/received"

cd /tmp && rm -rf File-Up-Share
git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || { err "Загрузка не удалась"; exit 1; }
cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null
cp -r /tmp/File-Up-Share/.gitignore "$INSTALL_DIR/" 2>/dev/null
ok "Загружено"

cd "$INSTALL_DIR"
npm install >/dev/null 2>&1
ok "Модули"

info "Сборка панели..."
if npm run build >/dev/null 2>&1 && [ -f "$INSTALL_DIR/dist/index.html" ]; then
  ok "Собрано"
else
  warn "Сборка не удалась, панель покажет инструкцию"
fi

NODE_PORT=3000
while ss -tlnp 2>/dev/null | grep -q ":${NODE_PORT} "; do
  NODE_PORT=$((NODE_PORT + 1))
done

cat > /etc/systemd/system/${SVC}.service << EOF
[Unit]
Description=FileUpShare
After=network.target

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
Environment=PORT=${NODE_PORT}
Environment=DATA_DIR=${DATA_DIR}
Environment=NODE_ENV=production
ExecStart=$(which node) ${INSTALL_DIR}/server/index.cjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SVC" >/dev/null 2>&1
systemctl restart "$SVC"
sleep 1

if systemctl is-active "$SVC" >/dev/null 2>&1; then
  ok "Сервис запущен (порт $NODE_PORT)"
else
  err "Сервис не запустился"
  journalctl -u "$SVC" -n 10 --no-pager
  echo ""
fi

rm -f /etc/nginx/sites-enabled/default 2>/dev/null

USE_SSL=0
PANEL_URL="http://${SERVER_IP}"

if [ -n "$INPUT_DOMAIN" ]; then
  DOMAIN="$INPUT_DOMAIN"

  cat > /etc/nginx/sites-available/${SVC} << NGXEOF
server {
    listen 80;
    server_name ${DOMAIN};
    client_max_body_size 10G;
    location / {
        proxy_pass http://127.0.0.1:${NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
    }
}
NGXEOF

  ln -sf /etc/nginx/sites-available/${SVC} /etc/nginx/sites-enabled/ 2>/dev/null
  nginx -t >/dev/null 2>&1 && systemctl restart nginx
  ok "Nginx → http://${DOMAIN}"
  PANEL_URL="http://${DOMAIN}"

  DOMAIN_IP=$(dig +short "$DOMAIN" A 2>/dev/null | head -1)
  if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
    info "Получение SSL..."
    apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1

    if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
      --email "admin@${DOMAIN}" --redirect >/dev/null 2>&1; then
      USE_SSL=1
      systemctl restart nginx
      ok "SSL установлен"
      PANEL_URL="https://${DOMAIN}"
    else
      warn "SSL не получен (панель работает по HTTP)"
      info "Позже: certbot --nginx -d ${DOMAIN}"
    fi
  else
    warn "DNS: ${DOMAIN} → ${DOMAIN_IP:-?} (сервер: ${SERVER_IP})"
    info "SSL пропущен — домен не указывает на сервер"
  fi

else
  cat > /etc/nginx/sites-available/${SVC} << NGXEOF
server {
    listen 80 default_server;
    client_max_body_size 10G;
    location / {
        proxy_pass http://127.0.0.1:${NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
    }
}
NGXEOF

  ln -sf /etc/nginx/sites-available/${SVC} /etc/nginx/sites-enabled/ 2>/dev/null
  nginx -t >/dev/null 2>&1 && systemctl restart nginx
  ok "Nginx → http://${SERVER_IP}"
fi

cat > /usr/local/bin/update-fileupshare << 'USCRIPT'
#!/bin/bash
echo "Обновление FileUpShare..."
cd /tmp && rm -rf File-Up-Share
git clone --depth 1 https://github.com/LarsGravesen-invilink/File-Up-Share.git >/dev/null 2>&1
cp -r /tmp/File-Up-Share/server /opt/fileupshare/
cp -r /tmp/File-Up-Share/src /opt/fileupshare/
cp /tmp/File-Up-Share/package.json /opt/fileupshare/
cp /tmp/File-Up-Share/vite.config.ts /opt/fileupshare/ 2>/dev/null
cp /tmp/File-Up-Share/tsconfig.json /opt/fileupshare/ 2>/dev/null
cp /tmp/File-Up-Share/index.html /opt/fileupshare/ 2>/dev/null
cd /opt/fileupshare && npm install >/dev/null 2>&1 && npm run build >/dev/null 2>&1
systemctl restart fileupshare
rm -rf /tmp/File-Up-Share
echo "Готово"
USCRIPT
chmod +x /usr/local/bin/update-fileupshare

cat > /usr/local/bin/uninstall-fileupshare << 'USCRIPT'
#!/bin/bash
echo "Удаление FileUpShare..."
systemctl stop fileupshare 2>/dev/null; systemctl disable fileupshare 2>/dev/null
rm -f /etc/systemd/system/fileupshare.service
rm -f /etc/nginx/sites-available/fileupshare /etc/nginx/sites-enabled/fileupshare
systemctl daemon-reload; nginx -t >/dev/null 2>&1 && systemctl reload nginx 2>/dev/null
rm -rf /opt/fileupshare /var/lib/fileupshare
rm -f /usr/local/bin/update-fileupshare /usr/local/bin/uninstall-fileupshare
echo "Удалено"
USCRIPT
chmod +x /usr/local/bin/uninstall-fileupshare

rm -rf /tmp/File-Up-Share

banner

if systemctl is-active "$SVC" >/dev/null 2>&1; then
  echo -e "  ${G}Установка завершена успешно${N}"
else
  echo -e "  ${Y}Установлено, но сервис не запущен${N}"
  info "journalctl -u ${SVC} -n 20"
fi
echo ""
echo -e "  ${C}Панель:${N}  ${W}${PANEL_URL}${N}"
echo -e "  ${D}Порт:    ${NODE_PORT}${N}"
echo -e "  ${D}Данные:  ${DATA_DIR}${N}"
echo ""
echo -e "  ${D}update-fileupshare     — обновить${N}"
echo -e "  ${D}uninstall-fileupshare  — удалить${N}"
echo ""
echo -e "  ${D}by LarsGravesen | invilink${N}"
echo ""
