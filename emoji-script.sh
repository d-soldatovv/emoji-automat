#!/usr/bin/env bash
set -euo pipefail

# ======================== КОНСТАНТЫ ========================
REPO_URL="https://github.com/d-soldatovv/emoji-automat"
YAML_URL="https://raw.githubusercontent.com/d-soldatovv/emoji-automat/refs/heads/main/School21.yaml"

# ======================== ЦВЕТА ========================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ======================== ФУНКЦИИ ========================
print_info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
print_ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
print_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ======================== ПРИВЕТСТВИЕ ========================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Импорт эмодзи в Rocket.Chat — настройка     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ======================== ВВОД ДАННЫХ ========================

read -rp "$(echo -e "${CYAN}[1/3]${NC} URL Rocket.Chat сервера (например https://chat.example.com): ")" ROCKETCHAT_URL
echo ""

read -rp "$(echo -e "${CYAN}[2/3]${NC} Логин администратора: ")" ADMIN_USER
echo ""

read -srp "$(echo -e "${CYAN}[3/3]${NC} Пароль администратора (ввод скрыт): ")" ADMIN_PASS
echo ""
echo ""

# ======================== ВАЛИДАЦИЯ ========================

MISSING=0
if [[ -z "$ROCKETCHAT_URL" ]]; then
    print_error "URL Rocket.Chat не может быть пустым"
    MISSING=1
fi
if [[ -z "$ADMIN_USER" ]]; then
    print_error "Логин не может быть пустым"
    MISSING=1
fi
if [[ -z "$ADMIN_PASS" ]]; then
    print_error "Пароль не может быть пустым"
    MISSING=1
fi

if [[ "$MISSING" -eq 1 ]]; then
    print_error "Заполните все обязательные поля. Перезапустите скрипт."
    exit 1
fi

ROCKETCHAT_URL="${ROCKETCHAT_URL%/}"

# ======================== ПОДТВЕРЖДЕНИЕ ========================

echo -e "${YELLOW}┌──────────────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│  Проверьте введённые данные:                 │${NC}"
echo -e "${YELLOW}├──────────────────────────────────────────────┤${NC}"
echo -e "${YELLOW}│${NC}  Сервер: $ROCKETCHAT_URL"
echo -e "${YELLOW}│${NC}  Логин:  $ADMIN_USER"
echo -e "${YELLOW}│${NC}  Пароль: ********"
echo -e "${YELLOW}└──────────────────────────────────────────────┘${NC}"
echo ""

read -rp "$(echo -e "${CYAN}Всё верно? (y/n): ${NC}")" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_warn "Отменено. Перезапустите скрипт."
    exit 0
fi

echo ""

# ======================== ПРОВЕРКА ЗАВИСИМОСТЕЙ ========================

print_info "Проверка зависимостей..."

DEPS_MISSING=0

for cmd in git node npm; do
    if command -v "$cmd" &> /dev/null; then
        print_ok "$cmd найден: $(command -v "$cmd")"
    else
        print_error "$cmd не найден!"
        DEPS_MISSING=1
    fi
done

if [[ "$DEPS_MISSING" -eq 1 ]]; then
    print_info "Пытаюсь установить недостающие зависимости..."

    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian)
                sudo apt-get update -y
                command -v git  &> /dev/null || sudo apt-get install -y git
                if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
                    command -v curl &> /dev/null || sudo apt-get install -y curl
                    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                    sudo apt-get install -y nodejs
                fi
                ;;
            centos|rhel|fedora|rocky|alma)
                command -v git &> /dev/null || { sudo yum install -y git || sudo dnf install -y git; }
                if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
                    command -v curl &> /dev/null || { sudo yum install -y curl || sudo dnf install -y curl; }
                    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                    sudo yum install -y nodejs || sudo dnf install -y nodejs
                fi
                ;;
            *)
                print_error "Неизвестный дистрибутив: $ID. Установите git, node, npm вручную."
                exit 1
                ;;
        esac
    elif [[ "$(uname)" == "Darwin" ]]; then
        if ! command -v brew &> /dev/null; then
            print_error "Установите Homebrew: https://brew.sh"
            exit 1
        fi
        command -v git  &> /dev/null || brew install git
        command -v node &> /dev/null || brew install node
    else
        print_error "Не удалось определить ОС. Установите git, node, npm вручную."
        exit 1
    fi

    for cmd in git node npm; do
        if ! command -v "$cmd" &> /dev/null; then
            print_error "Не удалось установить $cmd."
            exit 1
        fi
    done
    print_ok "Все зависимости установлены!"
fi

# ======================== РАБОЧАЯ ДИРЕКТОРИЯ ========================

WORK_DIR=$(mktemp -d)
print_info "Рабочая директория: $WORK_DIR"

cleanup() {
    print_info "Очистка временных файлов..."
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# ======================== КЛОНИРОВАНИЕ ========================

print_info "Клонирование репозитория..."
git clone "${REPO_URL}.git" "$WORK_DIR/emoji"
print_ok "Репозиторий клонирован"

cd "$WORK_DIR/emoji"

# ======================== NPM INSTALL ========================

print_info "Установка npm-зависимостей..."
npm install
print_ok "npm-зависимости установлены"

# ======================== .env ========================

print_info "Создание .env файла..."

cat > .env <<EOF
ROCKETCHAT_SERVER_URL=${ROCKETCHAT_URL}
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASS}
EOF

print_ok ".env файл создан"

# ======================== ЗАПУСК ========================

print_info "========================================="
print_info "  Запуск импорта эмодзи..."
print_info "========================================="

echo "$YAML_URL" | node import-custom-emojis.js

print_ok "========================================="
print_ok "  Импорт завершён!"
print_ok "========================================="
