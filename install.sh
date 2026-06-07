#!/usr/bin/env bash
set -e

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"

R='\e[0;31m'
G='\e[0;32m'
Y='\e[1;33m'
C='\e[0;36m'
W='\e[1;37m'
D='\e[2m'
B='\e[1m'
N='\e[0m'

DOMAIN=""
USE_SSL=0
NODE_PORT=0

is_port_free() {
  ! ss -tlnp 2>/dev/null | grep -q ":$1 " && ! netstat -tlnp 2>/dev/null | grep -q ":$1 "
}

random_free_port() {
  local p
  for p in $(seq 3000 5000); do
    if is_port_free "$p"; then echo "$p"; return; fi
  done
  echo "3000"
}

cls() {
  clear
  echo ""
  echo -e "  ${C}╔══════════════════════════════════════════╗${N}"
  echo -e "  ${C}          ${W}F i l e U p S h a r e${N}"
  echo -e "  ${C}╚══════════════════════════════════════════╝${N}"
  echo ""
}

cls

if [ "$EUID" -ne 0 ]; then
  echo -e "  ${R}Запустите от root:${N}"
  echo -e "  ${W}sudo bash install.sh${N}"
  exit 1
fi

echo -e "  ${D}Панель управления раздачами и загрузками${N}"
echo -e "  ${D}файлов на вашем Linux VPS${N}"
echo ""
echo -e "  ${D}──────────────────────────────────────────${N}"
echo ""

echo -e "  ${D}Введите домен или оставьте пустым для IP${N}"
echo ""
printf "  ${B}Домен: ${N}"
read -r DOMAIN

NODE_PORT=$(random_free_port)

if [ -z "$DOMAIN" ]; then
  DOMAIN=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -z "$DOMAIN" ] && DOMAIN="localhost"
  USE_SSL=0
  echo ""
  echo -e "  ${Y}Режим: HTTP (без домена)${N}"
  echo -e "  ${D}Порт Node.js: ${W}${NODE_PORT}${N}"
  echo ""
