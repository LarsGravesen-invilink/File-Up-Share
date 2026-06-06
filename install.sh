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
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
DOMAIN=""
USE_SSL=0
pbar() {
    local dur=$1 lbl=$2 w=40
    for ((i=1;i<=w;i++)); do
        local p=$((i*100/w)) b=""
        for ((j=1;j<=w;j++)); do [ $j -le $i ] && b="${b}█" || b="${b}░"; done
        printf "\r  ${CYAN}${b}${NC} ${WHITE}${p}%%${NC}  ${DIM}${lbl}${NC}"
        sleep "$(echo "scale=4;$dur/$w" | bc 2>/dev/null || echo 0.05)"
    done
    printf "\r  ${GREEN}"; for ((j=1;j<=w;j++)); do printf "█"; done
    printf "${NC} ${GREEN}100%%${NC}  ${lbl}${NC}\n"
}
upbar() {
    local dur=$1 lbl=$2 w=40 pos=0
    while [ $pos -lt $w ]; do
        local jmp=$((RANDOM%4+1)); pos=$((pos+jmp)); [ $pos -gt $w ] && pos=$w
        local p=$((pos*100/w)) b=""
        for ((j=1;j<=w;j++)); do [ $j -le $pos ] && b="${b}█" || b="${b}░"; done
        printf "\r  ${CYAN}${b}${NC} ${WHITE}${p}%%${NC}  ${DIM}${lbl}${NC}"
        sleep "$(echo "scale=3;($RANDOM%500+200)/1000*$dur/8" | bc 2>/dev/null || echo 0.3)"
    done
    printf "\r  ${GREEN}"; for ((j=1;j<=w;j++)); do printf "█"; done
    printf "${NC} ${GREEN}100%%${NC}  ${lbl}${NC}\n"
}
spin() {
    local lbl=$1; shift
    printf "  ${DIM}${lbl}${NC}"
    "$@" > /dev/null 2>&1 &
    local pid=$! s=0 ch=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    while kill -0 $pid 2>/dev/null; do
        printf "\r  ${CYAN}${ch[$((s%10))]}${NC} ${DIM}${lbl}${NC}"
        s=$((s+1)); sleep 0.1
    done
    wait $pid 2>/dev/null || true
    printf "\r  ${GREEN}✓${NC} ${lbl}               \n"
}
clear
printf "\n\n  ${BOLD}${WHITE}Установка ${CYAN}FileUpShare${NC}\n\n"
printf "  ${DIM}Введите домен или оставьте пустым для IP${NC}\n\n"
printf "  ${BOLD}Домен: ${NC}"
read -r DOMAIN
if [ -z "$DOMAIN" ]; then
    printf "\n  ${YELLOW}Будет использован IP без HTTPS${NC}\n\n"
    printf "  ${DIM}Enter — продолжить${NC}"
    read -r
    DOMAIN=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    USE_SSL=0
else
    USE_SSL=1
    clear
    printf "\n\n  ${BOLD}${WHITE}Проверка ${CYAN}${DOMAIN}${NC}\n\n"
    if host "$DOMAIN" > /dev/null 2>&1; then
        printf "  ${GREEN}✓${NC} DNS\n"
    else
        printf "  ${RED}✗${NC} DNS не найден\n"; exit 1
    fi
    pbar 2 "SSL"
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        spin "Certbot" apt-get install -y certbot python3-certbot-nginx
        certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" > /dev/null 2>&1 || USE_SSL=0
    fi
    [ $USE_SSL -eq 1 ] && printf "  ${GREEN}✓${NC} SSL\n"
    printf "\n  ${DIM}Enter — продолжить${NC}"
    read -r
fi
clear
printf "\n\n  ${BOLD}${WHITE}Подготовка${NC}\n\n"
printf "\r  ${DIM}Обновление системы${NC}"
apt-get update -qq > /dev/null 2>&1
pbar 3 "Обновление системы"
for dep in nginx git curl bc; do
    if ! command -v "$dep" > /dev/null 2>&1; then
        printf "\r  ${DIM}Установка ${dep}${NC}               \n"
        apt-get install -y "$dep" > /dev/null 2>&1
    fi
done
if ! command -v node > /dev/null 2>&1; then
    printf "\r  ${DIM}Установка Node.js${NC}               \n"
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi
pbar 2 "Зависимости"
printf "\n  ${DIM}Enter — начать установку${NC}"
read -r
clear
printf "\n\n  ${BOLD}${WHITE}Установка ${CYAN}FileUpShare${NC}\n\n"
mkdir -p "$INSTALL_DIR" "$DATA_DIR/shares" "$DATA_DIR/received" "$SECRET_DIR"
STEPS=("Загрузка из репозитория" "Распаковка" "Модули" "Сборка" "Nginx" "Сервис" "Права доступа" "Скрипты")
total=${#STEPS[@]}
w=40
for ((idx=0;idx<total;idx++)); do
    p=$(((idx+1)*100/total))
    f=$((p*w/100))
    b=""; for ((j=1;j<=w;j++)); do [ $j -le $f ] && b="${b}█" || b="${b}░"; done
    printf "\r  ${DIM}${STEPS[$idx]}${NC}                                        "
    printf "\n\r  ${CYAN}${b}${NC} ${WHITE}${p}%%${NC}"
    case $idx in
        0) cd /tmp; rm -rf File-Up-Share; git clone --depth 1 "https://github.com/$REPO.git" > /dev/null 2>&1 || { printf "\n  ${RED}Ошибка${NC}\n"; exit 1; };;
        1) cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null||true; cp -r /tmp/File-Up-Share/.* "$INSTALL_DIR/" 2>/dev/null||true;;
        2) cd "$INSTALL_DIR"; npm install --production > /dev/null 2>&1||true;;
        3) cd "$INSTALL_DIR"; npm run build > /dev/null 2>&1||true;;
        4)
            if [ $USE_SSL -eq 1 ]; then
                cat > "$NGINX_CONF" <<EOFN
