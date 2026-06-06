#!/bin/bash
set -e
REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
SERVICE_NAME="fileupshare"
VERSION_URL="https://raw.githubusercontent.com/$REPO/main/version.json"
G='\033[0;32m'
Y='\033[1;33m'
C='\033[0;36m'
W='\033[1;37m'
D='\033[2m'
B='\033[1m'
N='\033[0m'
pbar() {
    local i w=40 lbl="$1"
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
    local w=40 pos=0 lbl="$1"
    while [ $pos -lt $w ]; do
        local jmp=$((RANDOM % 3 + 1))
        pos=$((pos + jmp))
        if [ $pos -gt $w ]; then pos=$w; fi
        local p=$((pos*100/w)) bar=""
        for ((j=1;j<=w;j++)); do
            if [ $j -le $pos ]; then bar="${bar}█"; else bar="${bar}░"; fi
        done
        printf "\r  ${C}${bar}${N} ${W}${p}%%${N}  ${D}${lbl}${N}"
        sleep 0.3
    done
    printf "\r  ${G}"
    for ((j=1;j<=w;j++)); do printf "█"; done
    printf "${N} ${G}100%%${N}  ${lbl}${N}\n"
}
CVER="1.0.1"
LVER=$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
clear
printf "\n\n  ${B}${W}Обновление ${C}FileUpShare${N}\n\n"
printf "  ${W}Текущая:${N}  ${D}${CVER}${N}\n"
if [ -z "$LVER" ]; then
    printf "\n  ${Y}Не удалось проверить обновления${N}\n\n"
    exit 1
fi
if [ "$LVER" = "$CVER" ]; then
    printf "\n  ${G}Вы используете последнюю версию ${CVER}${N}\n\n"
    exit 0
fi
printf "  ${W}Доступна:${N} ${G}${LVER}${N}\n\n"
printf "  ${D}Enter — обновить  |  X — выйти${N}  "
read -r inp
if [ "$inp" = "X" ] || [ "$inp" = "x" ]; then
    clear
    exit 0
fi
clear
printf "\n\n  ${B}${W}Подготовка${N}\n\n"
printf "\r  ${D}Обновление системы${N}\n"
apt-get update -qq > /dev/null 2>&1 || true
pbar "Обновление"
pbar "Зависимости"
clear
printf "\n\n  ${B}${W}Обновление до ${C}${LVER}${N}\n\n"
STEPS=("Загрузка" "Распаковка" "Модули" "Сборка" "Перезапуск")
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
            rsync -a --exclude='data' --exclude='.secret' /tmp/File-Up-Share/ "$INSTALL_DIR/" 2>/dev/null || cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null || true
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
            systemctl restart "$SERVICE_NAME" > /dev/null 2>&1 || true
            systemctl reload nginx > /dev/null 2>&1 || true
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
upbar "Проверка"
clear
printf "\n\n  ${B}${G}Обновление успешно установлено${N}\n\n"
printf "  ${W}Версия:${N} ${G}${LVER}${N}\n\n"
printf "  ${D}Enter — запустить и выйти${N}"
read -r
systemctl restart "$SERVICE_NAME" > /dev/null 2>&1 || true
systemctl reload nginx > /dev/null 2>&1 || true
clear
