#!/usr/bin/env bash

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
SERVICE_NAME="fileupshare"
VERSION_URL="https://raw.githubusercontent.com/${REPO}/main/version.json"

ask() {
    printf "  \e[2m%s\e[0m" "$1"
    IFS= read -r < /dev/tty
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
        sleep 0.05
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
        sleep 0.3
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  \e[0;32m%s\e[0m \e[0;32m100%%\e[0m  %s\e[0m\n" "$bar" "$lbl"
}

run_step() {
    local label="$1"
    shift
    printf "  \e[2m%s\e[0m\n" "$label"
    "$@" 2>/dev/null || true
    printf "\033[1A\r  \e[0;32m✓\e[0m %s                                    \n" "$label"
}

CVER="1.0.1"
LVER="$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)"

clear
printf "\n\n  \e[1;37mОбновление \e[0;36mFileUpShare\e[0m\n\n"
printf "  \e[1;37mТекущая:\e[0m  \e[2m%s\e[0m\n" "$CVER"

if [ -z "$LVER" ]; then
    printf "\n  \e[1;33mНе удалось проверить обновления\e[0m\n"
    ask "Enter — выйти"
    clear
    exit 1
fi

if [ "$LVER" = "$CVER" ]; then
    printf "\n  \e[0;32mВы используете последнюю версию %s\e[0m\n" "$CVER"
    ask "Enter — выйти"
    clear
    exit 0
fi

printf "  \e[1;37mДоступна:\e[0m \e[0;32m%s\e[0m\n\n" "$LVER"
printf "  \e[2mEnter — обновить  |  X — выйти\e[0m  "
IFS= read -r inp < /dev/tty
if [ "$inp" = "X" ] || [ "$inp" = "x" ]; then clear; exit 0; fi

clear
printf "\n\n  \e[1;37mПодготовка\e[0m\n\n"
printf "  \e[2mОбновление системы\e[0m\n"
apt-get update -qq >/dev/null 2>&1 || true
pbar "Обновление"
pbar "Зависимости"
ask "Enter — продолжить"

clear
printf "\n\n  \e[1;37mОбновление до \e[0;36m%s\e[0m\n\n" "$LVER"

run_step "Загрузка" bash -c "cd /tmp && rm -rf File-Up-Share && git clone --depth 1 https://github.com/${REPO}.git >/dev/null 2>&1"
run_step "Копирование" bash -c "rsync -a --exclude=data --exclude=.secret /tmp/File-Up-Share/ ${INSTALL_DIR}/ 2>/dev/null || cp -r /tmp/File-Up-Share/* ${INSTALL_DIR}/ 2>/dev/null; true"
run_step "Модули" bash -c "cd ${INSTALL_DIR} && npm install >/dev/null 2>&1; true"
run_step "Сборка" bash -c "cd ${INSTALL_DIR} && npm run build >/dev/null 2>&1; true"
run_step "Перезапуск" bash -c "systemctl restart ${SERVICE_NAME} >/dev/null 2>&1; systemctl reload nginx >/dev/null 2>&1; rm -rf /tmp/File-Up-Share; true"

pbar "Финализация"
ask "Enter — продолжить"

clear
printf "\n\n  \e[1;37mПроверка\e[0m\n\n"
upbar "Проверка"

printf "\n\n  \e[1;32mОбновление успешно установлено\e[0m\n\n"
printf "  \e[1;37mВерсия:\e[0m \e[0;32m%s\e[0m\n" "$LVER"
ask "Enter — запустить и выйти"

systemctl restart "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl reload nginx >/dev/null 2>&1 || true
clear
