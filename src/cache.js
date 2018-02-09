const redis = require('redis');
const Promise = require('bluebird');

function Cache(config) {
  if (!config) {
    return {
      get: () => Promise.resolve(),
      set: () => Promise.resolve(),
    };
  }

  const client = redis.createClient(config);
  const expiration = config.expiration || 500;

  function get(key) {
    return new Promise((resolve, reject) => {
      client.get(key, (err, content) => {
        if (err) reject(err);
        resolve(content);
      });
    });
  }

  function set(key, value) {
    return new Promise((resolve, reject) => {
      client.setex(key, expiration, value, (err) => {
        if (err) reject(err);
        resolve({key, value});
      });
    });
  }

  return {get, set};
}

module.exports = Cache;
