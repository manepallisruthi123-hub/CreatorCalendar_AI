const { query } = require('../config/database');

async function getCampaigns(req, res, next) {
  try {
    const { profile_id } = req.query;
    let sql = 'SELECT * FROM campaigns WHERE user_id = $1';
    const params = [req.user.id];

    if (profile_id) {
      sql += ' AND profile_id = $2';
      params.push(profile_id);
    }
    sql += ' ORDER BY created_at DESC;';

    const result = await query(sql, params);
    res.json({ campaigns: result.rows });
  } catch (err) {
    next(err);
  }
}

async function createCampaign(req, res, next) {
  try {
    const { profile_id, name, objective, start_date, end_date, status } = req.body;
    if (!profile_id || !name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id, name, start_date, and end_date are required' });
    }

    // Check profile ownership
    const check = await query('SELECT id FROM social_profiles WHERE id = $1 AND user_id = $2', [profile_id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Profile not found' });
    }

    const insertRes = await query(`
      INSERT INTO campaigns (profile_id, user_id, name, objective, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [profile_id, req.user.id, name, objective || '', start_date, end_date, status || 'ACTIVE']);

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: insertRes.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

async function getCampaignById(req, res, next) {
  try {
    const result = await query('SELECT * FROM campaigns WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
    }
    res.json({ campaign: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function updateCampaign(req, res, next) {
  try {
    const { name, objective, start_date, end_date, status } = req.body;
    const campaignId = req.params.id;

    const result = await query(`
      UPDATE campaigns
      SET
        name = COALESCE($1, name),
        objective = COALESCE($2, objective),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *;
    `, [name, objective, start_date, end_date, status, campaignId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
    }

    res.json({ message: 'Campaign updated', campaign: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteCampaign(req, res, next) {
  try {
    const result = await query('DELETE FROM campaigns WHERE id = $1 AND user_id = $2 RETURNING id;', [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  deleteCampaign
};
