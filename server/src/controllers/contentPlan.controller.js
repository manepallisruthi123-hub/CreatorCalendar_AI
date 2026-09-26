const { query } = require('../config/database');
const { generateCalendarPlan } = require('../services/calendar.service');

async function getContentPlans(req, res, next) {
  try {
    const profileId = req.query.profile_id;
    let sql = 'SELECT * FROM content_plans WHERE user_id = $1';
    const params = [req.user.id];

    if (profileId) {
      sql += ' AND profile_id = $2';
      params.push(profileId);
    }
    sql += ' ORDER BY week_start DESC, created_at DESC;';

    const result = await query(sql, params);
    res.json({ plans: result.rows });
  } catch (err) {
    next(err);
  }
}

async function triggerGeneratePlan(req, res, next) {
  try {
    const { profile_id, platform } = req.body;
    if (!profile_id) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id is required' });
    }

    const planData = await generateCalendarPlan(profile_id, req.user.id, platform);
    res.status(201).json({
      message: '7-Day Content Calendar generated successfully',
      plan: planData.plan,
      posts: planData.posts
    });
  } catch (err) {
    next(err);
  }
}

async function getContentPlanById(req, res, next) {
  try {
    const planRes = await query(
      'SELECT * FROM content_plans WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (planRes.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Content plan not found' });
    }

    const postsRes = await query(
      'SELECT * FROM posts WHERE plan_id = $1 AND user_id = $2 ORDER BY scheduled_date ASC',
      [req.params.id, req.user.id]
    );

    res.json({
      plan: planRes.rows[0],
      posts: postsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

async function deleteContentPlan(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM content_plans WHERE id = $1 AND user_id = $2 RETURNING id;',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Content plan not found' });
    }

    res.json({ message: 'Content plan deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getContentPlans,
  triggerGeneratePlan,
  getContentPlanById,
  deleteContentPlan
};
