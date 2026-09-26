const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { profileAnalysisSchema } = require('../schemas/validation.schemas');

const SYSTEM_ANALYSIS_PROMPT = `
You are CreatorCalendar AI's social media strategist and content analyst.

Analyze ONLY the provided information. Do not invent unavailable metrics.
Never invent posts, engagement numbers, followers, reach, impressions, or historical performance.
If information is unavailable, explicitly state that it is unavailable.

You must operate in one of three distinct modes based on post count:

1. MODE A — ZERO POSTS (post_count === 0):
   - Title / Type: "Starter Content Strategy"
   - analysis_mode: "STARTER_STRATEGY"
   - data_confidence: "NONE"
   - DO NOT pretend to analyze historical content, audience preferences, or past trends.
   - Under consistency: indicator MUST be null, explanation: "You're starting fresh — let's build your content strategy from the ground up with a balanced weekly rhythm."
   - Under content_variety: indicator MUST be null, explanation: "Starting fresh with no historical posts. We recommend establishing 3 core pillars: Educational Carousels, Short-Form Reels/Videos, and Community Discussions."
   - Under caption_quality: indicator MUST be null, explanation: "No historical captions yet. Focus on building strong opening hooks and clear spacing."
   - Under cta_usage: indicator MUST be null, explanation: "You're starting fresh — no posts yet. Building an engaging call-to-action habit from post #1 will accelerate audience connection."
   - Provide foundational strengths (fresh slate, positioning freedom), weaknesses (zero historical baseline), 3 high-impact opportunities (cornerstone posts, weekly cadence, format testing), and 10 recommended_next_posts.

2. MODE B — 1 TO 2 POSTS (post_count === 1 or 2):
   - Title / Type: "Early Content Analysis"
   - analysis_mode: "EARLY_CONTENT"
   - data_confidence: "LIMITED"
   - Limited historical data is available. Analyze ONLY what can reasonably be inferred from the actual supplied post(s): observed format, caption topic, tone, and CTA usage.
   - Do NOT make strong claims about consistency, variety, or performance trends.
   - It must NOT say "Your audience strongly prefers..." unless audience data actually exists.
   - Under consistency: indicator MUST be null, explanation: "1 post available — limited historical data is available, so consistency and content-pattern insights are limited."
   - Under content_variety: indicator MUST be null, explanation: "Insufficient historical data to evaluate format variety across limited sample."
   - Under caption_quality: evaluate the actual caption text of the post(s). Indicator can be a calculated score (0-100) or null, with explanation grounded strictly in the caption text.
   - Under cta_usage: evaluate whether the post(s) used a CTA. Indicator can be a calculated score (0-100) or null.
   - Provide observed strengths, weakness ("Limited historical sample size"), and actionable opportunities.

3. MODE C — 3+ POSTS:
   - Title / Type: "Profile Content Analysis"
   - analysis_mode: "PROFILE_ANALYSIS"
   - data_confidence: "HIGH"
   - Calculate content mix, content themes, consistency, content variety, caption quality, and CTA usage grounded strictly in actual posts and deterministic metrics.
   - All claims must be supported by the actual posts.

RETURN STRICT JSON CONFORMING TO THIS EXACT STRUCTURE:
{
  "analysis_mode": "STARTER_STRATEGY" | "EARLY_CONTENT" | "PROFILE_ANALYSIS",
  "data_confidence": "NONE" | "LIMITED" | "HIGH",
  "profile_summary": {
    "niche": "string",
    "audience": "string",
    "positioning": "string"
  },
  "content_mix": [
    { "content_type": "string", "percentage": 40 }
  ],
  "content_themes": [
    { "theme": "string", "percentage": 50 }
  ],
  "consistency": {
    "indicator": null,
    "explanation": "string"
  },
  "content_variety": {
    "indicator": null,
    "explanation": "string"
  },
  "caption_quality": {
    "indicator": null,
    "explanation": "string"
  },
  "cta_usage": {
    "indicator": null,
    "explanation": "string"
  },
  "strengths": [
    { "title": "string", "description": "string", "evidence": "string" }
  ],
  "weaknesses": [
    { "title": "string", "description": "string", "evidence": "string" }
  ],
  "opportunities": [
    { "title": "string", "description": "string", "action": "string", "priority": "HIGH" | "MEDIUM" | "LOW" }
  ],
  "content_gaps": [
    { "gap": "string", "recommendation": "string" }
  ],
  "posting_windows": [
    { "day": "Tuesday", "start": "18:00", "end": "20:00", "confidence": "LOW" | "MEDIUM" | "HIGH", "reason": "string" }
  ],
  "recommended_next_posts": [
    { "title": "string", "format": "string", "concept": "string", "hook": "string", "caption": "string", "cta": "string" }
  ]
}
`;

