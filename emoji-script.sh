#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════
#  КОНСТАНТЫ
# ═══════════════════════════════════════════════════════════════════
REPO_URL="https://github.com/d-soldatovv/emoji-automat"

EMOJI_YAML_URL="https://raw.githubusercontent.com/d-soldatovv/emoji-automat/main/School21.yaml"
USERS_YAML_URL="https://raw.githubusercontent.com/d-soldatovv/emoji-automat/main/volunteers.yaml"
CHANNELS_YAML_URL="https://raw.githubusercontent.com/d-soldatovv/emoji-automat/main/channels.yaml"

# ═══════════════════════════════════════════════════════════════════
#  ЦВЕТА
# ═══════════════════════════════════════════════════════════════════
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

print_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
print_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
print_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
divider()     { echo -e "${CYAN}$(printf '─%.0s' {1..52})${NC}"; }

# ═══════════════════════════════════════════════════════════════════
#  БАННЕР
# ═══════════════════════════════════════════════════════════════════
clear
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${BOLD}Rocket.Chat Automat — School 21               ${NC}${CYAN}  ║${NC}"
echo -e "${CYAN}║  Эмодзи · Волонтёры · Каналы                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════
#  ВВОД ДАННЫХ
# ═══════════════════════════════════════════════════════════════════
read -rp "$(echo -e "${CYAN}[1/3]${NC} URL Rocket.Chat (например https://chat.example.com): ")" ROCKETCHAT_URL
echo ""
read -rp "$(echo -e "${CYAN}[2/3]${NC} Логин администратора: ")" ADMIN_USER
echo ""
read -srp "$(echo -e "${CYAN}[3/3]${NC} Пароль администратора (ввод скрыт): ")" ADMIN_PASS
echo -e "\n"

# ═══════════════════════════════════════════════════════════════════
#  ВАЛИДАЦИЯ
# ═══════════════════════════════════════════════════════════════════
MISSING=0
[[ -z "$ROCKETCHAT_URL" ]] && { print_error "URL не может быть пустым";    MISSING=1; }
[[ -z "$ADMIN_USER"     ]] && { print_error "Логин не может быть пустым";  MISSING=1; }
[[ -z "$ADMIN_PASS"     ]] && { print_error "Пароль не может быть пустым"; MISSING=1; }
[[ "$MISSING" -eq 1 ]] && { print_error "Заполните все поля и перезапустите скрипт."; exit 1; }

ROCKETCHAT_URL="${ROCKETCHAT_URL%/}"

# ═══════════════════════════════════════════════════════════════════
#  МЕНЮ
# ═══════════════════════════════════════════════════════════════════
echo -e "${YELLOW}┌──────────────────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│  Что выполнить?                                  │${NC}"
echo -e "${YELLOW}├──────────────────────────────────────────────────┤${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}1)${NC} 😀  Импортировать эмодзи                       ${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}2)${NC} 👤  Создать волонтёров                         ${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}3)${NC} 📢  Создать каналы                             ${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}4)${NC} 👤📢 Создать волонтёров + каналы               ${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}5)${NC} 🚀  Всё сразу (эмодзи + волонтёры + каналы)   ${YELLOW}│${NC}"
echo -e "${YELLOW}│${NC}  ${BOLD}6)${NC} ❌  Выйти                                      ${YELLOW}│${NC}"
echo -e "${YELLOW}└──────────────────────────────────────────────────┘${NC}"
echo ""
read -rp "$(echo -e "${CYAN}Ваш выбор [1-6]: ${NC}")" MENU_CHOICE
echo ""

case "$MENU_CHOICE" in
  1) RUN_EMOJI=1; RUN_USERS=0; RUN_CHANNELS=0 ;;
  2) RUN_EMOJI=0; RUN_USERS=1; RUN_CHANNELS=0 ;;
  3) RUN_EMOJI=0; RUN_USERS=0; RUN_CHANNELS=1 ;;
  4) RUN_EMOJI=0; RUN_USERS=1; RUN_CHANNELS=1 ;;
  5) RUN_EMOJI=1; RUN_USERS=1; RUN_CHANNELS=1 ;;
  6) print_warn "Выход."; exit 0 ;;
  *) print_error "Неверный выбор. Перезапустите скрипт."; exit 1 ;;
