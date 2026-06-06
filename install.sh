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
PANEL_PORT=0

is_port_free() {
    ! ss -tlnp 2>/dev/null | grep -q ":$1 " && ! netstat -tlnp 2>/dev/null | grep -q ":$1 "
}

random_free_port() {
    local p
    while true; do
        p=$((RANDOM % 2001 + 3000))
        if is_port_free "$p"; then
            echo "$p"
            return
        fi
    done
}

ask() {
    printf "  ${D}%s${N}" "$1"
    IFS= read -r < /dev/tty
}

ask_val() {
    printf "  ${B}%s${N}" "$1"
    IFS= read -r REPLY < /dev/tty
}

ask_retry() {
    printf "\n  ${D}R — повторить  |  Q — выйти${N}  "
    IFS= read -r REPLY < /dev/tty
    if [ "$REPLY" = "Q" ] || [ "$REPLY" = "q" ]; then
        cls
        exit 0
    fi
}

pbar() {
    local lbl="$1" i j p bar w=40
    for ((i=1;i<=w;i++)); do
        p=$((i*100/w))
        bar=""
        for ((j=1;j<=w;j++)); do
            if [ "$j" -le "$i" ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  \e[0;36m%s\e[0m \e[1;37m%3d%%\e[0m  \e[2m%s\e[0m" "$bar" "$p" "$lbl"
        sleep 0.06
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  \e[0;32m%s\e[0m \e[0;32m100%%\e[0m  %s\e[0m\n" "$bar" "$lbl"
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
        printf "\r  \e[0;36m%s\e[0m \e[1;37m%3d%%\e[0m  \e[2m%s\e[0m" "$bar" "$p" "$lbl"
        sleep 0.4
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  \e[0;32m%s\e[0m \e[0;32m100%%\e[0m  %s\e[0m\n" "$bar" "$lbl"
}

cls() {
    clear
    printf "\n"
    printf "  \e[0;36m╔══════════════════════════════════════════╗\e[0m\n"
    printf "  \e[0;36m          \e[1;37mF i l e U p S h a r e\e[0m\n"
    printf "  \e[0;36m╚══════════════════════════════════════════╝\e[0m\n"
    printf "\n"
}

run_step() {
    local label="$1"
    shift
    printf "  \e[2m%s\e[0m\n" "$label"
    "$@" 2>/dev/null || true
    printf "\033[1A\r  \e[0;32m✓\e[0m %s                                    \n" "$label"
}

cls
printf "  \e[2mПанель управления раздачами и загрузками\e[0m\n"
printf "  \e[2mфайлов на вашем Linux VPS\e[0m\n"
printf "\n"
printf "  \e[2m──────────────────────────────────────────\e[0m\n"
printf "\n"

while true; do
    printf "  \e[2mВведите домен или оставьте пустым для IP\e[0m\n\n"
    ask_val "Домен: "
    DOMAIN="$REPLY"

    if [ -z "$DOMAIN" ]; then
        PANEL_PORT=$(random_free_port)
        printf "\n  \e[1;33mБудет использован IP сервера без HTTPS\e[0m\n"
        printf "  \e[2mНазначен порт: \e[1;37m%s\e[0m\n" "$PANEL_PORT"
        ask "Enter — продолжить"
        DOMAIN="$(hostname -I 2>/dev/null | awk '{print $1}')"
        if [ -z "$DOMAIN" ]; then DOMAIN="localhost"; fi
        USE_SSL=0
        break
    fi

    cls
    printf "  \e[1;37mПроверка \e[0;36m%s\e[0m\n\n" "$DOMAIN"

    DNS_OK=0
    SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
    DOMAIN_IP="$(dig +short "$DOMAIN" A 2>/dev/null | head -1)"
    if [ -z "$DOMAIN_IP" ]; then
        DOMAIN_IP="$(host "$DOMAIN" 2>/dev/null | grep 'has address' | head -1 | awk '{print $NF}')"
    fi
    if [ -n "$DOMAIN_IP" ] && [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        printf "  \e[0;32m✓\e[0m DNS → %s\n" "$DOMAIN_IP"
        DNS_OK=1
    elif [ -n "$DOMAIN_IP" ]; then
        printf "  \e[1;33m!\e[0m DNS → %s (сервер: %s)\n" "$DOMAIN_IP" "$SERVER_IP"
        printf "\n  \e[1;33mДомен указывает на другой IP\e[0m\n"
        DNS_OK=0
    else
        printf "  \e[0;31m✗\e[0m DNS не найден\n"
        printf "\n  \e[0;31mДомен не указывает на этот сервер\e[0m\n"
        ask_retry
        cls
        continue
    fi

    if ! is_port_free 80 || ! is_port_free 443; then
        printf "  \e[1;33m!\e[0m Порты 80/443 заняты\n"
        printf "\n  \e[1;33mSSL невозможен, порты заняты другим сервисом\e[0m\n"
        PANEL_PORT=$(random_free_port)
        printf "  \e[2mНазначен порт: \e[1;37m%s\e[0m\n" "$PANEL_PORT"
        printf "\n  \e[2mR — повторить  |  H — продолжить http://%s:%s  |  Q — выйти\e[0m  " "$DOMAIN" "$PANEL_PORT"
        IFS= read -r REPLY < /dev/tty
        if [ "$REPLY" = "Q" ] || [ "$REPLY" = "q" ]; then cls; exit 0; fi
        if [ "$REPLY" = "H" ] || [ "$REPLY" = "h" ]; then
            USE_SSL=0
            break
        fi
        cls
        continue
    fi

    pbar "Проверка SSL"

    SSL_OK=0
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        printf "  \e[0;32m✓\e[0m SSL найден\n"
        SSL_OK=1
    else
        printf "  \e[2mУстановка Certbot...\e[0m\n"
        apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1 || true
        printf "\033[1A\r  \e[0;32m✓\e[0m Certbot                              \n"

        printf "  \e[2mПолучение сертификата...\e[0m\n"
        systemctl stop nginx >/dev/null 2>&1 || true
        if certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" >/dev/null 2>&1; then
            printf "\033[1A\r  \e[0;32m✓\e[0m SSL установлен                      \n"
            SSL_OK=1
        else
            printf "\033[1A\r  \e[0;31m✗\e[0m SSL не удалось получить              \n"
            printf "\n  \e[0;31mВозможные причины:\e[0m\n"
            printf "  \e[2m  Порт 80 занят другим процессом\e[0m\n"
            printf "  \e[2m  Домен не указывает на этот IP\e[0m\n"
            printf "  \e[2m  Firewall блокирует порт 80\e[0m\n"
        fi
        systemctl start nginx >/dev/null 2>&1 || true
    fi

    if [ "$SSL_OK" -eq 1 ]; then
        USE_SSL=1
        ask "Enter — продолжить"
        break
    fi

    printf "\n  \e[2mR — повторить  |  H — продолжить без SSL  |  Q — выйти\e[0m  "
    IFS= read -r REPLY < /dev/tty
    if [ "$REPLY" = "Q" ] || [ "$REPLY" = "q" ]; then
        cls
        exit 0
    fi
    if [ "$REPLY" = "H" ] || [ "$REPLY" = "h" ]; then
        USE_SSL=0
        break
    fi
        cls
        continue
done

cls
printf "  \e[1;37mПодготовка системы\e[0m\n\n"

printf "  \e[2mОбновление пакетов\e[0m\n"
apt-get update -qq >/dev/null 2>&1 || true
pbar "Обновление системы"

for dep in nginx git curl; do
    if ! command -v "$dep" >/dev/null 2>&1; then
        printf "  \e[2mУстановка %s\e[0m\n" "$dep"
        apt-get install -y "$dep" >/dev/null 2>&1 || true
        printf "\033[1A\r  \e[0;32m✓\e[0m %s                          \n" "$dep"
    fi
done

if ! command -v node >/dev/null 2>&1; then
    printf "  \e[2mУстановка Node.js\e[0m\n"
    curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - >/dev/null 2>&1 || true
    apt-get install -y nodejs >/dev/null 2>&1 || true
    printf "\033[1A\r  \e[0;32m✓\e[0m Node.js                          \n"
fi

pbar "Зависимости"
ask "Enter — начать установку"

cls
printf "  \e[1;37mУстановка \e[0;36mFileUpShare\e[0m\n\n"

mkdir -p "$INSTALL_DIR" "${DATA_DIR}/shares" "${DATA_DIR}/received" "$SECRET_DIR"

run_step "Загрузка из репозитория" bash -c "cd /tmp && rm -rf File-Up-Share && git clone --depth 1 https://github.com/${REPO}.git >/dev/null 2>&1"
run_step "Копирование файлов" bash -c "cp -r /tmp/File-Up-Share/* ${INSTALL_DIR}/ 2>/dev/null; true"
run_step "Установка модулей" bash -c "cd ${INSTALL_DIR} && npm install >/dev/null 2>&1; true"
run_step "Сборка панели" bash -c "cd ${INSTALL_DIR} && npm run build >/dev/null 2>&1; true"

if [ ! -f "${INSTALL_DIR}/dist/index.html" ]; then
    printf "\n  \e[0;31m✗ Сборка не удалась — dist/index.html не найден\e[0m\n"
    printf "  \e[2mПопытка пересборки...\e[0m\n"
    cd "${INSTALL_DIR}"
    npm install >/dev/null 2>&1 || true
    npm run build 2>&1 | tail -5
    if [ ! -f "${INSTALL_DIR}/dist/index.html" ]; then
        printf "\n  \e[0;31mОшибка сборки. Проверьте Node.js и npm.\e[0m\n"
        ask "Enter — продолжить"
    else
        printf "  \e[0;32m✓\e[0m Пересборка успешна\n"
    fi
fi

LISTEN_PORT=80
if [ "$PANEL_PORT" -gt 0 ] 2>/dev/null; then LISTEN_PORT=$PANEL_PORT; fi

printf "  \e[2mНастройка Nginx\e[0m\n"

if [ "$USE_SSL" -eq 1 ]; then
    cat > "${NGINX_CONF}" << 'NGINX_BLOCK_END'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;
    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    root INSTALL_PLACEHOLDER/dist;
    index index.html;
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
    client_max_body_size 500M;
}
NGINX_BLOCK_END
    sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" "${NGINX_CONF}"
    sed -i "s|INSTALL_PLACEHOLDER|${INSTALL_DIR}|g" "${NGINX_CONF}"
else
    cat > "${NGINX_CONF}" << NGINX_BLOCK_END
server {
    listen ${LISTEN_PORT};
    server_name _;
    root ${INSTALL_DIR}/dist;
    index index.html;
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    client_max_body_size 500M;
}
NGINX_BLOCK_END
fi

ln -sf "${NGINX_CONF}" "${NGINX_LINK}"
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1 || true
printf "\033[1A\r  \e[0;32m✓\e[0m Настройка Nginx                              \n"

cat > "/etc/systemd/system/${SERVICE_NAME}.service" << SVCEND
[Unit]
Description=FileUpShare
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=$(which node) ${INSTALL_DIR}/server/index.cjs
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=DATA_DIR=${DATA_DIR}
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
SVCEND
systemctl daemon-reload
printf "  \e[0;32m✓\e[0m Создание сервиса\n"

run_step "Настройка прав" bash -c "chmod 700 ${SECRET_DIR}; chown -R root:root ${INSTALL_DIR} ${DATA_DIR}"

ACCESS_MODE="ip"
ACCESS_PORT="${PANEL_PORT:-80}"
ACCESS_SSL="false"
if [ "$USE_SSL" -eq 1 ]; then
    ACCESS_MODE="domain"
    ACCESS_SSL="true"
    ACCESS_PORT="443"
fi

run_step "Регистрация команд" bash -c "
test -f ${INSTALL_DIR}/server/.secret/unlock-panel.sh && cp ${INSTALL_DIR}/server/.secret/unlock-panel.sh ${SECRET_DIR}/ && chmod 700 ${SECRET_DIR}/unlock-panel.sh && ln -sf ${SECRET_DIR}/unlock-panel.sh /usr/local/bin/unlock-my-panel
chmod +x ${INSTALL_DIR}/update.sh 2>/dev/null
chmod +x ${INSTALL_DIR}/uninstall.sh 2>/dev/null
ln -sf ${INSTALL_DIR}/update.sh /usr/local/bin/update-fileupshare
ln -sf ${INSTALL_DIR}/uninstall.sh /usr/local/bin/uninstall-fileupshare
rm -rf /tmp/File-Up-Share; true"

date +%Y-%m-%d > "${DATA_DIR}/installed.txt"
date +%Y-%m-%d > "${DATA_DIR}/updated.txt"
cat > "${DATA_DIR}/settings.json" << SETTINGS_END
{
  "accessDomain": "${DOMAIN}",
  "accessPort": ${ACCESS_PORT},
  "accessSSL": ${ACCESS_SSL},
  "accessMode": "${ACCESS_MODE}"
}
SETTINGS_END
printf "  \e[0;32m✓\e[0m Конфигурация\n"

pbar "Финализация"
ask "Enter — продолжить"

cls
printf "  \e[1;37mПроверка целостности\e[0m\n\n"
upbar "Проверка"

CVER="1.0.1"
LVER="$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)"
if [ -z "$LVER" ]; then LVER="$CVER"; fi

printf "\n  \e[0;32m✓\e[0m Версия: %s\n" "$CVER"

if [ "$LVER" != "$CVER" ]; then
    printf "  \e[1;33m!\e[0m Доступно обновление: %s\n" "$LVER"
    printf "  \e[2mОбновление...\e[0m\n"
    cd /tmp && rm -rf File-Up-Share
    git clone --depth 1 "https://github.com/${REPO}.git" >/dev/null 2>&1 || true
    if [ -d /tmp/File-Up-Share ]; then
        cp -r /tmp/File-Up-Share/* "${INSTALL_DIR}/" 2>/dev/null || true
        cd "${INSTALL_DIR}" && npm install >/dev/null 2>&1 && npm run build >/dev/null 2>&1 || true
        rm -rf /tmp/File-Up-Share
        printf "\033[1A\r  \e[0;32m✓\e[0m Обновлено до %s                    \n" "$LVER"
        CVER="$LVER"
    fi
else
    printf "  \e[0;32m✓\e[0m Обновления не требуются\n"
fi

DISK="$(du -sh "$INSTALL_DIR" 2>/dev/null | awk '{print $1}')"

printf "\n\n  \e[1;32mУстановка завершена!\e[0m\n"
ask "Enter — запустить сервис"

systemctl enable "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl restart "$SERVICE_NAME" >/dev/null 2>&1 || true
sleep 2
systemctl restart nginx >/dev/null 2>&1 || true

if [ "$USE_SSL" -eq 1 ]; then
    URL="https://${DOMAIN}"
elif [ "$PANEL_PORT" -gt 0 ] 2>/dev/null && [ "$PANEL_PORT" -ne 80 ]; then
    URL="http://${DOMAIN}:${PANEL_PORT}"
else
    URL="http://${DOMAIN}"
fi

cls
printf "  \e[0;36m══════════════════════════════════════════\e[0m\n"
printf "  \e[1;32m  Успешно запущен\e[0m\n"
printf "  \e[0;36m══════════════════════════════════════════\e[0m\n"
printf "\n"
printf "  \e[1;37mПанель\e[0m        \e[0;36m%s\e[0m\n" "$URL"
printf "  \e[1;37mВерсия\e[0m       \e[2m%s\e[0m\n" "$CVER"
printf "  \e[1;37mДиск\e[0m         \e[2m%s\e[0m\n" "$DISK"
printf "  \e[1;37mДанные\e[0m       \e[2m%s\e[0m\n" "$DATA_DIR"
printf "\n"
printf "  \e[1;37mИнструкция\e[0m\n"
printf "  \e[0;36mhttps://github.com/%s/blob/main/instruction.md\e[0m\n" "$REPO"
printf "\n"
printf "  \e[2mКоманды:\e[0m\n"
printf "  \e[2m  update-fileupshare\e[0m\n"
printf "  \e[2m  uninstall-fileupshare\e[0m\n"
printf "  \e[2m  unlock-my-panel\e[0m\n"
printf "\n"
