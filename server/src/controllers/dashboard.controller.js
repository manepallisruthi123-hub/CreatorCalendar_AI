const { query } = require('../config/database');
const { getAllStatuses, getAdapter } = require('../services/social');
const { getLatestFeedback } = require('../services/feedback.service');

async function getDashboardSummary(req, res, next) {
  try {
    const { profile_id } = req.query;

    // 1. Get user profiles
    const profilesRes = await query(
      'SELECT * FROM social_profiles WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    if (profilesRes.rows.length === 0) {
      return res.json({
        has_profile: false,
        message: 'No social profile created yet. Please create a profile to get started.'
      });
    }

    // Select active profile (query param or most recent)
    let activeProfile = profilesRes.rows[0];
    if (profile_id) {
      const match = profilesRes.rows.find(p => p.id === profile_id);
      if (match) activeProfile = match;
    }

    // 2. Multi-platform connection statuses (Instagram, YouTube, TikTok, LinkedIn, Facebook)
    let platformStatuses = [];
    try {
      platformStatuses = await getAllStatuses(req.user.id);
    } catch (e) {
      console.warn('Failed to load social platform statuses:', e.message);
    }

    // 3. Current active platform status
    const currentPlatform = (activeProfile.platform || 'Instagram').toLowerCase();
    const activePlatformStatus = platformStatuses.find(p => p.platform === currentPlatform) || {
      platform: currentPlatform,
      status: 'NOT_CONFIGURED',
      connected: false,
      message: `${activeProfile.platform} data integration isn't configured yet.`
    };

    // 4. Latest Feedback & Evidence-Based Score
    let feedback = null;
    try {
      feedback = await getLatestFeedback(activeProfile.id, req.user.id);
    } catch (e) {
      console.warn('Could not fetch feedback for dashboard:', e.message);
    }

    // 5. Top improvement areas from recommendations or feedback
    const recsRes = await query(`
      SELECT id, title, current_state, description, evidence, action, priority, suggested_frequency, status
      FROM analysis_recommendations
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY
        CASE priority
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          ELSE 3
        END,
        created_at DESC
      LIMIT 4;
    `, [activeProfile.id, req.user.id]);

    // 6. Recent Creative Ideas
    const ideasRes = await query(`
      SELECT id, title, format, concept, hook, cta, why_it_fits, gap_addressed, effort as estimated_effort, created_at
      FROM content_ideas
      WHERE profile_id = $1 AND user_id = $2
      ORDER BY created_at DESC
      LIMIT 4;
    `, [activeProfile.id, req.user.id]);

    // 7. Upcoming 7-Day Calendar items
    const upcomingCalendarRes = await query(`
      SELECT id, scheduled_date, suggested_time, time_reason, platform, content_type, topic, hook, caption, cta, status
      FROM posts
      WHERE profile_id = $1 AND user_id = $2 AND status IN ('DRAFT', 'READY', 'SCHEDULED')
      ORDER BY scheduled_date ASC, suggested_time ASC
      LIMIT 5;
    `, [activeProfile.id, req.user.id]);

    // 8. Active Campaigns
    const campaignsRes = await query(`
      SELECT id, name, description, goal, start_date, end_date, status, created_at
      FROM campaigns
      WHERE profile_id = $1 AND user_id = $2 AND status = 'ACTIVE'
      ORDER BY end_date ASC
      LIMIT 3;
    `, [activeProfile.id, req.user.id]);

    // Clean, high-level overview response without post-count dependencies
    res.json({
      has_profile: true,
      active_profile: activeProfile,
      connected_platforms: platformStatuses,
      active_platform_status: activePlatformStatus,
      profile_score: {
        score: feedback?.overall_score ?? 75,
        confidence: feedback?.confidence ?? 'LOW',
        label: 'AI-generated profile planning score'
      },
      feedback_summary: feedback?.summary ?? `Profile @${activeProfile.username} configured in ${activeProfile.niche}.`,
      top_improvement_areas: recsRes.rows.length > 0 ? recsRes.rows : (feedback?.improvement_areas?.slice(0, 4) || []),
      recent_creative_ideas: ideasRes.rows,
      upcoming_calendar_items: upcomingCalendarRes.rows,
      campaigns_overview: campaignsRes.rows,
      data_status: {
        connectionStatus: activePlatformStatus.status,
        isConnected: activePlatformStatus.connected,
        message: activePlatformStatus.connected
          ? `Connected to ${activeProfile.platform}.`
          : `${activeProfile.platform} access is not currently available. Strategy is grounded in your profile information.`
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary
};
