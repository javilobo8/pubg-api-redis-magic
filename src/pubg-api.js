const request = require('superagent');
const Magic = require('./magic');
const Cache = require('./cache');
const Profile = require('./profile');

class PubgAPI {
  constructor(config) {
    this.config = config;
    this.redisPrefix = 'PUBG::';
    this.apiURL = 'https://pubgtracker.com/api/profile/pc/';
    this.token = config.token;
    this.initialize();
  }

  initialize() {
    this.cache = Cache(this.config.redis);
    this.magic = Magic(this.config.magic);
  }

  async getFromApi(playerName) {
    const apiURL = this.apiURL + playerName;
    const response = await request.get(apiURL).set('TRN-Api-Key', this.token);
    return response.body;
  }

  async getMagic(playerName) {
    const data = await this.magic(playerName);
    return data.playerData;
  }

  async getProfileByNickname(nickname) {
    const playerName = encodeURIComponent(String(nickname).toLowerCase().replace(/\s/g, ''));
    const cacheKey = this.redisPrefix + playerName;

    let data;

    data = await this.cache.get(cacheKey);

    if (!data) {
      data = await this.getFromApi(playerName);
      if (!data || data.error) {
        data = await this.getMagic(playerName);
      }

      if (data) {
        this.cache.set(cacheKey, JSON.stringify(data));
      }
    } else {
      data = JSON.parse(data);
    }

    return new Profile(data);
  }
}

module.exports = PubgAPI;
