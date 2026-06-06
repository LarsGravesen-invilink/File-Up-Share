#!/bin/bash
set -e
REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/$SERVICE_NAME"
NGINX_LINK="/etc/nginx/sites-enabled/$SERVICE_NAME"
SECRET_DIR="$INSTALL_DIR/.secret"
VERSION_URL="https://raw.githubusercontent.com/$REPO/main/version.json"
R='\033[0;31m'
G='\033[0;32m'
Y='\033[1;33m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[2m'
B='\033[1m'
N='\033[0m'
DOMAIN=""
USE_SSL=0
pbar() {
    local i w=40 dur="$1" lbl="$2"
    for ((i=1;i<=w;i++)); do
        local p=$((i*100/w)) bar=""
        for ((j=1;j<=w;j++)); do
            if [ $j -le $i ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}${bar}${N} ${W}${p}%%${N}  ${D}${lbl}${N}"
        sleep 0.05
    done
    printf "\r  ${G}"
    for ((j=1;j<=w;j++)); do printf "█"; done
    printf "${N} ${G}100%%${N}  ${lbl}${N}\n"
}
upbar() {
    local w=40 pos=0 dur="$1" lbl="$2"
    while [ $pos -lt $w ]; do
        local jmp=$((RANDOM % 3 + 1))
        pos=$((pos + jmp))
        if [ $pos -gt $w ]; then pos=$w; fi
        local p=$((pos*100/w)) bar=""
        for ((j=1;j<=w;j++)); do
            if [ $j -le $pos ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}${bar}${N} ${W}${p}%%${N}  ${D}${lbl}${N}"
        sleep 0.4
    done
    printf "\r  ${G}"
    for ((j=1;j<=w;j++)); do printf "█"; done
    printf "${N} ${G}100%%${N}  ${lbl}${N}\n"
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
    DOMAIN=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$DOMAIN" ]; then DOMAIN="localhost"; fi
    USE_SSL=0
else
    USE_SSL=1
    clear
    printf "\n\n  ${B}${W}Проверка ${C}${DOMAIN}${N}\n\n"
    if host "$DOMAIN" > /dev/null 2>&1; then
        printf "  ${G}✓${N} DNS\n"
    else
        printf "  ${R}✗${N} DNS не найден\n"
        exit 1
    fi
    pbar 2 "SSL"
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        printf "\r  ${D}Установка Certbot${N}                    \n"
        apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1 || true
        certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" > /dev/null 2>&1 || USE_SSL=0
    fi
    if [ $USE_SSL -eq 1 ]; then printf "  ${G}✓${N} SSL\n"; fi
    printf "\n  ${D}Enter — продолжить${N}"
    read -r
fi
clear
printf "\n\n  ${B}${W}Подготовка${N}\n\n"
printf "\r  ${D}Обновление системы${N}\n"
apt-get update -qq > /dev/null 2>&1 || true
pbar 3 "Обновление системы"
for dep in nginx git curl; do
    if ! command -v "$dep" > /dev/null 2>&1; then
        printf "\r  ${D}Установка ${dep}${N}                    \n"
        apt-get install -y "$dep" > /dev/null 2>&1 || true
    fi
done
if ! command -v node > /dev/null 2>&1; then
    printf "\r  ${D}Установка Node.js${N}                    \n"
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - > /dev/null 2>&1 || true
    apt-get install -y nodejs > /dev/null 2>&1 || true
fi
pbar 2 "Зависимости"
printf "\n  ${D}Enter — начать установку${N}"
read -r
clear
printf "\n\n  ${B}${W}Установка ${C}FileUpShare${N}\n\n"
mkdir -p "$INSTALL_DIR" "$DATA_DIR/shares" "$DATA_DIR/received" "$SECRET_DIR"
STEPS=("Загрузка" "Распаковка" "Модули" "Сборка" "Nginx" "Сервис" "Права" "Скрипты")
total=${#STEPS[@]}
w=40
for ((idx=0;idx<total;idx++)); do
    p=$(((idx+1)*100/total))
    f=$((p*w/100))
    bar=""
    for ((j=1;j<=w;j++)); do
        if [ $j -le $f ]; then bar="${bar}█"; else bar="${bar}░"; fi
    done
    printf "\r  ${D}${STEPS[$idx]}${N}                                        "
    printf "\n\r  ${C}${bar}${N} ${W}${p}%%${N}"
    case $idx in
        0)
            cd /tmp
            rm -rf File-Up-Share
            git clone --depth 1 "https://github.com/$REPO.git" > /dev/null 2>&1
            ;;
        1)
            cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null || true
            cp -r /tmp/File-Up-Share/.gitignore "$INSTALL_DIR/" 2>/dev/null || true
            ;;
        2)
            cd "$INSTALL_DIR"
            npm install --production > /dev/null 2>&1 || true
            ;;
        3)
            cd "$INSTALL_DIR"
            npm run build > /dev/null 2>&1 || true
            ;;
        4)
            if [ $USE_SSL -eq 1 ]; then
                printf '%s\n' "server{listen 80;server_name $DOMAIN;return 301 https://\$server_name\$request_uri;}" "server{listen 443 ssl http2;server_name $DOMAIN;ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;root $INSTALL_DIR/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection 'upgrade';proxy_set_header Host \$host;}client_max_body_size 500M;}" > "$NGINX_CONF"
            else
                printf '%s\n' "server{listen 80;server_name _;root $INSTALL_DIR/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection 'upgrade';proxy_set_header Host \$host;}client_max_body_size 500M;}" > "$NGINX_CONF"
            fi
            ln -sf "$NGINX_CONF" "$NGINX_LINK"
            rm -f /etc/nginx/sites-enabled/default
            nginx -t > /dev/null 2>&1 || true
            ;;
        5)
            printf '%s\n' "[Unit]" "Description=FileUpShare" "After=network.target" "[Service]" "Type=simple" "User=root" "WorkingDirectory=$INSTALL_DIR" "ExecStart=/usr/bin/node $INSTALL_DIR/server/index.js" "Restart=always" "RestartSec=5" "Environment=NODE_ENV=production" "Environment=DATA_DIR=$DATA_DIR" "Environment=PORT=3000" "[Install]" "WantedBy=multi-user.target" > "/etc/systemd/system/${SERVICE_NAME}.service"
            systemctl daemon-reload
            ;;
        6)
            chmod 700 "$SECRET_DIR"
            chown -R root:root "$INSTALL_DIR" "$DATA_DIR"
            ;;
        7)
            if [ -f "$INSTALL_DIR/server/.secret/unlock-panel.sh" ]; then
                cp "$INSTALL_DIR/server/.secret/unlock-panel.sh" "$SECRET_DIR/"
                chmod 700 "$SECRET_DIR/unlock-panel.sh"
                ln -sf "$SECRET_DIR/unlock-panel.sh" /usr/local/bin/unlock-my-panel
            fi
            chmod +x "$INSTALL_DIR/update.sh" 2>/dev/null || true
            chmod +x "$INSTALL_DIR/uninstall.sh" 2>/dev/null || true
            ln -sf "$INSTALL_DIR/update.sh" /usr/local/bin/update-fileupshare
            ln -sf "$INSTALL_DIR/uninstall.sh" /usr/local/bin/uninstall-fileupshare
            rm -rf /tmp/File-Up-Share
            ;;
    esac
    printf "\033[1A\r  ${G}✓ ${STEPS[$idx]}${N}                                        \n"