server{listen 80;server_name $DOMAIN;return 301 https://\$server_name\$request_uri;}
server{listen 443 ssl http2;server_name $DOMAIN;ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;root $INSTALL_DIR/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection 'upgrade';proxy_set_header Host \$host;}client_max_body_size 500M;}
EOFN
            else
                cat > "$NGINX_CONF" <<EOFN
server{listen 80;server_name _;root $INSTALL_DIR/dist;index index.html;location /{try_files \$uri \$uri/ /index.html;}location /api/{proxy_pass http://127.0.0.1:3000;proxy_http_version 1.1;proxy_set_header Upgrade \$http_upgrade;proxy_set_header Connection 'upgrade';proxy_set_header Host \$host;}client_max_body_size 500M;}
EOFN
            fi
            ln -sf "$NGINX_CONF" "$NGINX_LINK"; rm -f /etc/nginx/sites-enabled/default; nginx -t > /dev/null 2>&1;;
        5)
            cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOFS
[Unit]
Description=FileUpShare
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=DATA_DIR=$DATA_DIR
Environment=PORT=3000
[Install]
WantedBy=multi-user.target
EOFS
            systemctl daemon-reload;;
        6) chmod 700 "$SECRET_DIR"; chown -R root:root "$INSTALL_DIR" "$DATA_DIR";;
        7)
            [ -f "$INSTALL_DIR/server/.secret/unlock-panel.sh" ] && cp "$INSTALL_DIR/server/.secret/unlock-panel.sh" "$SECRET_DIR/" && chmod 700 "$SECRET_DIR/unlock-panel.sh" && ln -sf "$SECRET_DIR/unlock-panel.sh" /usr/local/bin/unlock-my-panel
            [ -f "$INSTALL_DIR/update.sh" ] && ln -sf "$INSTALL_DIR/update.sh" /usr/local/bin/update-fileupshare
            [ -f "$INSTALL_DIR/uninstall.sh" ] && ln -sf "$INSTALL_DIR/uninstall.sh" /usr/local/bin/uninstall-fileupshare
            rm -rf /tmp/File-Up-Share;;
    esac
    printf "\033[1A\r  ${GREEN}✓ ${STEPS[$idx]}${NC}                                        \n"
done
printf "\r  ${GREEN}"; for ((j=1;j<=w;j++)); do printf "█"; done; printf "${NC} ${GREEN}100%%${NC}\n"
sleep 0.5
clear
printf "\n\n  ${BOLD}${WHITE}Проверка${NC}\n\n"
upbar 6 "Проверка"
CVER="1.0.1"
LVER=$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "$CVER")
if [ "$LVER" != "$CVER" ] && [ -n "$LVER" ]; then
    printf "\n  ${YELLOW}Доступно обновление: ${LVER}${NC}\n"
    printf "  ${DIM}Обновление...${NC}\n"
    cd /tmp; rm -rf File-Up-Share
    git clone --depth 1 "https://github.com/$REPO.git" > /dev/null 2>&1 && {
        cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null||true
        cd "$INSTALL_DIR"; npm install --production > /dev/null 2>&1||true; npm run build > /dev/null 2>&1||true
        rm -rf /tmp/File-Up-Share
        printf "  ${GREEN}✓${NC} Обновлено до ${LVER}\n"
        CVER="$LVER"
    }
fi
DISK=$(du -sh "$INSTALL_DIR" 2>/dev/null | awk '{print $1}')
printf "\n\n  ${BOLD}${GREEN}Установка завершена!${NC}\n\n"
printf "  ${DIM}Enter — запустить сервис${NC}"
read -r
systemctl enable "$SERVICE_NAME" > /dev/null 2>&1; systemctl start "$SERVICE_NAME" > /dev/null 2>&1; systemctl reload nginx > /dev/null 2>&1
[ $USE_SSL -eq 1 ] && URL="https://$DOMAIN" || URL="http://$DOMAIN"
clear
printf "\n\n  ${BOLD}${GREEN}FileUpShare запущен${NC}\n\n"
printf "  ${WHITE}Панель${NC}        ${CYAN}${URL}${NC}\n"
printf "  ${WHITE}Версия${NC}       ${DIM}${CVER}${NC}\n"
printf "  ${WHITE}Диск${NC}         ${DIM}${DISK}${NC}\n"
printf "  ${WHITE}Данные${NC}       ${DIM}${DATA_DIR}${NC}\n\n"
printf "  ${WHITE}Инструкция${NC}\n"
printf "  ${CYAN}https://github.com/$REPO/blob/main/instruction.md${NC}\n\n"
printf "  ${DIM}Команды:${NC}\n"
printf "  ${DIM}  update-fileupshare       — обновить${NC}\n"
printf "  ${DIM}  uninstall-fileupshare    — удалить${NC}\n"
printf "  ${DIM}  unlock-my-panel          — разблокировать${NC}\n\n"
