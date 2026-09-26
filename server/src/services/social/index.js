const instagramService = require('./instagramService');
const youtubeService = require('./youtubeService');
const tiktokService = require('./tiktokService');
const linkedinService = require('./linkedinService');
const facebookService = require('./facebookService');

const adapters = {
  instagram: instagramService,
  youtube: youtubeService,
  tiktok: tiktokService,
  linkedin: linkedinService,
  facebook: facebookService
};

function getAdapter(platform) {
  if (!platform) return null;
  const key = platform.toLowerCase().trim();
  return adapters[key] || null;
}

async function getAllStatuses(userId) {
  const platforms = Object.keys(adapters);
  const statuses = await Promise.all(
    platforms.map(async (plat) => {
      try {
        return await adapters[plat].getStatus(userId);
      } catch (err) {
        return {
          platform: plat,
          displayName: plat.charAt(0).toUpperCase() + plat.slice(1),
          status: 'API_UNAVAILABLE',
          message: err.message,
          connected: false
        };
      }
    })
  );
  return statuses;
}

async function getAllConnectedContent(userId) {
  const platforms = Object.keys(adapters);
  const results = await Promise.all(
    platforms.map(async (plat) => {
      try {
        const status = await adapters[plat].getStatus(userId);
        if (status.connected) {
          const content = await adapters[plat].getRecentContent(userId);
          return content.posts || [];
        }
        return [];
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

module.exports = {
  adapters,
  getAdapter,
  getAllStatuses,
  getAllConnectedContent
};
