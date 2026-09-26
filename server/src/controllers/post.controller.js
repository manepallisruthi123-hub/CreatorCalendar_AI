const { query } = require('../config/database');
const { postUpdateSchema, postStatusSchema } = require('../schemas/validation.schemas');

async function getPosts(req, res, next) {
  try {
    const { profile_id, status, content_type, platform, search, start_date, end_date } = req.query;

    let sql = 'SELECT p.*, sp.username, sp.niche FROM posts p JOIN social_profiles sp ON p.profile_id = sp.id WHERE p.user_id = $1';
    const params = [req.user.id];
    let idx = 2;

    if (profile_id) {
      sql += ` AND p.profile_id = $${idx}`;
      params.push(profile_id);
      idx++;
    }

    if (status) {
      sql += ` AND p.status = $${idx}`;
      params.push(status);
      idx++;
    }

    if (content_type) {
      sql += ` AND p.content_type = $${idx}`;
      params.push(content_type);
      idx++;
    }

    if (platform) {
      sql += ` AND p.platform = $${idx}`;
      params.push(platform);
      idx++;
    }

    if (start_date) {
      sql += ` AND p.scheduled_date >= $${idx}`;
      params.push(start_date);
      idx++;
    }

    if (end_date) {
      sql += ` AND p.scheduled_date <= $${idx}`;
      params.push(end_date);
      idx++;
    }

    if (search && search.trim().length > 0) {
      sql += ` AND (p.topic ILIKE $${idx} OR p.hook ILIKE $${idx} OR p.caption ILIKE $${idx})`;
      params.push(`%${search.trim()}%`);
      idx++;
    }

    sql += ' ORDER BY p.scheduled_date ASC, p.suggested_time ASC;';

    const result = await query(sql, params);
    res.json({ posts: result.rows, total: result.rowCount });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const {
      profile_id, plan_id, scheduled_date, platform, content_type,
      topic, hook, caption, hashtags, cta, goal, suggested_time, time_reason, status
    } = req.body;

    if (!profile_id || !scheduled_date || !topic || !content_type) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id, scheduled_date, topic, and content_type are required' });
    }

    // Verify profile ownership
    const profileCheck = await query('SELECT id FROM social_profiles WHERE id = $1 AND user_id = $2', [profile_id, req.user.id]);
    if (profileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const insertRes = await query(`
      INSERT INTO posts (
        profile_id, user_id, plan_id, scheduled_date, platform,
        content_type, topic, hook, caption, hashtags, cta,
        goal, suggested_time, time_reason, status, ai_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false)
      RETURNING *;
    `, [
      profile_id,
      req.user.id,
      plan_id || null,
      scheduled_date,
      platform || 'Instagram',
      content_type,
      topic,
      hook || '',
      caption || '',
      JSON.stringify(hashtags || []),
      cta || '',
      goal || 'Engagement',
      suggested_time || '19:00',
      time_reason || 'Custom scheduled time',
      status || 'DRAFT'
    ]);

    res.status(201).json({
      message: 'Post created successfully',
      post: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function getPostById(req, res, next) {
  try {
    const result = await query(`
      SELECT p.*, sp.username, sp.niche, sp.preferred_tone, sp.target_audience
      FROM posts p
      JOIN social_profiles sp ON p.profile_id = sp.id
      WHERE p.id = $1 AND p.user_id = $2;
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const validated = postUpdateSchema.parse(req.body);
    const postId = req.params.id;

    // Check ownership
    const check = await query('SELECT id FROM posts WHERE id = $1 AND user_id = $2', [postId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    Object.keys(validated).forEach(key => {
      if (validated[key] !== undefined) {
        if (key === 'hashtags') {
          updates.push(`${key} = $${idx}`);
          values.push(JSON.stringify(validated[key]));
        } else {
          updates.push(`${key} = $${idx}`);
          values.push(validated[key]);
        }
        idx++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(postId);
    values.push(req.user.id);

    const updateQuery = `
      UPDATE posts
      SET ${updates.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING *;
    `;

    const result = await query(updateQuery, values);
    res.json({ message: 'Post updated successfully', post: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updatePostStatus(req, res, next) {
  try {
    const validated = postStatusSchema.parse(req.body);
    const postId = req.params.id;

    const result = await query(`
      UPDATE posts
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *;
    `, [validated.status, postId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    res.json({ message: 'Post status updated', post: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id;',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  updatePostStatus,
  deletePost
};
