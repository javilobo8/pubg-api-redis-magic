/* eslint-disable no-cond-assign */
const request = require('superagent');

const MAGIC = /var (seasonInfo|playerData) = (.*);/g;

function SearchPlayer(config) {
  function extractData(html) {
    const output = {};
    let match;

    while (match = MAGIC.exec(html)) {
      if (match) {
        const [, dataType, data] = match;
        try {
          output[dataType] = JSON.parse(data);
        } catch (error) {
          console.error(`Error parsing ${dataType} =>`, data);
          throw error;
        }
      }
    }

    return output;
  }

  function requestData(playerName) {
    const url = [config.host, config.path, playerName].join('/');
    const requestTime = Date.now();

    return request(url)
      .then((response) => extractData(response.text))
      .then((data) => Object.assign(data, {time: Date.now() - requestTime}));
  }

  return requestData;
}

module.exports = SearchPlayer;
