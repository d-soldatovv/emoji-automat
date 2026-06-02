'use strict';

const axios    = require('axios');
const FormData = require('form-data');
const logger   = require('./logger');

class RocketChatClient {
  /**
   * @param {string} serverUrl
   * @param {string} authToken
   * @param {string} userId
   */
  constructor(serverUrl, authToken, userId) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.authToken = authToken;
    this.userId    = userId;

    this._http = axios.create({
      baseURL: `${this.serverUrl}/api/v1`,
      headers: {
        'X-Auth-Token': authToken,
        'X-User-Id':    userId,
      },
      // Не бросать исключение на 4xx/5xx — обрабатываем сами
      validateStatus: () => true,
    });
  }

  // ═══════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════

  static async login(serverUrl, username, password) {
    const url = `${serverUrl.replace(/\/$/, '')}/api/v1/login`;

    let response;
    try {
      response = await axios.post(
        url,
        { user: username, password },
        { validateStatus: () => true }
      );
    } catch (err) {
      throw new Error(`Не удалось подключиться к серверу: ${err.message}`);
    }

    if (response.data?.status !== 'success' || !response.data?.data) {
      throw new Error(
        `Ошибка авторизации: ${response.data?.message ?? response.status}`
      );
    }

    const { authToken, userId } = response.data.data;
    return new RocketChatClient(serverUrl, authToken, userId);
  }

  // ═══════════════════════════════════════════════
  //  EMOJI
  // ═══════════════════════════════════════════════

  async getExistingEmojiNames() {
    const res  = await this._http.get('/emoji-custom.list');
    const list = res.data?.emojis?.update ?? [];
    return new Set(list.map((e) => e.name));
  }

  async uploadEmoji(name, imageBuffer, filename, ext) {
    const form = new FormData();
    form.append('name', name);
    form.append('aliases', '');
    form.append('emoji', imageBuffer, {
      filename:    `${filename}.${ext}`,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

    const res = await this._http.post('/emoji-custom.create', form, {
      headers:          form.getHeaders(),
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
    });

    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
    return res.data;
  }

  // ═══════════════════════════════════════════════
  //  USERS
  // ═══════════════════════════════════════════════

  /** Возвращает Map<username, userId> для всех пользователей */
  async getAllUsersMap() {
    const map    = new Map();
    let offset   = 0;
    const count  = 100;

    while (true) {
      const res   = await this._http.get('/users.list', { params: { offset, count } });
      const users = res.data?.users ?? [];
      users.forEach((u) => map.set(u.username, u._id));
      if (users.length < count) break;
      offset += count;
    }

    return map;
  }

  async getExistingUsernames() {
    const map = await this.getAllUsersMap();
    return new Set(map.keys());
  }

  async createUser(userData) {
    const res = await this._http.post('/users.create', userData);
    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
    return res.data.user;
  }

  // ═══════════════════════════════════════════════
  //  CHANNELS
  // ═══════════════════════════════════════════════

  /** Возвращает Map<channelName, roomId> для публичных каналов */
  async getExistingChannelsMap() {
    const map   = new Map();
    let offset  = 0;
    const count = 100;

    while (true) {
      const res      = await this._http.get('/channels.list', { params: { offset, count } });
      const channels = res.data?.channels ?? [];
      channels.forEach((ch) => map.set(ch.name, ch._id));
      if (channels.length < count) break;
      offset += count;
    }

    return map;
  }

  /** Возвращает Map<groupName, roomId> для приватных каналов */
  async getExistingGroupsMap() {
    const map   = new Map();
    let offset  = 0;
    const count = 100;

    while (true) {
      const res    = await this._http.get('/groups.listAll', { params: { offset, count } });
      const groups = res.data?.groups ?? [];
      groups.forEach((g) => map.set(g.name, g._id));
      if (groups.length < count) break;
      offset += count;
    }

    return map;
  }

  /**
   * Создать публичный канал
   * @returns {{ _id, name }} объект созданного канала
   */
  async createChannel({ name, members = [], readOnly = false, topic = '', description = '' }) {
    const res = await this._http.post('/channels.create', {
      name,
      members,
      readOnly,
      extraData: { topic, description },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
    return res.data.channel;
  }

  /**
   * Создать приватный канал (group)
   * @returns {{ _id, name }} объект созданной группы
   */
  async createGroup({ name, members = [], readOnly = false, topic = '', description = '' }) {
    const res = await this._http.post('/groups.create', {
      name,
      members,
      readOnly,
      extraData: { topic, description },
    });

    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
    return res.data.group;
  }

  /**
   * Добавить пользователя в публичный канал
   */
  async inviteToChannel(roomId, userId) {
    const res = await this._http.post('/channels.invite', { roomId, userId });
    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
  }

  /**
   * Добавить пользователя в приватный канал
   */
  async inviteToGroup(roomId, userId) {
    const res = await this._http.post('/groups.invite', { roomId, userId });
    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
  }

  /**
   * Установить аватар (обложку) канала/группы
   * @param {string}  roomId      — ID комнаты
   * @param {Buffer}  imageBuffer — бинарные данные изображения
   * @param {string}  ext         — расширение файла (png, jpg, gif…)
   * @param {boolean} isPrivate   — true для приватных групп
   */
  async setRoomAvatar(roomId, imageBuffer, ext, isPrivate = false) {
    const form = new FormData();
    form.append('roomId', roomId);
    form.append('image', imageBuffer, {
      filename:    `avatar.${ext}`,
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    });

    // Rocket.Chat REST API endpoint для установки аватара комнаты
    // Работает начиная с RC версии 3.6+
    const endpoint = isPrivate ? '/groups.setAvatar' : '/channels.setAvatar';

    const res = await this._http.post(endpoint, form, {
      headers:          form.getHeaders(),
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
    });

    if (!res.data?.success) {
      throw new Error(res.data?.error ?? `HTTP ${res.status}`);
    }
    return res.data;
  }
}

module.exports = RocketChatClient;