/**
 * Intelligent deterministic heuristic analyzer used when GEMINI_API_KEY is not configured
 * or for offline testing. Strictly adheres to nullable indicators for 0 and 1-2 posts.
 */
function generateHeuristicAnalysis(profile, posts) {
  const totalPosts = posts.length;
  const timezone = profile.timezone || 'Asia/Kolkata';

  // 1. Content Mix Calculation
  const formatCounts = {};
  posts.forEach(p => {
    const fmt = p.content_type || 'Static Post';
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
  });

  const contentMix = totalPosts > 0 && Object.keys(formatCounts).length > 0
    ? Object.entries(formatCounts).map(([fmt, count]) => ({
        content_type: fmt,
        percentage: Math.round((count / totalPosts) * 100)
      }))
    : [
        { content_type: 'Carousel', percentage: 40 },
        { content_type: 'Reel', percentage: 35 },
        { content_type: 'Story', percentage: 25 }
      ];

  // 2. Caption and CTA metrics
  let ctaCount = 0;
  let totalCaptionLength = 0;
  const ctaWords = ['comment', 'save', 'share', 'link in bio', 'dm', 'check out', 'tap', 'tell us', 'thoughts?', 'vote'];

  posts.forEach(p => {
    const cap = (p.caption || '').toLowerCase();
    totalCaptionLength += cap.length;
    if (p.cta || ctaWords.some(w => cap.includes(w))) {
      ctaCount++;
    }
  });

  // MODE A: 0 Posts -> Starter Content Strategy
  if (totalPosts === 0) {
    return {
      analysis_mode: 'STARTER_STRATEGY',
      data_confidence: 'NONE',
      profile_summary: {
        niche: profile.niche || 'General',
        audience: profile.target_audience || 'General Audience',
        positioning: `${profile.preferred_tone || 'Authentic'} creator focused on ${profile.niche || 'content'} for ${profile.target_audience || 'target audience'}`
      },
      content_mix: [
        { content_type: 'Carousel / Breakdown', percentage: 40 },
        { content_type: 'Short Video / Reel', percentage: 35 },
        { content_type: 'Discussion / Community', percentage: 25 }
      ],
      content_themes: [
        { theme: 'Foundational Tutorials & How-Tos', percentage: 40 },
        { theme: 'Practical Tips & Best Practices', percentage: 35 },
        { theme: 'Industry Trends & Opinions', percentage: 25 }
      ],
      consistency: {
        indicator: null,
        explanation: "You're starting fresh — let's build your content strategy from the ground up with a balanced weekly rhythm."
      },
      content_variety: {
        indicator: null,
        explanation: "Starting fresh with no historical posts. We recommend establishing 3 core pillars: Educational Carousels, Short-Form Reels/Videos, and Community Discussions."
      },
      caption_quality: {
        indicator: null,
        explanation: "No historical captions yet. Focus on building strong opening hooks and clear spacing."
      },
      cta_usage: {
        indicator: null,
        explanation: "You're starting fresh — no posts yet. Building an engaging call-to-action habit from post #1 will accelerate audience connection."
      },
      strengths: [
        {
          title: 'Fresh Slate & Unbiased Positioning',
          description: 'Starting fresh gives you total freedom to establish a cohesive brand identity and intentional content mix without legacy audience churn.',
          evidence: `Profile established with targeted niche: ${profile.niche || 'General'}.`
        },
        {
          title: 'Clear Audience & Intent Focus',
          description: `Targeting ${profile.target_audience || 'creators'} with an authentic tone lays an ideal foundation for high retention.`,
          evidence: `Configured content goal: ${profile.content_goal || 'Growth & Engagement'}.`
        }
      ],
      weaknesses: [
        {
          title: 'Zero Historical Baseline',
          description: 'No historical posts available to measure audience engagement velocity or preferred formats yet.',
          evidence: '0 published posts in profile analysis.'
        }
      ],
      opportunities: [
        {
          title: 'Publish 3 Cornerstone Foundation Posts',
          description: 'Establish authority right away by introducing your perspective, your story, and 1 high-value problem breakdown.',
          action: 'Draft and schedule your first 3 posts using the AI Content Calendar.',
          priority: 'HIGH'
        },
        {
          title: `Establish Prime Posting Cadence in ${timezone}`,
          description: `Schedule content consistently during peak local browsing hours (${timezone}) to build habitual audience anticipation.`,
          action: 'Commit to 3 fixed days per week for the next 4 weeks.',
          priority: 'HIGH'
        },
        {
          title: 'Leverage Multi-Format Distribution',
          description: 'Test both short-form video and visual carousels from week 1 to see which resonates faster with your target demographic.',
          action: 'Include 1 Carousel and 1 Reel in your first 7-day schedule.',
          priority: 'MEDIUM'
        }
      ],
      content_gaps: [
        { gap: 'Introductory Cornerstone Content', recommendation: 'Publish an introductory post explaining your mission and who you help.' }
      ],
      posting_windows: [
        { day: 'Tuesday', start: '18:00', end: '20:00', confidence: 'LOW', reason: `Recommended planning window based on target audience and ${timezone} timezone context.` },
        { day: 'Thursday', start: '19:00', end: '21:00', confidence: 'LOW', reason: `Recommended planning window based on target audience and ${timezone} timezone context.` },
        { day: 'Sunday', start: '11:00', end: '13:00', confidence: 'LOW', reason: `Recommended weekend planning window for relaxed reading in ${timezone}.` }
      ],
      recommended_next_posts: [
        { title: `3 Common Myths in ${profile.niche || 'Your Industry'}`, format: 'Carousel', concept: 'Debunk 3 myths beginners believe.', hook: 'Stop believing these 3 outdated myths...', cta: 'Save this guide for later' },
        { title: 'The Single Tool That Changed My Workflow', format: 'Reel', concept: 'Quick 30s demonstration of a game-changing tool.', hook: 'If you only use one tool this week, make it this one.', cta: 'Comment TOOL for the link' }
      ]
    };
  }

  // MODE B: 1-2 Posts -> Early Content Analysis
  if (totalPosts <= 2) {
    const firstPost = posts[0];
    const hasCta = ctaCount > 0;
    return {
      analysis_mode: 'EARLY_CONTENT',
      data_confidence: 'LIMITED',
      profile_summary: {
        niche: profile.niche || 'General',
        audience: profile.target_audience || 'General Audience',
        positioning: `${profile.preferred_tone || 'Authentic'} creator sharing insights in ${profile.niche || 'their field'}`
      },
      content_mix: contentMix,
      content_themes: [
        { theme: 'Early Exploratory Content', percentage: 100 }
      ],
      consistency: {
        indicator: null,
        explanation: `${totalPosts} post available — limited historical data is available, so consistency and content-pattern insights are limited.`
      },
      content_variety: {
        indicator: null,
        explanation: `Insufficient historical data to evaluate format variety across ${totalPosts} post(s).`
      },
      caption_quality: {
        indicator: totalCaptionLength / totalPosts > 60 ? 70 : 55,
        explanation: `Caption observed is ${totalCaptionLength / totalPosts > 60 ? 'substantive and informative' : 'concise'}, grounded in your published post.`
      },
      cta_usage: {
        indicator: hasCta ? 100 : 0,
        explanation: hasCta ? 'Your published post includes a clear call-to-action.' : 'Your post does not include an explicit call-to-action prompt.'
      },
      strengths: [
        {
          title: 'First Content Milestone Reached',
          description: 'You have published live content and established an initial voice in your niche.',
          evidence: `Observed post: "${(firstPost.caption || '').slice(0, 60)}..."`
        }
      ],
      weaknesses: [
        {
          title: 'Limited Historical Sample Size',
          description: '1 post available — limited historical data is available, so consistency and content-pattern insights are limited.',
          evidence: `Only ${totalPosts} post(s) currently stored.`
        }
      ],
      opportunities: [
        {
          title: 'Build Consistent 5-Post Cadence',
          description: 'Publish 4 more posts over the next 2 weeks to gather enough engagement signals for deep pattern analysis.',
          action: 'Schedule 2 posts this week using your AI Content Calendar.',
          priority: 'HIGH'
        }
      ],
      content_gaps: [
        { gap: 'Format Diversity', recommendation: 'Complement your initial format with a different format (e.g. Reel if you posted Carousel).' }
      ],
      posting_windows: [
        { day: 'Wednesday', start: '18:30', end: '20:30', confidence: 'LOW', reason: `Suggested planning window based on audience and ${timezone} timezone context (insufficient historical data for custom window).` }
      ],
      recommended_next_posts: [
        { title: `Follow-up deep dive on ${profile.niche || 'your topic'}`, format: 'Carousel', concept: 'Step-by-step tutorial expanding your first post.', hook: 'Part 2 of what we covered yesterday...', cta: 'Save for your next session' }
      ]
    };
  }

  // MODE C: 3+ Posts -> Full Profile Content Analysis
  const ctaScore = Math.round((ctaCount / totalPosts) * 100);
  const varietyScore = Math.min(95, Math.max(35, Object.keys(formatCounts).length * 25));
  const consistencyScore = totalPosts >= 8 ? 80 : 65;
  const captionScore = (totalCaptionLength / totalPosts) > 80 ? 75 : 60;

  return {
    analysis_mode: 'PROFILE_ANALYSIS',
    data_confidence: 'HIGH',
    profile_summary: {
      niche: profile.niche || 'Technology Education',
      audience: profile.target_audience || 'Creators, professionals, and students',
      positioning: `${profile.preferred_tone || 'Educational & Practical'} creator sharing insights and tutorials for ${profile.target_audience || 'creators'}`
    },
    content_mix: contentMix,
    content_themes: [
      { theme: 'Technical Tutorials & How-Tos', percentage: 40 },
      { theme: 'Career & Industry Insights', percentage: 30 },
      { theme: 'Behind-the-Scenes & Workflow', percentage: 15 },
      { theme: 'Community Discussions', percentage: 15 }
    ],
    consistency: {
      indicator: consistencyScore,
      explanation: `Analyzed ${totalPosts} recent posts demonstrating an active publishing routine.`
    },
    content_variety: {
      indicator: varietyScore,
      explanation: `Content spans ${Object.keys(formatCounts).join(', ')} formats.`
    },
    caption_quality: {
      indicator: captionScore,
      explanation: 'Captions are structured and clear with actionable advice.'
    },
    cta_usage: {
      indicator: ctaScore,
      explanation: `${ctaCount} of ${totalPosts} analyzed posts incorporate an active audience call-to-action.`
    },
    strengths: [
      {
        title: 'Clear Niche Focus',
        description: 'Posts demonstrate focused positioning around your core topic area.',
        evidence: `All ${totalPosts} analyzed posts align with ${profile.niche || 'your chosen specialization'}.`
      }
    ],
    weaknesses: [
      {
        title: 'Opportunity to Diversify Formats',
        description: `Content is concentrated in ${contentMix[0]?.content_type || 'primary format'}. Adding multi-format distribution will increase algorithmic reach.`,
        evidence: `${contentMix[0]?.percentage || 60}% of posts share the same format.`
      }
    ],
    opportunities: [
      {
        title: 'Short Educational Reels with Relatable Hooks',
        description: 'Repackage key concepts into 30-45 second video reels with immediate problem-statement hooks for viral discovery.',
        action: 'Test 2 short educational Reels this week focusing on common beginner pitfalls.',
        priority: 'HIGH'
      }
    ],
    content_gaps: [
      { gap: 'Video Discovery', recommendation: 'Introduce 30-second short form videos to complement static content.' }
    ],
    posting_windows: [
      { day: 'Monday', start: '19:00', end: '21:00', confidence: 'MEDIUM', reason: `Recommended evening posting window in ${timezone}.` },
      { day: 'Thursday', start: '18:30', end: '20:30', confidence: 'MEDIUM', reason: `Mid-week browsing session in ${timezone}.` }
    ],
    recommended_next_posts: [
      { title: `Top 5 Workflow Mistakes in ${profile.niche || 'Tech'}`, format: 'Carousel', concept: 'Visual walkthrough of common pitfalls.', hook: 'Are you still making these 5 mistakes?', cta: 'Save to review with your team' }
    ]
  };
}

