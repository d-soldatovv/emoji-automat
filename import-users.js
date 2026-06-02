'use strict';

require('dotenv').config();

const axios            = require('axios');
const yaml             = require('js-yaml');
const RocketChatClient = require('./lib/client');
const logger           = require('./lib/logger');

const EMAIL_DOMAIN = 'student.21-school.ru';
const DEFAULT_ROLE = 'user';

async function main({ serverUrl, username, password, yamlUrl }) {
  logger.banner('Создание волонтёров → Rocket.Chat');

  logger.info('Авторизация на сервере...');
  const client = await RocketChatClient.login(serverUrl, username, password);
  logger.ok('Авторизация успешна');

  logger.info(`Загрузка YAML: ${yamlUrl}`);
  let userList;
  try {
    const { data } = await axios.get(yamlUrl);
    const parsed   = yaml.load(data);
    userList       = parsed?.users;
    if (!Array.isArray(userList) || userList.length === 0) {
      throw new Error('Список пользователей пуст или имеет неверный формат');
    }
  } catch (err) {
    throw new Error(`Не удалось загрузить/распарсить YAML: ${err.message}`);
  }
  logger.ok(`Найдено в YAML: ${userList.length} волонтёров`);

  logger.info('Получение списка существующих пользователей...');
  const existing = await client.getExistingUsernames();
  logger.ok(`Уже зарегистрировано: ${existing.size}`);
  logger.divider();

  let created            = 0;
  let skipped            = 0;
  let failed             = 0;
  const createdUsernames = [];

  for (const user of userList) {
    if (!user.username) {
      logger.error(`Пропущена запись — нет поля username: ${JSON.stringify(user)}`);
      failed++;
      continue;
    }

    const login    = user.username.trim().toLowerCase();
    const userPass = `s21_${login}`;

    if (existing.has(login)) {
      logger.skip(`Уже существует: @${login}`);
      createdUsernames.push(login);
      skipped++;
      continue;
    }

    try {
      await client.createUser({
        username:              login,
        email:                 `${login}@${EMAIL_DOMAIN}`,
        password:              userPass,
        name:                  login,        // name = username
        roles:                 [DEFAULT_ROLE],
        active:                true,
        verified:              true,
        joinDefaultChannels:   false,
        requirePasswordChange: true,
        sendWelcomeEmail:      false,
      });
      logger.ok(`Создан: @${login} | pass: ${userPass} | email: ${login}@${EMAIL_DOMAIN}`);
      createdUsernames.push(login);
      created++;
    } catch (err) {
      logger.error(`Ошибка [${login}]: ${err.message}`);
      failed++;
    }
  }

  return { created, skipped, failed, createdUsernames };
}

module.exports = main;

if (require.main === module) {
  (async () => {
    const serverUrl = process.env.ROCKETCHAT_SERVER_URL;
    const username  = process.env.ADMIN_USERNAME;
    const password  = process.env.ADMIN_PASSWORD;
    const yamlUrl   = process.env.USERS_YAML_URL;

    if (!serverUrl || !username || !password || !yamlUrl) {
      logger.error('Заданы не все переменные окружения. Используйте emoji-script.sh');
      process.exit(1);
    }

    try {
      const { created, skipped, failed } = await main({
        serverUrl, username, password, yamlUrl,
      });
      logger.divider();
      logger.ok(`Создано: ${created} | Пропущено: ${skipped} | Ошибок: ${failed}`);
      if (failed > 0) process.exit(1);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  })();
}