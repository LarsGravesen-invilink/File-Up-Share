#!/usr/bin/env bash

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}"
NGINX_LINK="/etc/nginx/sites-enabled/${SERVICE_NAME}"
SECRET_DIR="${INSTALL_DIR}/.secret"
VERSION_URL="https://raw.githubusercontent.com/${REPO}/main/version.json"

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

pbar() {
    local lbl="$1" i j p bar w=40
    for ((i=1;i<=w;i++)); do
        p=$((i*100/w))
        bar=""
        for ((j=1;j<=w;j++)); do
            if [ "$j" -le "$i" ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}%s${N} ${W}%3d%%${N}  ${D}%s${N}" "$bar" "$p" "$lbl"
        sleep 0.06
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  ${G}%s${N} ${G}100%%${N}  %s${N}\n" "$bar" "$lbl"
}

upbar() {
    local lbl="$1" pos=0 jmp p bar j w=40
    while [ "$pos" -lt "$w" ]; do
        jmp=$((RANDOM % 3 + 1))
        pos=$((pos + jmp))
        if [ "$pos" -gt "$w" ]; then pos=$w; fi
        p=$((pos*100/w))
        bar=""
        for ((j=1;j<=w;j++)); do
            if [ "$j" -le "$pos" ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}%s${N} ${W}%3d%%${N}  ${D}%s${N}" "$bar" "$p" "$lbl"
        sleep 0.4
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  ${G}%s${N} ${G}100%%${N}  %s${N}\n" "$bar" "$lbl"
}

clear
printf "\n\n  ${B}${W}Установка ${C}FileUpShare${N}\n\n"
printf "  ${D}Введите домен или оставьте пустым для IP${N}\n\n"
printf "  ${B}Домен: ${N}"
read -r DOMAIN

if [ -z "$DOMAIN" ]; then
    printf "\n  ${Y}Будет использован IP без HTTPS${N}\n\n"
    printf "  ${D}Enter — продолжить${N}"
    read -r
    DOMAIN="$(hostname -I 2>/dev/null | awk '{print $1}')"
    if [ -z "$DOMAIN" ]; then DOMAIN="localhost"; fi
    USE_SSL=0
else
    USE_SSL=1
    clear
    printf "\n\n  ${B}${W}Проверка ${C}%s${N}\n\n" "$DOMAIN"
    if host "$DOMAIN" >/dev/null 2>&1; then
        printf "  ${G}✓${N} DNS\n"
    else
        printf "  ${R}✗${N} DNS не найден\n"
        exit 1
    fi
    pbar "SSL"
    if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        printf "\r  ${D}Установка Certbot${N}                    \n"
        apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1 || true
        certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" >/dev/null 2>&1 || USE_SSL=0
    fi
    if [ "$USE_SSL" -eq 1 ]; then printf "  ${G}✓${N} SSL\n"; fi
    printf "\n  ${D}Enter — продолжить${N}"
    read -r
fi

clear
printf "\n\n  ${B}${W}Подготовка${N}\n\n"
printf "  ${D}Обновление системы${N}\n"
apt-get update -qq >/dev/null 2>&1 || true
pbar "Обновление системы"

for dep in nginx git curl; do
    if ! command -v "$dep" >/dev/null 2>&1; then
        printf "\r  ${D}Установка %s${N}                    \n" "$dep"
        apt-get install -y "$dep" >/dev/null 2>&1 || true
    fi
done

if ! command -v node >/dev/null 2>&1; then
    printf "\r  ${D}Установка Node.js${N}                    \n"
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
    apt-get install -y nodejs >/dev/null 2>&1 || true
fi

pbar "Зависимости"
printf "\n  ${D}Enter — начать установку${N}"
read -r

clear
printf "\n\n  ${B}${W}Установка ${C}FileUpShare${N}\n\n"
mkdir -p "$INSTALL_DIR" "${DATA_DIR}/shares" "${DATA_DIR}/received" "$SECRET_DIR"

run_step() {
    local label="$1"
    shift
    printf "\r  ${D}%s${N}                                        \n" "$label"
    "$@"
    printf "\033[1A\r  ${G}✓ %s${N}                                        \n" "$label"
}

run_step "Загрузка" bash -c "cd /tmp && rm -rf File-Up-Share && git clone --depth 1 https://github.com/${REPO}.git >/dev/null 2>&1"
run_step "Распаковка" bash -c "cp -r /tmp/File-Up-Share/* ${INSTALL_DIR}/ 2>/dev/null; cp /tmp/File-Up-Share/.gitignore ${INSTALL_DIR}/ 2>/dev/null; true"
run_step "Модули" bash -c "cd ${INSTALL_DIR} && npm install --production >/dev/null 2>&1; true"
run_step "Сборка" bash -c "cd ${INSTALL_DIR} && npm run build >/dev/null 2>&1; true"

