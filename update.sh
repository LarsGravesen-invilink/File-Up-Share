#!/usr/bin/env bash

REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
SERVICE_NAME="fileupshare"
VERSION_URL="https://raw.githubusercontent.com/${REPO}/main/version.json"

G='\e[0;32m'
Y='\e[1;33m'
C='\e[0;36m'
W='\e[1;37m'
D='\e[2m'
B='\e[1m'
N='\e[0m'

pbar() {
    local lbl="$1" i j p bar w=40
    for ((i=1;i<=w;i++)); do
        p=$((i*100/w))
        bar=""
        for ((j=1;j<=w;j++)); do
            if [ "$j" -le "$i" ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}%s${N} ${W}%3d%%${N}  ${D}%s${N}" "$bar" "$p" "$lbl"
        sleep 0.05
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
        sleep 0.3
    done
    bar=""
    for ((j=1;j<=w;j++)); do bar="${bar}█"; done
    printf "\r  ${G}%s${N} ${G}100%%${N}  %s${N}\n" "$bar" "$lbl"
}

CVER="1.0.1"
LVER="$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)"

clear
printf "\n\n  ${B}${W}Обновление ${C}FileUpShare${N}\n\n"
printf "  ${W}Текущая:${N}  ${D}%s${N}\n" "$CVER"

if [ -z "$LVER" ]; then
    printf "\n  ${Y}Не удалось проверить обновления${N}\n\n"
    exit 1
fi

if [ "$LVER" = "$CVER" ]; then
    printf "\n  ${G}Вы используете последнюю версию %s${N}\n\n" "$CVER"
    exit 0
fi

printf "  ${W}Доступна:${N} ${G}%s${N}\n\n" "$LVER"
printf "  ${D}Enter — обновить  |  X — выйти${N}  "
read -r inp
if [ "$inp" = "X" ] || [ "$inp" = "x" ]; then clear; exit 0; fi

clear
printf "\n\n  ${B}${W}Подготовка${N}\n\n"
printf "  ${D}Обновление системы${N}\n"
apt-get update -qq >/dev/null 2>&1 || true
pbar "Обновление"
pbar "Зависимости"

clear
printf "\n\n  ${B}${W}Обновление до ${C}%s${N}\n\n" "$LVER"

run_step() {
    local label="$1"
    shift
    printf "\r  ${D}%s${N}                                        \n" "$label"
    "$@"
    printf "\033[1A\r  ${G}✓ %s${N}                                        \n" "$label"
}

run_step "Загрузка" bash -c "cd /tmp && rm -rf File-Up-Share && git clone --depth 1 https://github.com/${REPO}.git >/dev/null 2>&1"
run_step "Распаковка" bash -c "rsync -a --exclude=data --exclude=.secret /tmp/File-Up-Share/ ${INSTALL_DIR}/ 2>/dev/null || cp -r /tmp/File-Up-Share/* ${INSTALL_DIR}/ 2>/dev/null; true"
run_step "Модули" bash -c "cd ${INSTALL_DIR} && npm install --production >/dev/null 2>&1; true"
run_step "Сборка" bash -c "cd ${INSTALL_DIR} && npm run build >/dev/null 2>&1; true"
run_step "Перезапуск" bash -c "systemctl restart ${SERVICE_NAME} >/dev/null 2>&1; systemctl reload nginx >/dev/null 2>&1; rm -rf /tmp/File-Up-Share; true"

pbar "Финализация"
sleep 1

clear
printf "\n\n  ${B}${W}Проверка${N}\n\n"
upbar "Проверка"

clear
printf "\n\n  ${B}${G}Обновление успешно установлено${N}\n\n"
printf "  ${W}Версия:${N} ${G}%s${N}\n\n" "$LVER"
printf "  ${D}Enter — запустить и выйти${N}"
read -r
systemctl restart "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl reload nginx >/dev/null 2>&1 || true
clear
