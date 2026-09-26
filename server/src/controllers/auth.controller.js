const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { registerSchema, loginSchema } = require('../schemas/validation.schemas');

const JWT_SECRET = process.env.JWT_SECRET || 'creator_calendar_jwt_secret_secure_key_987654321';

async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);

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
      RETURNING id, name, email, created_at;
    `, [validated.name, validated.email.toLowerCase(), passwordHash]);

    const user = userRes.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

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
    const isMatch = await bcrypt.compare(validated.password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  // Stateless JWT logout is handled on client by clearing token
  res.json({
    message: 'Logged out successfully'
  });
}

async function getCurrentUser(req, res, next) {
  try {
    const userRes = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
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

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
