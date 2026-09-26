const { query } = require('../config/database');
const { analyzeProfile } = require('../services/profileAnalysis.service');
const { recommendationUpdateSchema } = require('../schemas/validation.schemas');

async function triggerAnalysis(req, res, next) {
  try {
    const profileId = req.params.id;
    const result = await analyzeProfile(profileId, req.user.id);
    res.json({
      message: 'Profile analysis completed successfully',
      analysis: result.analysis,
      record: result
    });
  } catch (err) {
    next(err);
  }
}

async function getLatestAnalysis(req, res, next) {
  try {
    const profileId = req.params.id;
    const result = await query(`
      SELECT * FROM profile_analyses
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `, [profileId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No analysis found for this profile. Run analysis first.'
      });
    }

    const record = result.rows[0];
    res.json({
      analysis: record.analysis_json,
      record: record
    });
  } catch (err) {
    next(err);
  }
}

async function getProfileRecommendations(req, res, next) {
  try {
    const profileId = req.params.id;
    const recs = await query(`
      SELECT * FROM analysis_recommendations
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY
        CASE priority
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          ELSE 3
        END,
        created_at DESC;
    `, [profileId, req.user.id]);

    res.json({ recommendations: recs.rows });
  } catch (err) {
    next(err);
  }
}

async function updateRecommendationStatus(req, res, next) {
  try {
    const validated = recommendationUpdateSchema.parse(req.body);
    const recId = req.params.id;

    const result = await query(`
      UPDATE analysis_recommendations
      SET status = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *;
    `, [validated.status, recId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Recommendation not found' });
    }

    res.json({
      message: 'Recommendation updated',
      recommendation: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  triggerAnalysis,
  getLatestAnalysis,
  getProfileRecommendations,
  updateRecommendationStatus
};