else
  echo ""
  echo -e "  ${D}Проверка домена ${C}${DOMAIN}${N}..."

  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  DOMAIN_IP=$(dig +short "$DOMAIN" A 2>/dev/null | head -1)
  [ -z "$DOMAIN_IP" ] && DOMAIN_IP=$(host "$DOMAIN" 2>/dev/null | grep 'has address' | head -1 | awk '{print $NF}')

  if [ -n "$DOMAIN_IP" ] && [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
    echo -e "  ${G}✓${N} DNS → ${DOMAIN_IP}"

    echo -e "  ${D}Попытка получить SSL...${N}"

    apt-get install -y certbot >/dev/null 2>&1 || true

    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
      echo -e "  ${G}✓${N} SSL сертификат найден"
      USE_SSL=1
    else
      systemctl stop nginx >/dev/null 2>&1 || true

      if certbot certonly --standalone --preferred-challenges http -d "$DOMAIN" \
        --non-interactive --agree-tos --email "admin@${DOMAIN}" \
        --http-01-port 80 >/dev/null 2>&1; then
        echo -e "  ${G}✓${N} SSL сертификат получен"
        USE_SSL=1
      else
        echo -e "  ${Y}!${N} SSL не удалось получить"
        echo -e "  ${D}  Возможные причины:${N}"
        echo -e "  ${D}  - Порт 80 занят другим процессом${N}"
        echo -e "  ${D}  - Firewall блокирует порт 80${N}"
        echo -e "  ${D}  - Домен не указывает на этот IP${N}"
        echo ""
        echo -e "  ${D}Продолжаем без SSL (HTTP)${N}"
        USE_SSL=0
      fi
    fi
  else
    if [ -n "$DOMAIN_IP" ]; then
      echo -e "  ${Y}!${N} DNS → ${DOMAIN_IP} (сервер: ${SERVER_IP})"
    else
      echo -e "  ${R}✗${N} DNS не найден"
    fi
    echo -e "  ${Y}Продолжаем без SSL${N}"
    USE_SSL=0
  fi
  echo ""
fi

echo -e "  ${D}──────────────────────────────────────────${N}"
echo ""

echo -e "  ${D}Обновление пакетов...${N}"
apt-get update -qq >/dev/null 2>&1 || yum update -q -y >/dev/null 2>&1 || true
echo -e "  ${G}✓${N} Пакеты"

for dep in git curl; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    apt-get install -y "$dep" >/dev/null 2>&1 || yum install -y "$dep" >/dev/null 2>&1 || true
  fi
done

if ! command -v node >/dev/null 2>&1; then
  echo -e "  ${D}Установка Node.js...${N}"
  curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
  apt-get install -y nodejs >/dev/null 2>&1 || true
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
    yum install -y nodejs >/dev/null 2>&1 || true
  fi
fi
echo -e "  ${G}✓${N} Node.js $(node -v 2>/dev/null)"

if [ "$USE_SSL" -eq 1 ] || [ -n "$DOMAIN" ]; then
  if ! command -v nginx >/dev/null 2>&1; then
    echo -e "  ${D}Установка Nginx...${N}"
    apt-get install -y nginx >/dev/null 2>&1 || yum install -y nginx >/dev/null 2>&1 || true
  fi
  echo -e "  ${G}✓${N} Nginx"
fi

mkdir -p "$INSTALL_DIR" "$DATA_DIR/shares" "$DATA_DIR/received"

echo -e "  ${D}Загрузка FileUpShare...${N}"
cd /tmp && rm -rf File-Up-Share
git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || {
  echo -e "  ${R}✗ Не удалось загрузить${N}"; exit 1
}
cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null || true
echo -e "  ${G}✓${N} Загружено"

cd "$INSTALL_DIR"
echo -e "  ${D}Установка модулей...${N}"
npm install --production >/dev/null 2>&1
echo -e "  ${G}✓${N} Модули"

if grep -q '"build"' "$INSTALL_DIR/package.json" 2>/dev/null; then
  echo -e "  ${D}Сборка панели...${N}"
  npm run build >/dev/null 2>&1 || true
  echo -e "  ${G}✓${N} Собрано"
fi

cat > /etc/systemd/system/${SERVICE_NAME}.service << UNIT
[Unit]
Description=FileUpShare Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment=PORT=${NODE_PORT}
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

if [ "$USE_SSL" -eq 1 ] && command -v nginx >/dev/null 2>&1; then
  cat > /etc/nginx/sites-available/${SERVICE_NAME} << NGXSSL
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 10G;
    location / {
        proxy_pass http://127.0.0.1:${NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
NGXSSL
  ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/ 2>/dev/null || true
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t >/dev/null 2>&1 && systemctl restart nginx
  echo -e "  ${G}✓${N} Nginx + SSL настроен"

elif [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && command -v nginx >/dev/null 2>&1; then
  cat > /etc/nginx/sites-available/${SERVICE_NAME} << NGXHTTP
server {
    listen 80;
    server_name ${DOMAIN};
    client_max_body_size 10G;
    location / {
        proxy_pass http://127.0.0.1:${NODE_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}
NGXHTTP
  ln -sf /etc/nginx/sites-available/${SERVICE_NAME} /etc/nginx/sites-enabled/ 2>/dev/null || true
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  nginx -t >/dev/null 2>&1 && systemctl restart nginx
  echo -e "  ${G}✓${N} Nginx HTTP настроен"
fi

cat > /usr/local/bin/update-fileupshare << 'UPDSCRIPT'
#!/bin/bash
echo "Обновление FileUpShare..."
cd /tmp && rm -rf File-Up-Share
git clone --depth 1 https://github.com/LarsGravesen-invilink/File-Up-Share.git >/dev/null 2>&1
cp -r /tmp/File-Up-Share/* /opt/fileupshare/ 2>/dev/null
cd /opt/fileupshare && npm install --production >/dev/null 2>&1
if grep -q '"build"' /opt/fileupshare/package.json 2>/dev/null; then
  npm run build >/dev/null 2>&1 || true
fi
systemctl restart fileupshare
rm -rf /tmp/File-Up-Share
echo "FileUpShare обновлён и перезапущен"
UPDSCRIPT
chmod +x /usr/local/bin/update-fileupshare

cat > /usr/local/bin/uninstall-fileupshare << 'UNSCRIPT'
#!/bin/bash
echo "Удаление FileUpShare..."
systemctl stop fileupshare 2>/dev/null
systemctl disable fileupshare 2>/dev/null
rm -f /etc/systemd/system/fileupshare.service
rm -f /etc/nginx/sites-available/fileupshare
rm -f /etc/nginx/sites-enabled/fileupshare
systemctl daemon-reload
nginx -t >/dev/null 2>&1 && systemctl restart nginx 2>/dev/null || true
rm -rf /opt/fileupshare
rm -rf /var/lib/fileupshare
rm -f /usr/local/bin/update-fileupshare
rm -f /usr/local/bin/uninstall-fileupshare
echo "FileUpShare полностью удалён"
UNSCRIPT
chmod +x /usr/local/bin/uninstall-fileupshare

rm -rf /tmp/File-Up-Share

sleep 2

SERVICE_STATUS=$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || echo "unknown")

cls

if [ "$SERVICE_STATUS" = "active" ]; then
  echo -e "  ${G}══════════════════════════════════════════${N}"
  echo -e "  ${W}FileUpShare установлен и запущен!${N}"
  echo -e "  ${G}══════════════════════════════════════════${N}"
else
  echo -e "  ${Y}══════════════════════════════════════════${N}"
  echo -e "  ${W}FileUpShare установлен${N}"
  echo -e "  ${Y}Сервис не запустился. Проверьте логи:${N}"
  echo -e "  ${D}journalctl -u fileupshare -n 30${N}"
  echo -e "  ${Y}══════════════════════════════════════════${N}"
fi
echo ""

if [ "$USE_SSL" -eq 1 ]; then
  echo -e "  ${C}Панель:${N} ${W}https://${DOMAIN}${N}"
elif [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && command -v nginx >/dev/null 2>&1; then
  echo -e "  ${C}Панель:${N} ${W}http://${DOMAIN}${N}"
  echo -e "  ${D}Также:  http://${DOMAIN}:${NODE_PORT}${N}"
else
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo -e "  ${C}Панель:${N} ${W}http://${SERVER_IP}:${NODE_PORT}${N}"
fi
echo ""
echo -e "  ${D}Node.js порт: ${NODE_PORT}${N}"
echo -e "  ${D}Данные:       ${DATA_DIR}${N}"
echo -e "  ${D}Панель:       ${INSTALL_DIR}${N}"
echo ""
echo -e "  ${D}Команды:${N}"
echo -e "  ${C}update-fileupshare${N}      — обновить"
echo -e "  ${C}uninstall-fileupshare${N}   — удалить"
echo -e "  ${C}systemctl status ${SERVICE_NAME}${N}"
echo -e "  ${C}systemctl restart ${SERVICE_NAME}${N}"
echo -e "  ${C}journalctl -u ${SERVICE_NAME} -f${N}"
echo ""
echo -e "  ${D}by LarsGravesen | invilink${N}"
echo ""
