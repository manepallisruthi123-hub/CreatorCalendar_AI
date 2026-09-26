const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { registerSchema, loginSchema } = require('../schemas/validation.schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'creator_calendar_jwt_secret_secure_key_987654321';

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
}

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);

    if (req.body.confirmPassword && req.body.confirmPassword !== validated.password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [validated.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A user with this email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validated.password, salt);

    const userRes = await query(`
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, avatar_url, created_at;
    `, [validated.name, validated.email.toLowerCase(), passwordHash]);

    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);

    const userRes = await query('SELECT * FROM users WHERE email = $1', [validated.email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const user = userRes.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'This account was registered with Google. Please click "Continue with Google".'
      });
    }

    const isMatch = await bcrypt.compare(validated.password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.json({
    message: 'Logged out successfully'
  });
}

async function getCurrentUser(req, res, next) {
  try {
    const userRes = await query('SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }
    res.json({
      user: userRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function googleAuthInit(req, res) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
    return res.redirect(`${clientUrl}/login?error=google_not_configured&message=${encodeURIComponent('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env or sign in with email.')}`);
  }

  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function googleAuthCallback(req, res, next) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${clientUrl}/login?error=oauth_failed&message=${encodeURIComponent(error || 'Google login cancelled or failed.')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return res.redirect(`${clientUrl}/login?error=oauth_token_exchange&message=${encodeURIComponent('Failed to exchange code with Google.')}`);
    }

    // 2. Fetch profile from Google UserInfo endpoint
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });

    const profileData = await profileRes.json();
    if (!profileRes.ok || !profileData.email) {
      console.error('Google profile fetch failed:', profileData);
      return res.redirect(`${clientUrl}/login?error=oauth_profile_fetch&message=${encodeURIComponent('Failed to retrieve user profile from Google.')}`);
    }

    const email = profileData.email.toLowerCase();
    const name = profileData.name || profileData.given_name || email.split('@')[0];
    const googleId = profileData.sub;
    const avatarUrl = profileData.picture || null;

    // 3. Find or create user
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      await query(`
        UPDATE users
        SET google_id = COALESCE(google_id, $1),
            avatar_url = COALESCE(avatar_url, $2)
        WHERE id = $3
      `, [googleId, avatarUrl, user.id]);
    } else {
      const newUser = await query(`
        INSERT INTO users (name, email, google_id, avatar_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, avatar_url, created_at;
      `, [name, email, googleId, avatarUrl]);
      user = newUser.rows[0];
    }

    // 4. Sign JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // 5. Set HttpOnly Cookie
    setAuthCookie(res, token);

    // 6. Redirect to dashboard with token query parameter so SPA client can hydrate state
    return res.redirect(`${clientUrl}/dashboard?token=${token}`);
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return res.redirect(`${clientUrl}/login?error=oauth_internal_error&message=${encodeURIComponent(err.message || 'Authentication error')}`);
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  googleAuthInit,
  googleAuthCallback
};
