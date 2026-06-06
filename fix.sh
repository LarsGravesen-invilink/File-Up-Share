#!/usr/bin/env bash
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}"

printf "\n  Диагностика FileUpShare\n\n"

printf "  [1] Node.js: "
if command -v node >/dev/null 2>&1; then printf "$(node -v)\n"; else printf "НЕ НАЙДЕН\n"; fi

printf "  [2] dist/index.html: "
if [ -f "${INSTALL_DIR}/dist/index.html" ]; then printf "OK ($(wc -c < ${INSTALL_DIR}/dist/index.html) bytes)\n"; else printf "НЕ НАЙДЕН\n"; fi

printf "  [3] server/index.js: "
if [ -f "${INSTALL_DIR}/server/index.js" ]; then printf "OK\n"; else printf "НЕ НАЙДЕН\n"; fi

printf "  [4] Сервис fileupshare: "
if systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then printf "АКТИВЕН\n"; else printf "НЕ АКТИВЕН\n"; fi

printf "  [5] Порт 3000: "
if ss -tlnp 2>/dev/null | grep -q ":3000 "; then printf "ЗАНЯТ (OK)\n"; else printf "СВОБОДЕН (Node не слушает!)\n"; fi

printf "  [6] Nginx конфиг: "
if [ -f "$NGINX_CONF" ]; then
    if grep -q 'proxy_pass' "$NGINX_CONF"; then printf "OK (proxy есть)\n"; else printf "НЕТ PROXY!\n"; fi
    if grep -q '\$uri' "$NGINX_CONF"; then printf "  [6a] \$uri: OK\n"; else printf "  [6a] \$uri: ОТСУТСТВУЕТ!\n"; fi
else
    printf "НЕ НАЙДЕН\n"
fi

printf "  [7] Nginx test: "
nginx -t 2>&1 | tail -1

printf "  [8] settings.json: "
if [ -f "${DATA_DIR}/settings.json" ]; then cat "${DATA_DIR}/settings.json" | head -c 200; printf "\n"; else printf "НЕ НАЙДЕН\n"; fi

printf "  [9] auth.json: "
if [ -f "${DATA_DIR}/auth.json" ]; then printf "OK\n"; else printf "НЕ НАЙДЕН (первый запуск)\n"; fi

printf "  [10] Журнал сервиса:\n"
journalctl -u "$SERVICE_NAME" --no-pager -n 10 2>/dev/null || printf "  Недоступен\n"

printf "\n  [11] Тест API: "
RESP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/state 2>/dev/null)
if [ "$RESP" = "200" ]; then
    printf "OK (200)\n"
    printf "  Ответ: "
    curl -s http://127.0.0.1:3000/api/state 2>/dev/null | head -c 300
    printf "\n"
else
    printf "ОШИБКА ($RESP)\n"
    printf "\n  Попытка запуска вручную...\n"
    cd "$INSTALL_DIR"
    DATA_DIR="$DATA_DIR" PORT=3000 node server/index.js &
    NODEPID=$!
    sleep 2
    RESP2=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/state 2>/dev/null)
    if [ "$RESP2" = "200" ]; then
        printf "  Ручной запуск: OK!\n"
        printf "  Ответ: "
        curl -s http://127.0.0.1:3000/api/state 2>/dev/null | head -c 300
        printf "\n"
    else
        printf "  Ручной запуск: ОШИБКА ($RESP2)\n"
    fi
    kill $NODEPID 2>/dev/null
fi

printf "\n  [12] Nginx конфиг содержимое:\n"
cat "$NGINX_CONF" 2>/dev/null || printf "  Файл не найден\n"

printf "\n"
