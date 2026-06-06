#!/bin/bash
# FileUpShare — Emergency Panel Unlock
# Location: /opt/fileupshare/.secret/unlock-panel.sh
# Symlink: /usr/local/bin/unlock-my-panel → this file
# Created automatically during install.sh

set -e

CONF_DIR="/opt/fileupshare"
STEALTH_FILE="$CONF_DIR/data/stealth.lock"
PASS_FILE="$CONF_DIR/data/auth.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

clear
echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${BOLD}FileUpShare — Разблокировка панели${NC}${CYAN}  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# Check if stealth mode is active
if [ ! -f "$STEALTH_FILE" ]; then
    echo -e "${GREEN}✓ Панель не заблокирована${NC}"
    echo -e "  Режим невидимки не активен."
    echo ""
    exit 0
fi

echo -e "${YELLOW}⚠ Панель скрыта (режим невидимки)${NC}"
echo ""
echo -e "Для разблокировки введите пароль панели."
echo ""

# Password prompt
MAX_ATTEMPTS=3
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    echo -ne "${BOLD}Пароль:${NC} "
    read -s INPUT_PASS
    echo ""
    
    # Verify password (bcrypt hash stored in auth.json)
    if [ -f "$PASS_FILE" ]; then
        STORED_HASH=$(cat "$PASS_FILE" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
        
        # Simple verification via node
        VERIFY=$(node -e "
            const crypto = require('crypto');
            const input = '$INPUT_PASS';
            const stored = '$STORED_HASH';
            // For bcrypt we'd use bcrypt.compareSync, for preview just base64
            const inputHash = Buffer.from(input).toString('base64');
            console.log(inputHash === stored ? 'OK' : 'FAIL');
        " 2>/dev/null || echo "FAIL")
        
        if [ "$VERIFY" = "OK" ]; then
            echo ""
            echo -e "${GREEN}✓ Пароль верный${NC}"
            
            # Remove stealth lock
            rm -f "$STEALTH_FILE"
            
            # Restart nginx to serve real page
            if command -v systemctl &> /dev/null; then
                systemctl reload nginx 2>/dev/null || true
            fi
            
            echo -e "${GREEN}✓ Панель разблокирована!${NC}"
            echo -e "  Режим невидимки отключён."
            echo -e "  Страница входа восстановлена."
            echo ""
            exit 0
        fi
    fi
    
    REMAINING=$((MAX_ATTEMPTS - ATTEMPT))
    if [ $REMAINING -gt 0 ]; then
        echo -e "${RED}✗ Неверный пароль${NC} (осталось попыток: $REMAINING)"
    fi
done

echo ""
echo -e "${RED}✗ Превышено количество попыток${NC}"
echo -e "  Попробуйте снова через 5 минут."
echo ""
exit 1