done
printf "\r  ${G}"
for ((j=1;j<=w;j++)); do printf "█"; done
printf "${N} ${G}100%%${N}\n"
sleep 1
clear
printf "\n\n  ${B}${W}Проверка${N}\n\n"
upbar 6 "Проверка"
CVER="1.0.1"
LVER=$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$LVER" ]; then LVER="$CVER"; fi
if [ "$LVER" != "$CVER" ]; then
    printf "\n  ${Y}Доступно обновление: ${LVER}${N}\n"
    printf "\r  ${D}Обновление${N}\n"
    cd /tmp
    rm -rf File-Up-Share
    git clone --depth 1 "https://github.com/$REPO.git" > /dev/null 2>&1 || true
    if [ -d /tmp/File-Up-Share ]; then
        cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null || true
        cd "$INSTALL_DIR"
        npm install --production > /dev/null 2>&1 || true
        npm run build > /dev/null 2>&1 || true
        rm -rf /tmp/File-Up-Share
        printf "  ${G}✓${N} Обновлено до ${LVER}\n"
        CVER="$LVER"
    fi
fi
DISK=$(du -sh "$INSTALL_DIR" 2>/dev/null | awk '{print $1}')
printf "\n\n  ${B}${G}Установка завершена!${N}\n\n"
printf "  ${D}Enter — запустить сервис${N}"
read -r
systemctl enable "$SERVICE_NAME" > /dev/null 2>&1 || true
systemctl start "$SERVICE_NAME" > /dev/null 2>&1 || true
systemctl reload nginx > /dev/null 2>&1 || true
if [ $USE_SSL -eq 1 ]; then URL="https://$DOMAIN"; else URL="http://$DOMAIN"; fi
clear
printf "\n\n  ${B}${G}FileUpShare запущен${N}\n\n"
printf "  ${W}Панель${N}        ${C}${URL}${N}\n"
printf "  ${W}Версия${N}       ${D}${CVER}${N}\n"
printf "  ${W}Диск${N}         ${D}${DISK}${N}\n"
printf "  ${W}Данные${N}       ${D}${DATA_DIR}${N}\n\n"
printf "  ${W}Инструкция${N}\n"
printf "  ${C}https://github.com/$REPO/blob/main/instruction.md${N}\n\n"
printf "  ${D}Команды:${N}\n"
printf "  ${D}  update-fileupshare${N}\n"
printf "  ${D}  uninstall-fileupshare${N}\n"
printf "  ${D}  unlock-my-panel${N}\n\n"
