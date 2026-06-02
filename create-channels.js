'use strict';

require('dotenv').config();

const axios            = require('axios');
const yaml             = require('js-yaml');
const pLimit           = require('p-limit');
const RocketChatClient = require('./lib/client');
const logger           = require('./lib/logger');

const CONCURRENT_INVITES = 5;

// ─── Основная логика ──────────────────────────────────────────────
/**
 * @param {object}   opts
 * @param {string}   opts.serverUrl
 * @param {string}   opts.username
 * @param {string}   opts.password
 * @param {string}   opts.yamlUrl
 * @param {string[]} [opts.volunteerNames]
 */
async function main({ serverUrl, username, password, yamlUrl, volunteerNames = [] }) {
  logger.banner('Создание каналов → Rocket.Chat');

  // ── Авторизация ──────────────────────────────────────────────────
  logger.info('Авторизация на сервере...');
  const client = await RocketChatClient.login(serverUrl, username, password);
  logger.ok('Авторизация успешна');

  // ── Загрузка channels.yaml ───────────────────────────────────────
  logger.info(`Загрузка YAML: ${yamlUrl}`);
  let channelList;
  try {
    const { data } = await axios.get(yamlUrl);
    const parsed   = yaml.load(data);
    channelList    = parsed?.channels;
    if (!Array.isArray(channelList) || channelList.length === 0) {
      throw new Error('Список каналов пуст или имеет неверный формат');
    }
  } catch (err) {
    throw new Error(`Не удалось загрузить/распарсить YAML: ${err.message}`);
  }
  logger.ok(`Найдено в YAML: ${channelList.length} каналов`);

  // ── Существующие каналы ──────────────────────────────────────────
  logger.info('Получение существующих каналов...');
  const [channelsMap, groupsMap] = await Promise.all([
    client.getExistingChannelsMap(),
    client.getExistingGroupsMap(),
  ]);
  logger.ok(`Уже существует: ${channelsMap.size} публичных, ${groupsMap.size} приватных`);

  // ── userId всех волонтёров ───────────────────────────────────────
  let volunteerUserIds = [];
  if (volunteerNames.length > 0) {
    logger.info(`Получение userId для ${volunteerNames.length} волонтёров...`);
    const usersMap   = await client.getAllUsersMap();
    volunteerUserIds = volunteerNames
      .map((name) => {
        const id = usersMap.get(name);
        if (!id) logger.warn(`userId не найден для @${name} — пропуск`);
        return id;
      })
      .filter(Boolean);
    logger.ok(`Найдено userId: ${volunteerUserIds.length}`);
  }

  logger.divider();

  // ── Создание каналов ─────────────────────────────────────────────
  let created = 0;
  let skipped = 0;
  let failed  = 0;

  for (const channel of channelList) {
    if (!channel.name) {
      logger.error(`Пропущен канал — нет поля name: ${JSON.stringify(channel)}`);
      failed++;
      continue;
    }

    const isPrivate   = channel.private === true;
    const existingMap = isPrivate ? groupsMap : channelsMap;
    const type        = isPrivate ? 'закрытый' : 'открытый';

    // ── Канал уже существует — только добавляем волонтёров ──────────
    if (existingMap.has(channel.name)) {
      const roomId = existingMap.get(channel.name);
      logger.skip(`Уже существует (${type}): #${channel.name}`);
      skipped++;

      if (volunteerUserIds.length > 0) {
        await inviteVolunteers(client, roomId, volunteerUserIds, channel.name, isPrivate);
      }
      continue;
    }

    // ── Объединяем участников: из yaml + волонтёры ───────────────────
    const uniqueMembers = [...new Set([...(channel.members ?? []), ...volunteerNames])];

    const payload = {
      name:        channel.name,
      members:     uniqueMembers,
      readOnly:    channel.readOnly    ?? false,
      topic:       channel.topic       ?? '',
      description: channel.description ?? '',
    };

    try {
      let roomId;

      if (isPrivate) {
        const group = await client.createGroup(payload);
        roomId = group._id;
      } else {
        const ch = await client.createChannel(payload);
        roomId = ch._id;
      }

      logger.ok(`Создан (${type}): #${channel.name} [участников: ${uniqueMembers.length}]`);
      created++;

      // ── Устанавливаем default отдельным вызовом после создания ──────
      if (channel.default === true) {
        try {
          await client.setRoomDefault(roomId, true);
          logger.ok(`  По умолчанию: ✅ #${channel.name}`);
        } catch (err) {
          logger.warn(`  Не удалось установить default для #${channel.name}: ${err.message}`);
        }
      }

      // ── Загружаем аватар ─────────────────────────────────────────────
      if (channel.avatar) {
        await uploadAvatar(client, roomId, channel.name, channel.avatar);
      }

    } catch (err) {
      logger.error(`Ошибка [${channel.name}]: ${err.message}`);
      failed++;
    }
  }

  return { created, skipped, failed };
}

// ─── Загрузка аватара ─────────────────────────────────────────────
async function uploadAvatar(client, roomId, channelName, avatarUrl) {
  try {
    logger.info(`  Загрузка аватара для #${channelName}...`);

    const { data: imageBuffer } = await axios.get(avatarUrl, {
      responseType: 'arraybuffer',
    });

    const file = avatarUrl.split('/').pop().split('?')[0];
    const ext  = file.split('.').pop().toLowerCase() || 'png';

    await client.setRoomAvatar(roomId, Buffer.from(imageBuffer), ext);
    logger.ok(`  Аватар установлен для #${channelName}`);
  } catch (err) {
    // Не фатальная ошибка — канал уже создан
    logger.warn(`  Не удалось загрузить аватар для #${channelName}: ${err.message}`);
  }
}

// ─── Добавление волонтёров в существующий канал ───────────────────
async function inviteVolunteers(client, roomId, userIds, channelName, isPrivate) {
  logger.info(`  Добавление волонтёров в #${channelName}...`);

  const limit = pLimit(CONCURRENT_INVITES);
  let added   = 0;
  let errors  = 0;

  await Promise.all(
    userIds.map((userId) =>
      limit(async () => {
        try {
          if (isPrivate) {
            await client.inviteToGroup(roomId, userId);
          } else {
            await client.inviteToChannel(roomId, userId);
          }
          added++;
        } catch (err) {
          if (!err.message.includes('already')) {
            logger.warn(`    Не удалось добавить userId=${userId}: ${err.message}`);
            errors++;
          }
        }
      })
    )
  );

  logger.ok(`  Добавлено: ${added} | Ошибок: ${errors}`);
}

module.exports = main;

// ─── Прямой запуск ────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    const serverUrl = process.env.ROCKETCHAT_SERVER_URL;
    const username  = process.env.ADMIN_USERNAME;
    const password  = process.env.ADMIN_PASSWORD;
    const yamlUrl   = process.env.CHANNELS_YAML_URL;

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