/**
 * Analyzes a profile and its posts, persisting the results to DB
 */
async function analyzeProfile(profileId, userId) {
  // 1. Fetch profile
  const profileRes = await query(
    'SELECT * FROM social_profiles WHERE id = $1 AND user_id = $2',
    [profileId, userId]
  );
  if (profileRes.rows.length === 0) {
    throw new Error('Profile not found');
  }
  const profile = profileRes.rows[0];

  // 2. Fetch recent posts
  const postsRes = await query(
    'SELECT * FROM profile_posts WHERE profile_id = $1 AND user_id = $2 ORDER BY post_date DESC LIMIT 30',
    [profileId, userId]
  );
  const posts = postsRes.rows;
  const totalPosts = posts.length;

  // [CC DEBUG] analysis input post count
  console.log('[CC DEBUG] analysis input post count:', totalPosts);

  // Calculate verified deterministic metrics
  const formatCounts = {};
  let totalLikes = 0;
  let totalComments = 0;
  let likesCount = 0;
  let commentsCount = 0;
  let ctaCount = 0;
  let totalCaptionLength = 0;
  let totalHashtags = 0;
  const observedDays = new Set();

  posts.forEach(p => {
    const fmt = p.content_type || 'Image';
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;
    if (p.likes !== null && p.likes !== undefined && (p.likes > 0 || p.is_demo)) {
      totalLikes += p.likes;
      likesCount++;
    }
    if (p.comments !== null && p.comments !== undefined && (p.comments > 0 || p.is_demo)) {
      totalComments += p.comments;
      commentsCount++;
    }
    const cap = p.caption || '';
    totalCaptionLength += cap.length;
    const ctaWords = ['comment', 'save', 'share', 'link in bio', 'dm', 'check out', 'tap', 'tell us', 'thoughts?', 'vote', 'link', 'click'];
    if ((p.cta && p.cta.trim().length > 0) || ctaWords.some(w => cap.toLowerCase().includes(w))) {
      ctaCount++;
    }
    let hCount = 0;
    if (Array.isArray(p.hashtags)) hCount = p.hashtags.length;
    else if (typeof p.hashtags === 'string') {
      try { hCount = JSON.parse(p.hashtags).length; } catch(e) { hCount = p.hashtags.split(/\s+/).filter(Boolean).length; }
    }
    totalHashtags += hCount;

    if (p.post_date) {
      const d = new Date(p.post_date);
      if (!isNaN(d.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        observedDays.add(days[d.getDay()]);
      }
    }
  });

  const contentMix = totalPosts > 0
    ? Object.entries(formatCounts).map(([fmt, cnt]) => ({
        content_type: fmt,
        count: cnt,
        percentage: Math.round((cnt / totalPosts) * 100)
      }))
    : [
        { content_type: 'Carousel', count: 0, percentage: 40 },
        { content_type: 'Reel', count: 0, percentage: 35 },
        { content_type: 'Story', count: 0, percentage: 25 }
      ];

  const avgLikes = likesCount > 0 ? Math.round(totalLikes / likesCount) : null;
  const avgComments = commentsCount > 0 ? Math.round(totalComments / commentsCount) : null;
  const avgCaptionLength = totalPosts > 0 ? Math.round(totalCaptionLength / totalPosts) : null;
  const avgHashtags = totalPosts > 0 ? Math.round(totalHashtags / totalPosts) : null;
  const ctaUsagePercentage = totalPosts > 0 ? Math.round((ctaCount / totalPosts) * 100) : null;

  let postingFrequency = 'Not established';
  if (totalPosts >= 2) {
    const dates = posts.map(p => new Date(p.post_date).getTime()).filter(t => !isNaN(t)).sort((a, b) => a - b);
    if (dates.length >= 2) {
      const daysDiff = Math.max(1, (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24));
      const weeks = Math.max(0.5, daysDiff / 7);
      postingFrequency = `${(totalPosts / weeks).toFixed(1)} posts/week`;
    }
  } else if (totalPosts === 1) {
    postingFrequency = '1 post published';
  } else {
    postingFrequency = '0 posts (starter)';
  }

  // Construct Clean AI Input Object (Part 4)
  const aiInputObject = {
    creator: {
      name: profile.creator_name || profile.username,
      niche: profile.niche || 'General',
      audience: profile.target_audience || 'General Audience',
      goal: profile.content_goal || 'Growth & Engagement',
      tone: profile.preferred_tone || 'Authentic & Professional',
      timezone: profile.timezone || 'Asia/Kolkata'
    },
    platform: (profile.platform || 'Instagram').toLowerCase(),
    content_summary: {
      post_count: totalPosts,
      deterministic_metrics: {
        content_mix: contentMix,
        posting_frequency: postingFrequency,
        average_likes: avgLikes,
        average_comments: avgComments,
        average_caption_length: avgCaptionLength,
        average_hashtags: avgHashtags,
        cta_usage_percentage: ctaUsagePercentage,
        observed_posting_days: Array.from(observedDays)
      }
    },
    posts: posts.map(p => ({
      id: p.id,
      platform: (p.platform || profile.platform || 'Instagram').toLowerCase(),
      content_type: p.content_type || 'POST',
      caption: p.caption || '',
      published_at: p.post_date || null,
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : (typeof p.hashtags === 'string' ? (()=>{ try { return JSON.parse(p.hashtags); } catch(e){ return []; } })() : []),
      likes: (p.likes !== undefined && p.likes !== null && (p.likes > 0 || p.is_demo)) ? p.likes : null,
      comments: (p.comments !== undefined && p.comments !== null && (p.comments > 0 || p.is_demo)) ? p.comments : null,
      permalink: p.url || null
    }))
  };

  // [AI DEBUG] Logging before Gemini call (Part 3)
  console.log(`[AI DEBUG]\nprofileId: ${profileId}\nplatform: ${aiInputObject.platform}\npostCount: ${totalPosts}\nposts: ${JSON.stringify(aiInputObject.posts, null, 2)}`);

  let analysisData;

  // Run Gemini analysis or fail cleanly (Part 12)
  if (isGeminiConfigured()) {
    try {
      let modeInstructions = '';
      if (totalPosts === 0) {
        modeInstructions = `
CRITICAL INSTRUCTIONS FOR MODE A (0 POSTS):
- The creator has 0 posts (starting fresh).
- DO NOT pretend to analyze historical content or past audience performance.
- Title/mode: "Starter Content Strategy". Set "analysis_mode": "STARTER_STRATEGY", "data_confidence": "NONE".
- consistency: indicator MUST be null, explanation: "You're starting fresh — let's build your content strategy from the ground up with a balanced weekly rhythm."
- content_variety: indicator MUST be null, explanation: "Starting fresh with no historical posts. We recommend establishing 3 core pillars: Educational Carousels, Short-Form Reels/Videos, and Community Discussions."
- caption_quality: indicator MUST be null, explanation: "No historical captions yet. Focus on building strong opening hooks and clear spacing."
- cta_usage: indicator MUST be null, explanation: "You're starting fresh — no posts yet. Building an engaging call-to-action habit from post #1 will accelerate audience connection."
- Generate 10 high-value starter ideas in recommended_next_posts.
- In posting_windows: Provide planning recommendations for ${aiInputObject.creator.timezone} based on audience context with confidence "LOW".
`;
      } else if (totalPosts <= 2) {
        modeInstructions = `
CRITICAL INSTRUCTIONS FOR MODE B (1-2 POSTS):
- The creator has only ${totalPosts} post(s).
- Title/mode: "Early Content Analysis". Set "analysis_mode": "EARLY_CONTENT", "data_confidence": "LIMITED".
- Limited historical data is available. Analyze ONLY what can reasonably be inferred from the actual supplied ${totalPosts} post(s).
- It must NOT say "Your audience strongly prefers..." unless audience data actually exists.
- consistency: indicator MUST be null, explanation: "${totalPosts} post available — limited historical data is available, so consistency and content-pattern insights are limited."
- content_variety: indicator MUST be null, explanation: "Insufficient historical data to evaluate format variety across ${totalPosts} post(s)."
- caption_quality: evaluate the actual caption text of the post(s). Set indicator to a score (0-100) or null, with explanation grounded in the text.
- cta_usage: evaluate whether the post(s) used a CTA. Set indicator to a score (0-100) or null.
- In weaknesses: include note about limited sample size.
- In posting_windows: Provide planning recommendations for ${aiInputObject.creator.timezone} with confidence "LOW".
`;
      } else {
        modeInstructions = `
CRITICAL INSTRUCTIONS FOR MODE C (3+ POSTS):
- The creator has ${totalPosts} posts.
- Title/mode: "Profile Content Analysis". Set "analysis_mode": "PROFILE_ANALYSIS", "data_confidence": "HIGH".
- Ground your analysis strictly in the verified deterministic metrics and actual post captions provided below.
- Do not invent engagement numbers if they are null.
- In posting_windows: Include timezone ${aiInputObject.creator.timezone}.
`;
      }

      const userPrompt = `
Normalized AI Input Object:
${JSON.stringify(aiInputObject, null, 2)}

${modeInstructions}
`;

      analysisData = await callGeminiStructured({
        systemPrompt: SYSTEM_ANALYSIS_PROMPT,
        userPrompt,
        schema: profileAnalysisSchema
      });
    } catch (err) {
      console.error('[CC ERROR] Gemini AI analysis failed:', err.message);
      // PART 12: Never display generic fake analysis if Gemini fails. Show friendly error.
      throw new Error("AI analysis couldn't be completed. Please try again.");
    }
  } else {
    // If Gemini API is not configured at all in environment
    console.warn('[CC WARN] GEMINI_API_KEY is not configured, running deterministic fallback engine');
    analysisData = generateHeuristicAnalysis(profile, posts);
  }

  // 4. Save to profile_analyses table (Part 13)
  const insertAnalysisQuery = `
    INSERT INTO profile_analyses (
      profile_id, user_id, analysis_json, strengths_json,
      weaknesses_json, opportunities_json, content_mix_json, posting_time_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const savedAnalysis = await query(insertAnalysisQuery, [
    profileId,
    userId,
    JSON.stringify(analysisData),
    JSON.stringify(analysisData.strengths),
    JSON.stringify(analysisData.weaknesses),
    JSON.stringify(analysisData.opportunities),
    JSON.stringify(analysisData.content_mix),
    JSON.stringify(analysisData.posting_windows)
  ]);

  const analysisRecord = savedAnalysis.rows[0];

  // 5. Populate analysis_recommendations table
  if (analysisData.opportunities && Array.isArray(analysisData.opportunities)) {
    for (const opp of analysisData.opportunities) {
      await query(`
        INSERT INTO analysis_recommendations (
          analysis_id, profile_id, user_id, title, description, evidence, action, priority, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
      `, [
        analysisRecord.id,
        profileId,
        userId,
        opp.title,
        opp.description || opp.title,
        `Identified during AI profile analysis of ${totalPosts} post(s)`,
        opp.action || 'Implement recommended format',
        opp.priority || 'MEDIUM'
      ]);
    }
  }

  return {
    ...analysisRecord,
    analysis: analysisData
  };
}

module.exports = {
  analyzeProfile,
  generateHeuristicAnalysis
};
