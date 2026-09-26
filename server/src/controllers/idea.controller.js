const { query } = require('../config/database');
const { generateContentIdeas } = require('../services/contentIdea.service');

async function getIdeas(req, res, next) {
  try {
    const profileId = req.params.id;
    const ideas = await query(`
      SELECT * FROM content_ideas
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY created_at DESC;
    `, [profileId, req.user.id]);

    res.json({ ideas: ideas.rows });
  } catch (err) {
    next(err);
  }
}

async function triggerGenerateIdeas(req, res, next) {
  try {
    const profileId = req.params.id || req.body.profile_id;
    if (!profileId) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id is required' });
    }

    const ideas = await generateContentIdeas(profileId, req.user.id);
    res.json({
      message: 'Generated creative content ideas successfully',
      ideas: ideas
    });
  } catch (err) {
    next(err);
  }
}

async function deleteIdea(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM content_ideas WHERE id = $1 AND user_id = $2 RETURNING id;',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Idea not found' });
    }

    res.json({ message: 'Idea deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIdeas,
  triggerGenerateIdeas,
  deleteIdea
};
