const {MODE, SEASON, REGION} = require('./constants');
const {values} = require('lodash');

function formatProperty(prop) {
  const str = String(prop).replace(/\s/g, '');
  return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
}

class Profile {
  constructor(content) {
    this.content = content;
    this.currentSeason = content.defaultSeason;
    this.currentSeasonLabel = content.seasonDisplay;
    this.lastUpdated = content.LastUpdated;
    this.defaultRegion = content.selectedRegion;
    this.defaultSeason = content.defaultSeason;
    this.playerName = content.PlayerName;
    this.avatar = content.Avatar;
    this.stats = content.Stats;
    this.matchHistory = content.MatchHistory;

    // if (!this.stats) {
    //   throw new StatsNotFound();
    // }
  }

  getStats(options = {}, tiny) {
    const {
      region = this.defaultRegion,
      season = this.defaultSeason,
      mode = MODE.DEFAULT,
    } = options;

    const selectedStats = this.stats.find((stat) => (
      stat.Region === region
      && stat.Season === season
      && stat.Match === mode
    ));

    // if (!selectedStats) {
    //   throw new StatsNotFound();
    // }

    let data = {};

    if (!tiny) {
      data.region = region;
      data.defaultRegion = this.defaultRegion;
      data.season = season;
      data.defaultSeason = this.defaultSeason;
      data.mode = mode;
      data.lastUpdated = this.lastUpdated;
      data.playerName = this.playerName;
      data.avatar = this.avatar;
    }

    const rankData = {};

    data = selectedStats.Stats.reduce((curr, entry) => {
      const stats = curr;
      const value = entry.ValueInt || entry.ValueDec || entry.value;

      const category = formatProperty(entry.category);
      const field = formatProperty(entry.field);

      if (!curr[category]) {
        stats[category] = {};
      }

      stats[category][field] = value;

      if (entry.rank) {
        rankData[field] = entry.rank;
      }

      return stats;
    }, data);

    data.rankData = rankData;

    return data;
  }

  getStatsForAllMatches(options = {}) {
    const {
      region = this.defaultRegion,
      season = this.defaultSeason,
    } = options;

    const modes = values(MODE);

    const data = {};

    modes.forEach((mode) => {
      try {
        const statsOptions = Object.assign({}, {mode}, {region, season});
        data[mode] = this.getStats(statsOptions);
      } catch (err) {
        data[mode] = null;
        console.log(`No matches for '${mode}' queue`);
      }
    });

    return data;
  }

  getFullStats() {
    const seasons = values(SEASON);
    const regions = values(REGION);
    const modes = values(MODE);

    const output = {};

    output.defaultRegion = this.defaultRegion;
    output.defaultSeason = this.defaultSeason;
    output.lastUpdated = this.lastUpdated;
    output.playerName = this.playerName;
    output.avatar = this.avatar;

    output.data = {};

    seasons.forEach((season) => {
      output.data[season] = {};

      regions.forEach((region) => {
        output.data[season][region] = {};

        modes.forEach((mode) => {
          try {
            output.data[season][region][mode] = this.getStats({season, region, mode}, true);
            // eslint-disable-next-line
          } catch (err) {}
        });

        if (Object.keys(output.data[season][region]).length === 0) {
          delete output.data[season][region];
        }
      });

      if (Object.keys(output.data[season]).length === 0) {
        delete output.data[season];
      }
    });

    return output;
  }
}

module.exports = Profile;
