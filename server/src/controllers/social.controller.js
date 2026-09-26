const { getAllStatuses, getAdapter, getAllConnectedContent } = require('../services/social');
const { query } = require('../config/database');

async function getAccounts(req, res, next) {
  try {
    const statuses = await getAllStatuses(req.user.id);
    res.json({
      platforms: statuses
    });
  } catch (err) {
    next(err);
  }
}

async function connectPlatform(req, res, next) {
  try {
    const { platform } = req.params;
    const adapter = getAdapter(platform);

    if (!adapter) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Platform '${platform}' is not supported. Supported platforms: instagram, youtube, tiktok, linkedin, facebook.`
      });
    }

    const { code, redirectUri, isDemo, username, displayName, profileUrl } = req.body;

    // Sandbox / Test connect mode for development or evaluation when API keys are not live
    if (isDemo || (!code && !adapter.isConfigured() && username)) {
      const cleanPlat = platform.toLowerCase();
      const demoUser = username || `${cleanPlat}_creator`;
      const demoName = displayName || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Creator`;
      const demoUrl = profileUrl || `https://${cleanPlat}.com/${demoUser}`;

      const upsertRes = await query(`
        INSERT INTO social_accounts (
          user_id, platform, platform_user_id, username, display_name, profile_url, scopes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, platform) DO UPDATE
        SET username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            profile_url = EXCLUDED.profile_url,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id, platform, username, display_name, profile_url, updated_at;
      `, [
        req.user.id,
        cleanPlat,
        `demo_${cleanPlat}_${req.user.id.slice(0, 8)}`,
        demoUser,
        demoName,
        demoUrl,
        JSON.stringify(['read_demo', 'content_preview'])
      ]);

      return res.status(200).json({
        status: 'CONNECTED',
        message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully (Sandbox/Demo mode).`,
        account: upsertRes.rows[0]
      });
    }

    // Official OAuth initiation or exchange
    const result = await adapter.connect(req.user.id, { code, redirectUri });
    return res.status(result.status === 'API_UNAVAILABLE' ? 502 : 200).json(result);
  } catch (err) {
    next(err);
  }
}

async function disconnectPlatform(req, res, next) {
  try {
    const { platform } = req.params;
    const adapter = getAdapter(platform);

    if (!adapter) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Platform '${platform}' is not supported.`
      });
    }

    const result = await adapter.disconnect(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getPlatformContent(req, res, next) {
  try {
    const { platform } = req.params;

    if (platform) {
      const adapter = getAdapter(platform);
      if (!adapter) {
        return res.status(400).json({ error: 'Bad Request', message: `Platform '${platform}' is not supported.` });
      }
      const result = await adapter.getRecentContent(req.user.id);
      return res.json(result);
    }

    const allContent = await getAllConnectedContent(req.user.id);
    return res.json({ posts: allContent, count: allContent.length });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAccounts,
  connectPlatform,
  disconnectPlatform,
  getPlatformContent
};
