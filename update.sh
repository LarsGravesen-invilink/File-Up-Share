#!/bin/bash
set -e
REPO="LarsGravesen-invilink/File-Up-Share"
INSTALL_DIR="/opt/fileupshare"
SERVICE_NAME="fileupshare"
VERSION_URL="https://raw.githubusercontent.com/$REPO/main/version.json"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
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
CVER="1.0.1"
LVER=$(curl -s "$VERSION_URL" 2>/dev/null | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
clear
printf "\n\n  ${BOLD}${WHITE}Обновление ${CYAN}FileUpShare${NC}\n\n"
printf "  ${WHITE}Текущая версия:${NC}  ${DIM}${CVER}${NC}\n"
if [ -z "$LVER" ]; then
    printf "\n  ${RED}Не удалось проверить обновления${NC}\n\n"
    exit 1
fi
if [ "$LVER" = "$CVER" ]; then
    printf "\n  ${GREEN}Вы используете последнюю версию ${CVER}${NC}\n\n"
    exit 0
fi
printf "  ${WHITE}Доступна версия:${NC} ${GREEN}${LVER}${NC}\n\n"
printf "  ${DIM}Enter — обновить  |  X — выйти${NC}  "
read -r inp
if [ "$inp" = "X" ] || [ "$inp" = "x" ]; then
    clear; exit 0
fi
clear
printf "\n\n  ${BOLD}${WHITE}Подготовка${NC}\n\n"
printf "\r  ${DIM}Обновление системы${NC}"
apt-get update -qq > /dev/null 2>&1
pbar 2 "Обновление системы"
pbar 1 "Зависимости"
clear
printf "\n\n  ${BOLD}${WHITE}Обновление до ${CYAN}${LVER}${NC}\n\n"
STEPS=("Загрузка" "Распаковка" "Модули" "Сборка" "Перезапуск")
total=${#STEPS[@]}
w=40
for ((idx=0;idx<total;idx++)); do
    p=$(((idx+1)*100/total))
    f=$((p*w/100))
    b=""; for ((j=1;j<=w;j++)); do [ $j -le $f ] && b="${b}█" || b="${b}░"; done
    printf "\r  ${DIM}${STEPS[$idx]}${NC}                                        "
    printf "\n\r  ${CYAN}${b}${NC} ${WHITE}${p}%%${NC}"
    case $idx in
        0) cd /tmp; rm -rf File-Up-Share; git clone --depth 1 "https://github.com/$REPO.git" > /dev/null 2>&1;;
        1) rsync -a --exclude='data' --exclude='.secret' /tmp/File-Up-Share/ "$INSTALL_DIR/" 2>/dev/null || { cp -r /tmp/File-Up-Share/* "$INSTALL_DIR/" 2>/dev/null||true; };;
        2) cd "$INSTALL_DIR"; npm install --production > /dev/null 2>&1||true;;
        3) cd "$INSTALL_DIR"; npm run build > /dev/null 2>&1||true;;
        4) systemctl restart "$SERVICE_NAME" > /dev/null 2>&1||true; systemctl reload nginx > /dev/null 2>&1||true; rm -rf /tmp/File-Up-Share;;
    esac
    printf "\033[1A\r  ${GREEN}✓ ${STEPS[$idx]}${NC}                                        \n"
done
printf "\r  ${GREEN}"; for ((j=1;j<=w;j++)); do printf "█"; done; printf "${NC} ${GREEN}100%%${NC}\n"
sleep 0.5
clear
printf "\n\n  ${BOLD}${WHITE}Проверка${NC}\n\n"
upbar 4 "Проверка"
clear
printf "\n\n  ${BOLD}${GREEN}Обновление успешно установлено${NC}\n\n"
printf "  ${WHITE}Версия:${NC} ${GREEN}${LVER}${NC}\n\n"
printf "  ${DIM}Enter — запустить сервис и выйти${NC}"
read -r
systemctl restart "$SERVICE_NAME" > /dev/null 2>&1
systemctl reload nginx > /dev/null 2>&1
clear
