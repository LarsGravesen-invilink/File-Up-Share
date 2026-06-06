#!/usr/bin/env bash

INSTALL_DIR="/opt/fileupshare"
DATA_DIR="/var/lib/fileupshare"
SERVICE_NAME="fileupshare"
NGINX_CONF="/etc/nginx/sites-available/${SERVICE_NAME}"
NGINX_LINK="/etc/nginx/sites-enabled/${SERVICE_NAME}"

clear
printf "\n"
printf "  \e[0;31m══════════════════════════════════════════\e[0m\n"
printf "  \e[1;31m  Удаление FileUpShare\e[0m\n"
printf "  \e[0;31m══════════════════════════════════════════\e[0m\n"
printf "\n"
printf "  \e[1;37mБудут удалены:\e[0m\n\n"
printf "  \e[2m  Сервис и конфигурация Nginx\e[0m\n"
printf "  \e[2m  Приложение %s\e[0m\n" "$INSTALL_DIR"
printf "  \e[2m  Все данные %s\e[0m\n" "$DATA_DIR"
printf "  \e[2m  Все раздаваемые и принятые файлы\e[0m\n"
printf "  \e[2m  Команды unlock-my-panel, update-fileupshare\e[0m\n"
printf "  \e[2m  Systemd сервис\e[0m\n"
printf "\n"
printf "  \e[1;31mЭто действие необратимо!\e[0m\n"
printf "\n"
printf "  \e[1;37mВведите \e[1mYES\e[0m\e[1;37m для подтверждения или \e[1mNO\e[0m\e[1;37m для отмены: \e[0m"
IFS= read -r confirm < /dev/tty

if [ "$confirm" != "YES" ]; then
    clear
    printf "\n  \e[2mОтменено\e[0m\n\n"
    exit 0
fi

printf "\n"
systemctl stop "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl disable "$SERVICE_NAME" >/dev/null 2>&1 || true
rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
systemctl daemon-reload >/dev/null 2>&1 || true
rm -f "$NGINX_CONF" "$NGINX_LINK"
nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1 || true

if [ -f "${DATA_DIR}/settings.json" ]; then
    SP="$(grep -o '"storagePath":"[^"]*"' "${DATA_DIR}/settings.json" 2>/dev/null | cut -d'"' -f4)"
    RP="$(grep -o '"receivedPath":"[^"]*"' "${DATA_DIR}/settings.json" 2>/dev/null | cut -d'"' -f4)"
    if [ -n "$SP" ] && [ -d "$SP" ]; then rm -rf "$SP"; fi
    if [ -n "$RP" ] && [ -d "$RP" ]; then rm -rf "$RP"; fi
fi

rm -rf "$INSTALL_DIR"
rm -rf "$DATA_DIR"
rm -f /usr/local/bin/unlock-my-panel
rm -f /usr/local/bin/update-fileupshare
rm -f /usr/local/bin/uninstall-fileupshare

clear
printf "\n"
printf "  \e[0;32m══════════════════════════════════════════\e[0m\n"
printf "  \e[0;32m  FileUpShare полностью удалён\e[0m\n"
printf "  \e[0;32m══════════════════════════════════════════\e[0m\n"
printf "\n"
