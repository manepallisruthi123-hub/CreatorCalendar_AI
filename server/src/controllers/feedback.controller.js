const { generateFeedback, getLatestFeedback } = require('../services/feedback.service');
const { query } = require('../config/database');

async function getFeedback(req, res, next) {
  try {
    const profileId = req.params.profileId || req.query.profile_id;
    if (!profileId) {
      // Find user's latest profile
      const profRes = await query(
        'SELECT id FROM social_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [req.user.id]
      );
      if (profRes.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No social profile found. Please create a profile first.'
        });
      }
      const feedback = await getLatestFeedback(profRes.rows[0].id, req.user.id);
      return res.json({ feedback });
    }

    const feedback = await getLatestFeedback(profileId, req.user.id);
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
}

async function triggerFeedback(req, res, next) {
  try {
    const profileId = req.params.profileId || req.body.profile_id;
    if (!profileId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'profile_id is required'
      });
    }

    const feedback = await generateFeedback(profileId, req.user.id);
    res.status(200).json({
      message: 'Profile feedback generated successfully',
      feedback
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFeedback,
  triggerFeedback
};
