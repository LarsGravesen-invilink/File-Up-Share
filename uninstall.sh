#!/bin/bash
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/$SERVICE_NAME"
NGINX_LINK="/etc/nginx/sites-enabled/$SERVICE_NAME"
R='\033[0;31m'
G='\033[0;32m'
W='\033[1;37m'
D='\033[2m'
B='\033[1m'
N='\033[0m'
clear
printf "\n\n  ${B}${R}Удаление FileUpShare${N}\n\n"
printf "  ${W}Будут удалены:${N}\n\n"
printf "  ${D}  Сервис и конфигурация Nginx${N}\n"
printf "  ${D}  Приложение ${INSTALL_DIR}${N}\n"
printf "  ${D}  Все данные ${DATA_DIR}${N}\n"
printf "  ${D}  Все раздаваемые и принятые файлы${N}\n"
printf "  ${D}  Команды unlock-my-panel, update-fileupshare${N}\n"
printf "  ${D}  Systemd сервис${N}\n\n"
printf "  ${B}${R}Это действие необратимо!${N}\n\n"
printf "  ${W}Введите ${B}YES${N}${W} для подтверждения: ${N}"
read -r confirm
if [ "$confirm" != "YES" ]; then
    clear
    exit 0
fi
printf "\n"
systemctl stop "$SERVICE_NAME" > /dev/null 2>&1 || true
systemctl disable "$SERVICE_NAME" > /dev/null 2>&1 || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload > /dev/null 2>&1 || true
rm -f "$NGINX_CONF" "$NGINX_LINK"
nginx -t > /dev/null 2>&1 && systemctl reload nginx > /dev/null 2>&1 || true
if [ -f "$INSTALL_DIR/data/settings.json" ]; then
    SP=$(grep -o '"storagePath":"[^"]*"' "$INSTALL_DIR/data/settings.json" 2>/dev/null | cut -d'"' -f4)
    RP=$(grep -o '"receivedPath":"[^"]*"' "$INSTALL_DIR/data/settings.json" 2>/dev/null | cut -d'"' -f4)
    if [ -n "$SP" ] && [ -d "$SP" ]; then rm -rf "$SP"; fi
    if [ -n "$RP" ] && [ -d "$RP" ]; then rm -rf "$RP"; fi
fi
rm -rf "$INSTALL_DIR"
rm -rf "$DATA_DIR"
rm -f /usr/local/bin/unlock-my-panel
rm -f /usr/local/bin/update-fileupshare
rm -f /usr/local/bin/uninstall-fileupshare
clear
printf "\n\n  ${G}FileUpShare полностью удалён${N}\n\n"