esac

# ═══════════════════════════════════════════════════════════════════
#  ПОДТВЕРЖДЕНИЕ
# ═══════════════════════════════════════════════════════════════════
ACTION_LIST=""
[[ "$RUN_EMOJI"    -eq 1 ]] && ACTION_LIST+="    😀  Импорт эмодзи\n"
[[ "$RUN_USERS"    -eq 1 ]] && ACTION_LIST+="    👤  Создание волонтёров\n"
[[ "$RUN_CHANNELS" -eq 1 ]] && ACTION_LIST+="    📢  Создание каналов (+ аватары + волонтёры)\n"

echo -e "${YELLOW}┌──────────────────────────────────────────────────┐${NC}"
echo -e "${YELLOW}│  Проверьте данные:                               │${NC}"
echo -e "${YELLOW}├──────────────────────────────────────────────────┤${NC}"
echo -e "${YELLOW}│${NC}  Сервер : $ROCKETCHAT_URL"
echo -e "${YELLOW}│${NC}  Логин  : $ADMIN_USER"
echo -e "${YELLOW}│${NC}  Пароль : ••••••••"
echo -e "${YELLOW}│${NC}  Задачи :"
echo -e "$ACTION_LIST"
echo -e "${YELLOW}└──────────────────────────────────────────────────┘${NC}"
echo ""
read -rp "$(echo -e "${CYAN}Всё верно? (y/n): ${NC}")" CONFIRM
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { print_warn "Отменено."; exit 0; }
echo ""

# ═══════════════════════════════════════════════════════════════════
#  ЗАВИСИМОСТИ
# ═══════════════════════════════════════════════════════════════════
divider
print_info "Проверка зависимостей (git, node, npm)..."
DEPS_MISSING=0

for cmd in git node npm; do
  if command -v "$cmd" &>/dev/null; then
    print_ok "$cmd: $(command -v "$cmd")"
  else
    print_error "$cmd не найден!"
    DEPS_MISSING=1
  fi
done

if [[ "$DEPS_MISSING" -eq 1 ]]; then
  print_info "Устанавливаю недостающие зависимости..."

  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "$ID" in
      ubuntu|debian)
        sudo apt-get update -y
        command -v git &>/dev/null || sudo apt-get install -y git
        if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
          command -v curl &>/dev/null || sudo apt-get install -y curl
          curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
          sudo apt-get install -y nodejs
        fi
        ;;
      centos|rhel|fedora|rocky|almalinux)
        command -v git &>/dev/null || { sudo yum install -y git || sudo dnf install -y git; }
        if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
          command -v curl &>/dev/null || { sudo yum install -y curl || sudo dnf install -y curl; }
          curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
          sudo yum install -y nodejs || sudo dnf install -y nodejs
        fi
        ;;
      *)
        print_error "Неизвестный дистрибутив '$ID'. Установите git/node/npm вручную."
        exit 1
        ;;
    esac
  elif [[ "$(uname)" == "Darwin" ]]; then
    command -v brew &>/dev/null || { print_error "Установите Homebrew: https://brew.sh"; exit 1; }
    command -v git  &>/dev/null || brew install git
    command -v node &>/dev/null || brew install node
  else
    print_error "Не удалось определить ОС. Установите git/node/npm вручную."
    exit 1
  fi

  for cmd in git node npm; do
    command -v "$cmd" &>/dev/null || { print_error "Не удалось установить $cmd."; exit 1; }
  done
  print_ok "Все зависимости установлены"
fi

# ═══════════════════════════════════════════════════════════════════
#  РАБОЧАЯ ДИРЕКТОРИЯ
# ═══════════════════════════════════════════════════════════════════
WORK_DIR=$(mktemp -d)
print_info "Рабочая директория: $WORK_DIR"

