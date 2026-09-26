const { query } = require('../../config/database');

const PLATFORM = 'instagram';

function isConfigured() {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  return Boolean(clientId && clientSecret && clientId.trim() !== '' && clientSecret.trim() !== '');
}

async function getStatus(userId) {
  const configured = isConfigured();

  const accountRes = await query(
    'SELECT id, username, display_name, profile_url, avatar_url, updated_at FROM social_accounts WHERE user_id = $1 AND platform = $2',
    [userId, PLATFORM]
  );

  if (accountRes.rows.length > 0) {
    const account = accountRes.rows[0];
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', account.id);
    console.log('[CC DEBUG] username:', account.username);
    console.log('[CC DEBUG] connectionStatus:', 'CONNECTED');
    console.log('[CC DEBUG] API configured:', configured);

    return {
      platform: PLATFORM,
      displayName: 'Instagram',
      status: 'CONNECTED',
      message: configured ? 'Connected via official Instagram API.' : 'Connected to CreatorCalendar.',
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

  if (!configured) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', null);
    console.log('[CC DEBUG] username:', null);
    console.log('[CC DEBUG] connectionStatus:', 'NOT_CONFIGURED');
    console.log('[CC DEBUG] API configured:', false);

    return {
      platform: PLATFORM,
      displayName: 'Instagram',
      status: 'NOT_CONFIGURED',
      message: "Instagram data integration isn't configured yet.",
      connected: false
    };
  }

  console.log('[CC DEBUG] platform:', PLATFORM);
  console.log('[CC DEBUG] socialAccountId:', null);
  console.log('[CC DEBUG] username:', null);
  console.log('[CC DEBUG] connectionStatus:', 'NOT_CONNECTED');
  console.log('[CC DEBUG] API configured:', true);

  return {
    platform: PLATFORM,
    displayName: 'Instagram',
    status: 'NOT_CONNECTED',
    message: 'Connect Instagram to import available content.',
    connected: false
  };
}

async function connect(userId, { code, redirectUri } = {}) {
  const configured = isConfigured();
  if (!configured) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] connectionStatus:', 'NOT_CONFIGURED');
    console.log('[CC DEBUG] API configured:', false);

    return {
      status: 'NOT_CONFIGURED',
      error: 'Integration not configured',
      message: "Instagram data integration isn't configured yet."
    };
  }

  if (!code) {
    // Return OAuth initiation URL
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const callback = redirectUri || process.env.INSTAGRAM_REDIRECT_URI || `${process.env.CLIENT_URL || 'http://localhost:5173'}/accounts`;
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callback)}&scope=user_profile,user_media&response_type=code`;
    return {
      status: 'OAUTH_REDIRECT',
      authUrl
    };
  }

  // Official OAuth token exchange (when official credentials provided)
  try {
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || process.env.INSTAGRAM_REDIRECT_URI,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.log('[CC DEBUG] platform:', PLATFORM);
      console.log('[CC DEBUG] API response status:', tokenRes.status);
      console.log('[CC DEBUG] connectionStatus:', 'API_ERROR');
      return {
        status: 'API_ERROR',
        error: tokenData.error_message || 'Instagram API encountered an error.'
      };
    }

    // Upsert into social_accounts
    const upsertRes = await query(`
      INSERT INTO social_accounts (
        user_id, platform, platform_user_id, access_token_encrypted, scopes
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, platform) DO UPDATE
      SET platform_user_id = EXCLUDED.platform_user_id,
          access_token_encrypted = EXCLUDED.access_token_encrypted,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, platform, username, display_name, updated_at;
    `, [userId, PLATFORM, String(tokenData.user_id), tokenData.access_token, JSON.stringify(['user_profile', 'user_media'])]);

    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', upsertRes.rows[0].id);
    console.log('[CC DEBUG] connectionStatus:', 'CONNECTED');

    return {
      status: 'CONNECTED',
      account: upsertRes.rows[0]
    };
  } catch (err) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] connectionStatus:', 'API_ERROR');
    return {
      status: 'API_ERROR',
      error: 'Instagram API encountered an error.'
    };
  }
}

async function getProfile(userId) {
  const status = await getStatus(userId);
  if (!status.connected) {
    return { status: status.status, profile: null };
  }
  return { status: 'CONNECTED', profile: status.account };
}

async function getRecentContent(userId, { syncToProfile = true } = {}) {
  const configured = isConfigured();
  if (!configured) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', null);
    console.log('[CC DEBUG] username:', null);
    console.log('[CC DEBUG] connectionStatus:', 'NOT_CONFIGURED');
    console.log('[CC DEBUG] API configured:', false);
    console.log('[CC DEBUG] API response status:', 'N/A');
    console.log('[CC DEBUG] retrieved media count:', 0);
    console.log('[CC DEBUG] normalized media count:', 0);
    console.log('[CC DEBUG] database inserted count:', 0);

    return {
      status: 'NOT_CONFIGURED',
      posts: [],
      message: "Instagram data integration isn't configured yet."
    };
  }

  const accRes = await query('SELECT id, username, access_token_encrypted, platform_user_id FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  if (accRes.rows.length === 0) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', null);
    console.log('[CC DEBUG] username:', null);
    console.log('[CC DEBUG] connectionStatus:', 'NOT_CONNECTED');
    console.log('[CC DEBUG] API configured:', true);
    console.log('[CC DEBUG] API response status:', 'N/A');
    console.log('[CC DEBUG] retrieved media count:', 0);
    console.log('[CC DEBUG] normalized media count:', 0);
    console.log('[CC DEBUG] database inserted count:', 0);

    return {
      status: 'NOT_CONNECTED',
      posts: [],
      message: 'Connect Instagram to import available content.'
    };
  }

  const account = accRes.rows[0];
  const { access_token_encrypted } = account;

  // Official Graph API request
  try {
    const mediaRes = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${access_token_encrypted}`);
    const mediaData = await mediaRes.json();

    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] socialAccountId:', account.id);
    console.log('[CC DEBUG] username:', account.username);
    console.log('[CC DEBUG] API configured:', true);
    console.log('[CC DEBUG] API response status:', mediaRes.status);

    if (!mediaRes.ok || !mediaData.data) {
      console.log('[CC DEBUG] connectionStatus:', 'API_ERROR');
      console.log('[CC DEBUG] retrieved media count:', 0);
      console.log('[CC DEBUG] normalized media count:', 0);
      console.log('[CC DEBUG] database inserted count:', 0);

      return {
        status: 'API_ERROR',
        posts: [],
        message: 'Instagram API encountered an error.'
      };
    }

    const retrievedCount = mediaData.data.length;
    console.log('[CC DEBUG] retrieved media count:', retrievedCount);

    if (retrievedCount === 0) {
      console.log('[CC DEBUG] connectionStatus:', 'NO_CONTENT');
      console.log('[CC DEBUG] normalized media count:', 0);
      console.log('[CC DEBUG] database inserted count:', 0);

      return {
        status: 'NO_CONTENT',
        posts: [],
        message: 'Instagram is connected, but no accessible posts were returned.'
      };
    }

    const normalized = mediaData.data.map(m => ({
      platform: 'Instagram',
      platform_post_id: m.id,
      content_type: m.media_type === 'VIDEO' ? 'Reel' : (m.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Image'),
      caption: m.caption || '',
      post_date: m.timestamp,
      url: m.permalink,
      likes: null,
      comments: null
    }));

    const normalizedCount = normalized.length;
    console.log('[CC DEBUG] normalized media count:', normalizedCount);

    let insertedCount = 0;
    if (syncToProfile) {
      const profileRes = await query(
        'SELECT id FROM social_profiles WHERE user_id = $1 AND LOWER(platform) = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, PLATFORM]
      );
      if (profileRes.rows.length > 0) {
        const profileId = profileRes.rows[0].id;
        for (const post of normalized) {
          const ins = await query(`
            INSERT INTO profile_posts (
              profile_id, user_id, post_date, platform, content_type,
              caption, hashtags, likes, comments, views, reach, engagement_rate, cta, is_demo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id;
          `, [
            profileId,
            userId,
            post.post_date ? new Date(post.post_date) : new Date(),
            'Instagram',
            post.content_type,
            post.caption,
            JSON.stringify([]),
            null,
            null,
            null,
            null,
            null,
            '',
            false
          ]);
          if (ins.rows.length > 0) insertedCount++;
        }
      }
    }

    console.log('[CC DEBUG] database inserted count:', insertedCount);
    console.log('[CC DEBUG] connectionStatus:', 'CONNECTED_WITH_CONTENT');

    return {
      status: 'CONNECTED_WITH_CONTENT',
      message: `${normalizedCount} post${normalizedCount === 1 ? '' : 's'} available`,
      posts: normalized,
      count: normalizedCount
    };
  } catch (err) {
    console.log('[CC DEBUG] platform:', PLATFORM);
    console.log('[CC DEBUG] connectionStatus:', 'API_ERROR');
    console.log('[CC DEBUG] retrieved media count:', 0);
    console.log('[CC DEBUG] normalized media count:', 0);
    console.log('[CC DEBUG] database inserted count:', 0);

    return {
      status: 'API_ERROR',
      posts: [],
      message: 'Instagram API encountered an error.'
    };
  }
}

async function disconnect(userId) {
  await query('DELETE FROM social_accounts WHERE user_id = $1 AND platform = $2', [userId, PLATFORM]);
  return { status: 'NOT_CONNECTED', message: 'Connect Instagram to import available content.' };
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
