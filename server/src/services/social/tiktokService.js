const { query } = require('../../config/database');

const PLATFORM = 'tiktok';

function isConfigured() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  return Boolean(clientKey && clientSecret && clientKey.trim() !== '' && clientSecret.trim() !== '');
}

async function getStatus(userId) {
  const accountRes = await query(
    'SELECT id, username, display_name, profile_url, avatar_url, updated_at FROM social_accounts WHERE user_id = $1 AND platform = $2',
    [userId, PLATFORM]
  );

  if (accountRes.rows.length > 0) {
    const account = accountRes.rows[0];
    return {
      platform: PLATFORM,
      displayName: 'TikTok',
      status: 'CONNECTED',
      message: 'Connected via official TikTok API.',
      connected: true,
      account: {
        id: account.id,
        username: account.username,
        displayName: account.display_name,
        profileUrl: account.profile_url,
        avatarUrl: account.avatar_url,
        updatedAt: account.updated_at
      }
    };
  }

  if (!isConfigured()) {
    return {
      platform: PLATFORM,
      displayName: 'TikTok',
      status: 'NOT_CONFIGURED',
      message: 'TikTok Login Kit not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in server/.env.',
      connected: false
    };
  }

  return {
    platform: PLATFORM,
    displayName: 'TikTok',
    status: 'NOT_CONNECTED',
    message: 'Ready to connect via official TikTok Login Kit.',
    connected: false
  };
}

async function connect(userId, { code, redirectUri } = {}) {
  if (!isConfigured()) {
    return {
      status: 'NOT_CONFIGURED',
      error: 'Integration not configured',
      message: 'Official TikTok API credentials are not configured in server/.env.'
    };
  }

  if (!code) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const callback = redirectUri || process.env.TIKTOK_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/accounts`;
    const scopes = 'user.info.basic,video.list';
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scopes)}&response_type=code&redirect_uri=${encodeURIComponent(callback)}`;
    return {
      status: 'OAUTH_REDIRECT',
      authUrl
    };
  }

  try {
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || process.env.TIKTOK_REDIRECT_URI
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.data?.access_token) {
      return { status: 'API_UNAVAILABLE', error: tokenData.error?.message || 'Failed to exchange TikTok code.' };
    }

    const upsertRes = await query(`
      INSERT INTO social_accounts (
        user_id, platform, platform_user_id, access_token_encrypted, refresh_token_encrypted, scopes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET access_token_encrypted = EXCLUDED.access_token_encrypted,
          refresh_token_encrypted = COALESCE(EXCLUDED.refresh_token_encrypted, social_accounts.refresh_token_encrypted),
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, platform, username, display_name, updated_at;
    `, [
      userId,
      PLATFORM,
      tokenData.data.open_id || 'unknown',
      tokenData.data.access_token,
      tokenData.data.refresh_token || null,
      JSON.stringify(['user.info.basic', 'video.list'])
    ]);

    return { status: 'CONNECTED', account: upsertRes.rows[0] };
  } catch (err) {
    return { status: 'API_UNAVAILABLE', error: err.message };
  }
}

async function getProfile(userId) {
  const status = await getStatus(userId);
  if (!status.connected) return { status: status.status, profile: null };
  return { status: 'CONNECTED', profile: status.account };
}

async function getRecentContent(userId) {
  const status = await getStatus(userId);
  if (!status.connected) return { status: status.status, posts: [] };

  try {
    const accRes = await query('SELECT access_token_encrypted FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
    if (accRes.rows.length === 0) return { status: 'NOT_CONNECTED', posts: [] };

    const token = accRes.rows[0].access_token_encrypted;
    const res = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,create_time,share_url', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ max_count: 10 })
    });
    const data = await res.json();
    if (!res.ok || !data.data?.videos) {
      return { status: 'API_UNAVAILABLE', posts: [], message: 'TikTok API request failed' };
    }

    if (data.data.videos.length === 0) return { status: 'NO_CONTENT', posts: [] };

    return {
      status: 'CONNECTED',
      posts: data.data.videos.map(v => ({
        platform: 'TikTok',
        platform_post_id: v.id,
        content_type: 'Short Video',
        caption: v.video_description || v.title || '',
        post_date: new Date(v.create_time * 1000).toISOString(),
        url: v.share_url
      }))
    };
  } catch (err) {
    return { status: 'API_UNAVAILABLE', posts: [], error: err.message };
  }
}

async function disconnect(userId) {
  await query('DELETE FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  return { status: 'NOT_CONNECTED', message: 'TikTok account disconnected successfully' };
}

module.exports = {
  platform: PLATFORM,
  isConfigured,
  getStatus,
  connect,
  getProfile,
  getRecentContent,
  disconnect
};
