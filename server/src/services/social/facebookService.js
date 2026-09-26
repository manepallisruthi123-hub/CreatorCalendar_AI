const { query } = require('../../config/database');

const PLATFORM = 'facebook';

function isConfigured() {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  return Boolean(appId && appSecret && appId.trim() !== '' && appSecret.trim() !== '');
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
      displayName: 'Facebook',
      status: 'CONNECTED',
      message: 'Connected via official Facebook API.',
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
      displayName: 'Facebook',
      status: 'NOT_CONFIGURED',
      message: 'Facebook Graph API not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in server/.env.',
      connected: false
    };
  }

  return {
    platform: PLATFORM,
    displayName: 'Facebook',
    status: 'NOT_CONNECTED',
    message: 'Ready to connect via official Facebook Graph API.',
    connected: false
  };
}

async function connect(userId, { code, redirectUri } = {}) {
  if (!isConfigured()) {
    return {
      status: 'NOT_CONFIGURED',
      error: 'Integration not configured',
      message: 'Official Facebook API credentials are not configured in server/.env.'
    };
  }

  if (!code) {
    const appId = process.env.FACEBOOK_APP_ID;
    const callback = redirectUri || process.env.FACEBOOK_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/accounts`;
    const scopes = 'public_profile,pages_show_list,pages_read_engagement';
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callback)}&scope=${encodeURIComponent(scopes)}`;
    return {
      status: 'OAUTH_REDIRECT',
      authUrl
    };
  }

  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri || process.env.FACEBOOK_REDIRECT_URI)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return { status: 'API_UNAVAILABLE', error: tokenData.error?.message || 'Failed to exchange Facebook code.' };
    }

    const meRes = await fetch(`https://graph.facebook.com/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
    const meData = await meRes.json();

    const upsertRes = await query(`
      INSERT INTO social_accounts (
        user_id, platform, platform_user_id, username, display_name, avatar_url, access_token_encrypted, scopes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          access_token_encrypted = EXCLUDED.access_token_encrypted,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, platform, username, display_name, updated_at;
    `, [
      userId,
      PLATFORM,
      meData.id || 'facebook_user',
      meData.name || 'Facebook User',
      meData.name || 'Facebook Page/User',
      meData.picture?.data?.url || null,
      tokenData.access_token,
      JSON.stringify(['public_profile', 'pages_show_list', 'pages_read_engagement'])
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
    const accRes = await query('SELECT access_token_encrypted, platform_user_id FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
    if (accRes.rows.length === 0) return { status: 'NOT_CONNECTED', posts: [] };

    const { access_token_encrypted } = accRes.rows[0];
    const res = await fetch(`https://graph.facebook.com/me/posts?fields=id,message,created_time,permalink_url&limit=10&access_token=${access_token_encrypted}`);
    const data = await res.json();

    if (!res.ok || !data.data) {
      return { status: 'API_UNAVAILABLE', posts: [], message: data.error?.message || 'Facebook API request failed' };
    }

    if (data.data.length === 0) return { status: 'NO_CONTENT', posts: [] };

    return {
      status: 'CONNECTED',
      posts: data.data.map(p => ({
        platform: 'Facebook',
        platform_post_id: p.id,
        content_type: 'Post',
        caption: p.message || '',
        post_date: p.created_time,
        url: p.permalink_url
      }))
    };
  } catch (err) {
    return { status: 'API_UNAVAILABLE', posts: [], error: err.message };
  }
}

async function disconnect(userId) {
  await query('DELETE FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  return { status: 'NOT_CONNECTED', message: 'Facebook account disconnected successfully' };
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
