'use strict';

require('dotenv').config();

const axios              = require('axios');
const yaml               = require('js-yaml');
const pLimit             = require('p-limit');
const RocketChatClient   = require('./lib/client');
const logger             = require('./lib/logger');

const CONCURRENT_UPLOADS = 5;

// ─── Основная логика ──────────────────────────────────────────────
async function main({ serverUrl, username, password, yamlUrl }) {
  logger.banner('Импорт эмодзи → Rocket.Chat');

  logger.info('Авторизация на сервере...');
  const client = await RocketChatClient.login(serverUrl, username, password);
  logger.ok('Авторизация успешна');

  logger.info(`Загрузка YAML: ${yamlUrl}`);
  let emojiList;
  try {
    const { data } = await axios.get(yamlUrl);
    const parsed   = yaml.load(data);
    emojiList      = parsed?.emojis;
    if (!Array.isArray(emojiList) || emojiList.length === 0) {
      throw new Error('Список эмодзи пуст или имеет неверный формат');
    }
  } catch (err) {
    throw new Error(`Не удалось загрузить/распарсить YAML: ${err.message}`);
  }
  logger.ok(`Найдено в YAML: ${emojiList.length} эмодзи`);

  logger.info('Получение списка существующих эмодзи...');
  const existing = await client.getExistingEmojiNames();
  logger.ok(`Уже есть на сервере: ${existing.size}`);
  logger.divider();

  const toUpload = emojiList.filter((emoji) => {
    if (existing.has(emoji.name)) {
      logger.skip(`Уже существует: :${emoji.name}:`);
      return false;
    }
    return true;
  });

  if (toUpload.length === 0) {
    logger.ok('Все эмодзи уже загружены — ничего нового.');
    return { uploaded: 0, skipped: emojiList.length, failed: 0 };
  }

  logger.info(`К загрузке: ${toUpload.length} (параллельно по ${CONCURRENT_UPLOADS})`);
  logger.divider();

  const limit  = pLimit(CONCURRENT_UPLOADS);
  let uploaded = 0;
  let failed   = 0;

  await Promise.all(
    toUpload.map((emoji) =>
      limit(async () => {
        const file     = emoji.src.split('/').pop();
        const dotIndex = file.lastIndexOf('.');
        const filename = file.substring(0, dotIndex);
        const ext      = file.substring(dotIndex + 1).toLowerCase();

        try {
          const { data: imageBuffer } = await axios.get(emoji.src, {
            responseType: 'arraybuffer',
          });
          await client.uploadEmoji(
            emoji.name,
            Buffer.from(imageBuffer),
            filename,
            ext
          );
          logger.ok(`Загружен: :${emoji.name}:`);
          uploaded++;
        } catch (err) {
          logger.error(`Ошибка [${emoji.name}]: ${err.message}`);
          failed++;
        }
      })
    )
  );

  return { uploaded, skipped: emojiList.length - toUpload.length, failed };
}

module.exports = main;

// ─── Прямой запуск ───────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    const serverUrl = process.env.ROCKETCHAT_SERVER_URL;
    const username  = process.env.ADMIN_USERNAME;
    const password  = process.env.ADMIN_PASSWORD;
    const yamlUrl   = process.env.EMOJI_YAML_URL;

    if (!serverUrl || !username || !password || !yamlUrl) {
      logger.error('Заданы не все переменные окружения. Используйте emoji-script.sh');
      process.exit(1);
    }

    try {
      const { uploaded, skipped, failed } = await main({
        serverUrl, username, password, yamlUrl,
      });
      logger.divider();
      logger.ok(`Загружено: ${uploaded} | Пропущено: ${skipped} | Ошибок: ${failed}`);
      if (failed > 0) process.exit(1);
    } catch (err) {
      logger.error(err.message);
      process.exit(1);
    }
  })();
}