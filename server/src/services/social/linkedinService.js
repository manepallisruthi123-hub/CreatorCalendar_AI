const { query } = require('../../config/database');

const PLATFORM = 'linkedin';

function isConfigured() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
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
      displayName: 'LinkedIn',
      status: 'CONNECTED',
      message: 'Connected via official LinkedIn API.',
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
      displayName: 'LinkedIn',
      status: 'NOT_CONFIGURED',
      message: 'LinkedIn OAuth integration not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in server/.env.',
      connected: false
    };
  }

  return {
    platform: PLATFORM,
    displayName: 'LinkedIn',
    status: 'NOT_CONNECTED',
    message: 'Ready to connect via official LinkedIn OAuth 2.0 API.',
    connected: false
  };
}

async function connect(userId, { code, redirectUri } = {}) {
  if (!isConfigured()) {
    return {
      status: 'NOT_CONFIGURED',
      error: 'Integration not configured',
      message: 'Official LinkedIn API credentials are not configured in server/.env.'
    };
  }

  if (!code) {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const callback = redirectUri || process.env.LINKEDIN_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/accounts`;
    const scopes = 'openid profile email w_member_social';
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&scope=${encodeURIComponent(scopes)}`;
    return {
      status: 'OAUTH_REDIRECT',
      authUrl
    };
  }

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri || process.env.LINKEDIN_REDIRECT_URI
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return { status: 'API_UNAVAILABLE', error: tokenData.error_description || 'Failed to exchange LinkedIn code.' };
    }

    // Fetch basic profile
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();

    const upsertRes = await query(`
      INSERT INTO social_accounts (
        user_id, platform, platform_user_id, username, display_name, avatar_url, access_token_encrypted, token_expires_at, scopes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '60 days', $8)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          access_token_encrypted = EXCLUDED.access_token_encrypted,
          token_expires_at = EXCLUDED.token_expires_at,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, platform, username, display_name, updated_at;
    `, [
      userId,
      PLATFORM,
      profileData.sub || 'linkedin_user',
      profileData.email || profileData.name || 'LinkedIn User',
      profileData.name || 'LinkedIn Creator',
      profileData.picture || null,
      tokenData.access_token,
      JSON.stringify(['openid', 'profile', 'email', 'w_member_social'])
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

    const { access_token_encrypted, platform_user_id } = accRes.rows[0];
    const res = await fetch(`https://api.linkedin.com/rest/posts?author=urn:li:person:${platform_user_id}&q=author&count=10`, {
      headers: {
        Authorization: `Bearer ${access_token_encrypted}`,
        'LinkedIn-Version': '202312',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!res.ok) {
      // In LinkedIn API, user posts often requires specific marketing/content permissions
      return { status: 'NO_CONTENT', posts: [], message: 'No posts retrieved from LinkedIn or permission restricted' };
    }

    const data = await res.json();
    if (!data.elements || data.elements.length === 0) {
      return { status: 'NO_CONTENT', posts: [] };
    }

    return {
      status: 'CONNECTED',
      posts: data.elements.map(p => ({
        platform: 'LinkedIn',
        platform_post_id: p.id,
        content_type: 'Post',
        caption: p.commentary || '',
        post_date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString()
      }))
    };
  } catch (err) {
    return { status: 'API_UNAVAILABLE', posts: [], error: err.message };
  }
}

async function disconnect(userId) {
  await query('DELETE FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  return { status: 'NOT_CONNECTED', message: 'LinkedIn account disconnected successfully' };
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
