#!/bin/bash
INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/$SERVICE_NAME"
NGINX_LINK="/etc/nginx/sites-enabled/$SERVICE_NAME"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
clear
printf "\n\n  ${BOLD}${RED}Удаление FileUpShare${NC}\n\n"
printf "  ${WHITE}Будут удалены:${NC}\n\n"
printf "  ${DIM}• Сервис и конфигурация Nginx${NC}\n"
printf "  ${DIM}• Приложение ${INSTALL_DIR}${NC}\n"
printf "  ${DIM}• Все данные ${DATA_DIR}${NC}\n"
printf "  ${DIM}• Все раздаваемые и принятые файлы${NC}\n"
printf "  ${DIM}• Команды unlock-my-panel, update-fileupshare${NC}\n"
printf "  ${DIM}• Systemd сервис${NC}\n\n"
printf "  ${BOLD}${RED}Это действие необратимо!${NC}\n\n"
printf "  ${WHITE}Введите ${BOLD}YES${NC}${WHITE} для подтверждения или ${BOLD}NO${NC}${WHITE} для отмены: ${NC}"
read -r confirm
if [ "$confirm" != "YES" ]; then
    clear
    exit 0
fi
printf "\n"
systemctl stop "$SERVICE_NAME" > /dev/null 2>&1 || true
systemctl disable "$SERVICE_NAME" > /dev/null 2>&1 || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload > /dev/null 2>&1
rm -f "$NGINX_CONF" "$NGINX_LINK"
nginx -t > /dev/null 2>&1 && systemctl reload nginx > /dev/null 2>&1 || true
if [ -f "$INSTALL_DIR/data/settings.json" ]; then
    SP=$(grep -o '"storagePath":"[^"]*"' "$INSTALL_DIR/data/settings.json" 2>/dev/null | cut -d'"' -f4)
    RP=$(grep -o '"receivedPath":"[^"]*"' "$INSTALL_DIR/data/settings.json" 2>/dev/null | cut -d'"' -f4)
    [ -n "$SP" ] && [ -d "$SP" ] && rm -rf "$SP"
    [ -n "$RP" ] && [ -d "$RP" ] && rm -rf "$RP"
fi
rm -rf "$INSTALL_DIR"
rm -rf "$DATA_DIR"
rm -f /usr/local/bin/unlock-my-panel
rm -f /usr/local/bin/update-fileupshare
rm -f /usr/local/bin/uninstall-fileupshare
clear
printf "\n\n  ${GREEN}FileUpShare полностью удалён${NC}\n\n"
