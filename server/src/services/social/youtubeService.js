const { query } = require('../../config/database');

const PLATFORM = 'youtube';

function isConfigured() {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId.trim() !== '' && clientSecret.trim() !== '');
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
      displayName: 'YouTube',
      status: 'CONNECTED',
      message: 'Connected via official YouTube API.',
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
      displayName: 'YouTube',
      status: 'NOT_CONFIGURED',
      message: 'YouTube Data API v3 not configured. Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in server/.env.',
      connected: false
    };
  }

  return {
    platform: PLATFORM,
    displayName: 'YouTube',
    status: 'NOT_CONNECTED',
    message: 'Ready to connect via official Google / YouTube Data API v3.',
    connected: false
  };
}

async function connect(userId, { code, redirectUri } = {}) {
  if (!isConfigured()) {
    return {
      status: 'NOT_CONFIGURED',
      error: 'Integration not configured',
      message: 'Official YouTube API credentials are not configured in server/.env.'
    };
  }

  if (!code) {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const callback = redirectUri || process.env.YOUTUBE_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/accounts`;
    const scopes = 'https://www.googleapis.com/auth/youtube.readonly';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
    return {
      status: 'OAUTH_REDIRECT',
      authUrl
    };
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || process.env.YOUTUBE_REDIRECT_URI,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return {
        status: 'API_UNAVAILABLE',
        error: tokenData.error_description || 'Failed to exchange YouTube authorization code.'
      };
    }

    const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0]?.snippet;

    const upsertRes = await query(`
      INSERT INTO social_accounts (
        user_id, platform, platform_user_id, username, display_name, profile_url, avatar_url, access_token_encrypted, refresh_token_encrypted, scopes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          profile_url = EXCLUDED.profile_url,
          avatar_url = EXCLUDED.avatar_url,
          access_token_encrypted = EXCLUDED.access_token_encrypted,
          refresh_token_encrypted = COALESCE(EXCLUDED.refresh_token_encrypted, social_accounts.refresh_token_encrypted),
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, platform, username, display_name, updated_at;
    `, [
      userId,
      PLATFORM,
      channelData.items?.[0]?.id || 'unknown',
      channel?.customUrl || channel?.title || 'YouTube Channel',
      channel?.title || 'YouTube Creator',
      `https://youtube.com/${channel?.customUrl || ''}`,
      channel?.thumbnails?.default?.url || null,
      tokenData.access_token,
      tokenData.refresh_token || null,
      JSON.stringify(['youtube.readonly'])
    ]);

    return {
      status: 'CONNECTED',
      account: upsertRes.rows[0]
    };
  } catch (err) {
    return {
      status: 'API_UNAVAILABLE',
      error: err.message
    };
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
    const searchRes = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=10&order=date', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchData = await searchRes.json();

    if (!searchRes.ok || !searchData.items) {
      return { status: 'API_UNAVAILABLE', posts: [], message: 'YouTube API request failed' };
    }

    if (searchData.items.length === 0) return { status: 'NO_CONTENT', posts: [] };

    return {
      status: 'CONNECTED',
      posts: searchData.items.map(v => ({
        platform: 'YouTube',
        platform_post_id: v.id?.videoId,
        content_type: 'Video',
        caption: v.snippet?.description || v.snippet?.title || '',
        title: v.snippet?.title,
        post_date: v.snippet?.publishedAt,
        url: `https://youtube.com/watch?v=${v.id?.videoId}`
      }))
    };
  } catch (err) {
    return { status: 'API_UNAVAILABLE', posts: [], error: err.message };
  }
}

async function disconnect(userId) {
  await query('DELETE FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  return { status: 'NOT_CONNECTED', message: 'YouTube account disconnected successfully' };
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
