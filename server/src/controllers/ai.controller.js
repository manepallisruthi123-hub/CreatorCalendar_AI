const { analyzeProfile } = require('../services/profileAnalysis.service');
const { generateContentIdeas } = require('../services/contentIdea.service');
const { generateCalendarPlan, regeneratePostPreview, applyRegeneratedPost } = require('../services/calendar.service');
const { postRegenerateRequestSchema } = require('../schemas/validation.schemas');

async function handleAnalyzeProfile(req, res, next) {
  try {
    const { profile_id } = req.body;
    if (!profile_id) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id is required' });
    }

    const result = await analyzeProfile(profile_id, req.user.id);
    res.json({
      message: 'Profile analysis completed',
      analysis: result.analysis,
      record: result
    });
  } catch (err) {
    next(err);
  }
}

async function handleGenerateIdeas(req, res, next) {
  try {
    const { profile_id } = req.body;
    if (!profile_id) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id is required' });
    }

    const ideas = await generateContentIdeas(profile_id, req.user.id);
    res.json({
      message: 'Content ideas generated',
      ideas: ideas
    });
  } catch (err) {
    next(err);
  }
}

async function handleGenerateCalendar(req, res, next) {
  try {
    const { profile_id } = req.body;
    if (!profile_id) {
      return res.status(400).json({ error: 'Bad Request', message: 'profile_id is required' });
    }

    const planData = await generateCalendarPlan(profile_id, req.user.id);
    res.status(201).json({
      message: 'Calendar plan generated',
      plan: planData.plan,
      posts: planData.posts
    });
  } catch (err) {
    next(err);
  }
}

async function handleRegeneratePost(req, res, next) {
  try {
    const validated = postRegenerateRequestSchema.parse(req.body);

    const previewResult = await regeneratePostPreview({
      postId: validated.post_id,
      userId: req.user.id,
      tone: validated.tone,
      contentType: validated.content_type,
      objective: validated.objective,
      instruction: validated.instruction
    });

    res.json({
      message: 'Regeneration preview ready. User must confirm before applying.',
      preview: previewResult.preview,
      post_id: previewResult.post_id
    });
  } catch (err) {
    next(err);
  }
}

async function handleApplyRegeneratedPost(req, res, next) {
  try {
    const { post_id, updated_post } = req.body;
    if (!post_id || !updated_post) {
      return res.status(400).json({ error: 'Bad Request', message: 'post_id and updated_post are required' });
    }

    const updated = await applyRegeneratedPost(post_id, req.user.id, updated_post);
    res.json({
      message: 'New version applied successfully',
      post: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleAnalyzeProfile,
  handleGenerateIdeas,
  handleGenerateCalendar,
  handleRegeneratePost,
  handleApplyRegeneratedPost
};