cleanup() {
  print_info "Очистка временных файлов..."
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════
#  КЛОНИРОВАНИЕ + NPM INSTALL
# ═══════════════════════════════════════════════════════════════════
divider
print_info "Клонирование репозитория..."
git clone --depth=1 "${REPO_URL}.git" "$WORK_DIR/app"
print_ok "Репозиторий клонирован"

cd "$WORK_DIR/app"

print_info "Установка npm-зависимостей..."
npm install --omit=dev
print_ok "Зависимости установлены"

# ═══════════════════════════════════════════════════════════════════
#  .env
# ═══════════════════════════════════════════════════════════════════
cat > .env <<EOF
ROCKETCHAT_SERVER_URL=${ROCKETCHAT_URL}
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_PASSWORD=${ADMIN_PASS}
EMOJI_YAML_URL=${EMOJI_YAML_URL}
USERS_YAML_URL=${USERS_YAML_URL}
CHANNELS_YAML_URL=${CHANNELS_YAML_URL}
EOF
print_ok ".env создан"

# ═══════════════════════════════════════════════════════════════════
#  RUNNER — объединяет импорт пользователей и каналов
# ═══════════════════════════════════════════════════════════════════
cat > runner.js <<'RUNNER_EOF'
'use strict';
require('dotenv').config();

const importEmojis    = require('./import-custom-emojis');
const importUsers     = require('./import-users');
const createChannels  = require('./create-channels');
const logger          = require('./lib/logger');

const serverUrl  = process.env.ROCKETCHAT_SERVER_URL;
const username   = process.env.ADMIN_USERNAME;
const password   = process.env.ADMIN_PASSWORD;

const RUN_EMOJI    = process.env.RUN_EMOJI    === '1';
const RUN_USERS    = process.env.RUN_USERS    === '1';
const RUN_CHANNELS = process.env.RUN_CHANNELS === '1';

(async () => {
  let exitCode = 0;
  let volunteerNames = [];

  try {
    // 1. Эмодзи
    if (RUN_EMOJI) {
      const { uploaded, skipped, failed } = await importEmojis({
        serverUrl, username, password,
        yamlUrl: process.env.EMOJI_YAML_URL,
      });
      logger.divider();
      logger.ok(`Эмодзи — Загружено: ${uploaded} | Пропущено: ${skipped} | Ошибок: ${failed}`);
      if (failed > 0) exitCode = 1;
    }

    // 2. Волонтёры — сохраняем список имён для каналов
    if (RUN_USERS) {
      const { created, skipped, failed, createdUsernames } = await importUsers({
        serverUrl, username, password,
        yamlUrl: process.env.USERS_YAML_URL,
      });
      logger.divider();
      logger.ok(`Волонтёры — Создано: ${created} | Пропущено: ${skipped} | Ошибок: ${failed}`);
      if (failed > 0) exitCode = 1;

      // Передаём список волонтёров в createChannels
      volunteerNames = createdUsernames;
    }

    // 3. Каналы — передаём имена волонтёров для автодобавления
    if (RUN_CHANNELS) {
      const { created, skipped, failed } = await createChannels({
        serverUrl, username, password,
        yamlUrl:        process.env.CHANNELS_YAML_URL,
        volunteerNames,
      });
      logger.divider();
      logger.ok(`Каналы — Создано: ${created} | Пропущено: ${skipped} | Ошибок: ${failed}`);
      if (failed > 0) exitCode = 1;
    }

  } catch (err) {
    logger.error(err.message);
    exitCode = 1;
  }

  process.exit(exitCode);
})();
RUNNER_EOF

# ═══════════════════════════════════════════════════════════════════
#  ЗАПУСК
# ═══════════════════════════════════════════════════════════════════
divider

RUN_EMOJI="${RUN_EMOJI}" \
RUN_USERS="${RUN_USERS}" \
RUN_CHANNELS="${RUN_CHANNELS}" \
node runner.js

RESULT=$?

divider
if [[ "$RESULT" -eq 0 ]]; then
  echo -e "\n${GREEN}${BOLD}  ✅  Все задачи выполнены успешно!${NC}\n"
else
  echo -e "\n${YELLOW}${BOLD}  ⚠️   Выполнено с ошибками — проверьте лог выше.${NC}\n"
fi

exit "$RESULT"