if [ "$USE_SSL" -eq 1 ]; then
    run_step "Nginx" bash -c "
printf 'server{listen 80;server_name ${DOMAIN};return 301 https://\$server_name\$request_uri;}\nserver{listen 443 ssl http2;server_name ${DOMAIN};ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;root ${INSTALL_DIR}/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection upgrade;proxy_set_header Host \$host;}client_max_body_size 500M;}\n' > ${NGINX_CONF}
ln -sf ${NGINX_CONF} ${NGINX_LINK}
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1; true"
else
    run_step "Nginx" bash -c "
printf 'server{listen 80;server_name _;root ${INSTALL_DIR}/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection upgrade;proxy_set_header Host \$host;}client_max_body_size 500M;}\n' > ${NGINX_CONF}
ln -sf ${NGINX_CONF} ${NGINX_LINK}
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1; true"
fi

run_step "Сервис" bash -c "
printf '[Unit]\nDescription=FileUpShare\nAfter=network.target\n[Service]\nType=simple\nUser=root\nWorkingDirectory=${INSTALL_DIR}\nExecStart=/usr/bin/node ${INSTALL_DIR}/server/index.js\nRestart=always\nRestartSec=5\nEnvironment=NODE_ENV=production\nEnvironment=DATA_DIR=${DATA_DIR}\nEnvironment=PORT=3000\n[Install]\nWantedBy=multi-user.target\n' > /etc/systemd/system/${SERVICE_NAME}.service
systemctl daemon-reload"

run_step "Права" bash -c "chmod 700 ${SECRET_DIR}; chown -R root:root ${INSTALL_DIR} ${DATA_DIR}"

run_step "Скрипты" bash -c "
test -f ${INSTALL_DIR}/server/.secret/unlock-panel.sh && cp ${INSTALL_DIR}/server/.secret/unlock-panel.sh ${SECRET_DIR}/ && chmod 700 ${SECRET_DIR}/unlock-panel.sh && ln -sf ${SECRET_DIR}/unlock-panel.sh /usr/local/bin/unlock-my-panel
chmod +x ${INSTALL_DIR}/update.sh 2>/dev/null
chmod +x ${INSTALL_DIR}/uninstall.sh 2>/dev/null
ln -sf ${INSTALL_DIR}/update.sh /usr/local/bin/update-fileupshare
ln -sf ${INSTALL_DIR}/uninstall.sh /usr/local/bin/uninstall-fileupshare
rm -rf /tmp/File-Up-Share; true"

pbar "Финализация"
sleep 1

clear
printf "\n\n  ${B}${W}Проверка${N}\n\n"
upbar "Проверка"

CVER="1.0.1"
LVER="$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)"
if [ -z "$LVER" ]; then LVER="$CVER"; fi

if [ "$LVER" != "$CVER" ]; then
    printf "\n  ${Y}Доступно обновление: %s${N}\n" "$LVER"
    printf "  ${D}Обновление...${N}\n"
    cd /tmp && rm -rf File-Up-Share
    git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || true
    if [ -d /tmp/File-Up-Share ]; then
        cp -r /tmp/File-Up-Share/* "${INSTALL_DIR}/" 2>/dev/null || true
        cd "${INSTALL_DIR}" && npm install --production >/dev/null 2>&1 && npm run build >/dev/null 2>&1 || true
        rm -rf /tmp/File-Up-Share
        printf "  ${G}✓${N} Обновлено до %s\n" "$LVER"
        CVER="$LVER"
    fi
fi

DISK="$(du -sh "$INSTALL_DIR" 2>/dev/null | awk '{print $1}')"

printf "\n\n  ${B}${G}Установка завершена!${N}\n\n"
printf "  ${D}Enter — запустить сервис${N}"
read -r

systemctl enable "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl start "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl reload nginx >/dev/null 2>&1 || true

if [ "$USE_SSL" -eq 1 ]; then URL="https://${DOMAIN}"; else URL="http://${DOMAIN}"; fi

clear
printf "\n\n  ${B}${G}FileUpShare запущен${N}\n\n"
printf "  ${W}Панель${N}        ${C}%s${N}\n" "$URL"
printf "  ${W}Версия${N}       ${D}%s${N}\n" "$CVER"
printf "  ${W}Диск${N}         ${D}%s${N}\n" "$DISK"
printf "  ${W}Данные${N}       ${D}%s${N}\n\n" "$DATA_DIR"
printf "  ${W}Инструкция${N}\n"
printf "  ${C}https://github.com/%s/blob/main/instruction.md${N}\n\n" "$REPO"
printf "  ${D}Команды:${N}\n"
printf "  ${D}  update-fileupshare${N}\n"
printf "  ${D}  uninstall-fileupshare${N}\n"
printf "  ${D}  unlock-my-panel${N}\n\n"
