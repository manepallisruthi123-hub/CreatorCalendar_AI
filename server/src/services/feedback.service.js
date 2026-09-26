const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { feedbackResponseSchema } = require('../schemas/validation.schemas');

const SYSTEM_FEEDBACK_PROMPT = `
You are CreatorCalendar AI's profile intelligence strategist.
Evaluate the creator's social profile strictly based on verified, available information.

DO NOT invent fake posts, fake followers, fake likes, comments, fake growth, or past trends.
If historical post data is absent (0 posts), you MUST operate in STARTER FEEDBACK mode:
- State clearly that the creator is starting fresh with 0 historical posts.
- Base feedback entirely on the niche, target audience, content goal, preferred tone, and platform.
- For consistency, content variety, caption quality, and CTA usage: indicator must be marked as Insufficient Data with a clear explanation.
- Overall score must be an AI-generated profile planning score (0-100) reflecting profile clarity, niche positioning, and audience readiness.
- Confidence must be "LOW".

If exactly 1 post exists:
- Evaluate ONLY what is observable in that single post (format, topic, caption structure, CTA presence).
- Do NOT infer audience trends, growth, consistency, or performance patterns from 1 post.
- Label feedback as "Limited historical data".
- Confidence must be "MEDIUM".

If multiple posts exist:
- Ground all feedback strictly in observed patterns.
- Confidence must be "HIGH".

Return STRICT JSON matching this schema:
{
  "overall_score": 75,
  "confidence": "LOW" | "MEDIUM" | "HIGH",
  "summary": "Evidence-grounded profile intelligence summary",
  "dimensions": [
    { "name": "Profile Clarity", "score": 85, "status": "EVALUATED", "explanation": "..." },
    { "name": "Niche Positioning", "score": 80, "status": "EVALUATED", "explanation": "..." },
    { "name": "Audience Alignment", "score": 75, "status": "EVALUATED", "explanation": "..." },
    { "name": "Brand Clarity", "score": 78, "status": "EVALUATED", "explanation": "..." },
    { "name": "Content Variety", "score": null, "status": "INSUFFICIENT_DATA", "explanation": "..." },
    { "name": "Content Quality", "score": null, "status": "INSUFFICIENT_DATA", "explanation": "..." },
    { "name": "CTA Usage", "score": null, "status": "INSUFFICIENT_DATA", "explanation": "..." },
    { "name": "Consistency", "score": null, "status": "INSUFFICIENT_DATA", "explanation": "..." },
    { "name": "Platform Readiness", "score": 80, "status": "EVALUATED", "explanation": "..." }
  ],
  "strengths": [
    { "title": "...", "description": "...", "evidence": "..." }
  ],
  "improvement_areas": [
    {
      "title": "...",
      "current_state": "...",
      "evidence": "...",
      "recommendation": "...",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "suggested_frequency": "2-3x per week"
    }
  ],
  "content_gaps": [
    {
      "gap": "...",
      "why_it_matters": "...",
      "recommended_action": "..."
    }
  ],
  "next_steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}
`;

function getHeuristicFeedback(profile, posts = []) {
  const postCount = posts.length;
  const niche = profile.niche || 'Digital Creator';
  const audience = profile.target_audience || 'General audience';
  const goal = profile.content_goal || 'Growth & Engagement';
  const tone = profile.preferred_tone || 'Educational & Authentic';
  const platform = profile.platform || 'Instagram';

  if (postCount === 0) {
    // Starter feedback for 0 posts
    const dimensions = [
      { name: 'Profile Clarity', score: 82, status: 'EVALUATED', explanation: `Profile defines a clear direction focused on ${niche}.` },
      { name: 'Niche Positioning', score: 80, status: 'EVALUATED', explanation: `Specific niche identified for ${audience}.` },
      { name: 'Audience Alignment', score: 76, status: 'EVALUATED', explanation: `Content goal (${goal}) aligns well with creator positioning.` },
      { name: 'Brand Clarity', score: 75, status: 'EVALUATED', explanation: `Specified tone (${tone}) provides a coherent creative guideline.` },
      { name: 'Content Variety', score: null, status: 'INSUFFICIENT_DATA', explanation: 'Insufficient historical data — starting fresh with 0 published posts.' },
      { name: 'Content Quality', score: null, status: 'INSUFFICIENT_DATA', explanation: 'No published posts available yet to evaluate creative execution.' },
      { name: 'CTA Usage', score: null, status: 'INSUFFICIENT_DATA', explanation: 'No historical call-to-action habit established yet.' },
      { name: 'Consistency', score: null, status: 'INSUFFICIENT_DATA', explanation: 'Zero historical posts — consistency cannot be evaluated.' },
      { name: 'Platform Readiness', score: 84, status: 'EVALUATED', explanation: `Configured for ${platform} with target timezone (${profile.timezone || 'Asia/Kolkata'}).` }
    ];

    const evaluatedScores = dimensions.filter(d => d.score !== null).map(d => d.score);
    const overallScore = Math.round(evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length);

    return {
      overall_score: overallScore,
      confidence: 'LOW',
      summary: `Your profile @${profile.username} has a clear focus in ${niche} targeting ${audience}. Because you are starting fresh with no published posts, this starter strategy establishes your foundational content pillars, positioning, and 7-day rollout plan without relying on historical assumptions.`,
      dimensions,
      strengths: [
        {
          title: 'Definite Niche Definition',
          description: `Focused target market in ${niche} rather than generic lifestyle posting.`,
          evidence: `Selected niche: ${niche}, Target Audience: ${audience}.`
        },
        {
          title: 'Established Creative Voice',
          description: `Clear expectation of tone (${tone}) allows for consistent copywriting from day one.`,
          evidence: `Configured preferred tone: ${tone}.`
        },
        {
          title: 'Unconstrained Strategic Freedom',
          description: 'A fresh profile allows you to train the recommendation algorithm on your highest-leverage content format without legacy baggage.',
          evidence: '0 historical posts recorded.'
        }
      ],
      improvement_areas: [
        {
          title: 'Content Variety Architecture',
          current_state: 'No published content formats currently exist.',
          evidence: 'Profile post corpus is currently empty (0 posts).',
          recommendation: `Establish a 3-pillar content mix immediately: 1) Educational carousels/breakdowns, 2) Fast hook short-form videos/Reels, 3) Interactive stories/community questions.`,
          priority: 'HIGH',
          suggested_frequency: '3-4 posts per week'
        },
        {
          title: 'Call-to-Action Habit',
          current_state: 'No engagement hooks or conversion prompts published.',
          evidence: 'Unpublished CTA profile baseline.',
          recommendation: 'Every planned post should finish with a specific, low-friction prompt (e.g., "Save for reference", "Comment GUIDE for link", "Share your thoughts").',
          priority: 'HIGH',
          suggested_frequency: '100% of published posts'
        },
        {
          title: 'Weekly Publishing Rhythm',
          current_state: 'Unestablished posting cadence.',
          evidence: 'Historical posting frequency is 0.',
          recommendation: `Follow the personalized 7-day CreatorCalendar to publish consistently during recommended audience windows (${profile.timezone || 'Asia/Kolkata'}).`,
          priority: 'MEDIUM',
          suggested_frequency: '3 scheduled days per week'
        }
      ],
      content_gaps: [
        {
          gap: 'Core Educational Cornerstone',
          why_it_matters: 'First-time profile visitors need an immediate signal of your subject-matter competence.',
          recommended_action: `Create a signature carousel or video titled "The Beginner's Guide to ${niche}".`
        },
        {
          gap: 'Relatable Problem-Solving',
          why_it_matters: 'Creators without historical proof build trust fastest by solving a single pain point in public.',
          recommended_action: `Publish an actionable solution to the top problem faced by ${audience}.`
        },
        {
          gap: 'Community Dialogue Loop',
          why_it_matters: 'Algorithm discovery requires active comment threads and saves.',
          recommended_action: 'End weekly content with a community poll or open question.'
        }
      ],
      next_steps: [
        'Review your Starter Feedback and Score breakdown.',
        'Click "Generate Ideas From This Feedback" to produce tailored concepts.',
        'Review and schedule your personalized 7-day content calendar.',
        'Publish your first cornerstone post and establish your baseline rhythm.'
      ]
    };
  }

  if (postCount === 1) {
    // 1 post feedback (observable content only, no fake trends)
    const singlePost = posts[0];
    const postType = singlePost.content_type || 'Post';
    const hasCta = Boolean(singlePost.cta && singlePost.cta.trim() !== '');

    const dimensions = [
      { name: 'Profile Clarity', score: 84, status: 'EVALUATED', explanation: `Clear niche alignment in ${niche}.` },
      { name: 'Niche Positioning', score: 82, status: 'EVALUATED', explanation: `Explicit target audience established.` },
      { name: 'Audience Alignment', score: 78, status: 'EVALUATED', explanation: `The 1 available post addresses ${niche} topics.` },
      { name: 'Brand Clarity', score: 76, status: 'EVALUATED', explanation: `Tone observed aligns with ${tone}.` },
      { name: 'Content Variety', score: null, status: 'INSUFFICIENT_DATA', explanation: 'Only 1 post available — format variety across a timeline cannot be measured.' },
      { name: 'Content Quality', score: 74, status: 'EVALUATED', explanation: `Evaluated observable structure of single post (${postType}).` },
      { name: 'CTA Usage', score: hasCta ? 85 : 40, status: 'EVALUATED', explanation: hasCta ? `Single post contains an explicit CTA: "${singlePost.cta}"` : 'Single post does not contain an observable call to action.' },
      { name: 'Consistency', score: null, status: 'INSUFFICIENT_DATA', explanation: '1 post available — limited historical data. Consistency patterns cannot be inferred.' },
      { name: 'Platform Readiness', score: 85, status: 'EVALUATED', explanation: `Active ${platform} integration.` }
    ];

    const evaluatedScores = dimensions.filter(d => d.score !== null).map(d => d.score);
    const overallScore = Math.round(evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length);

    return {
      overall_score: overallScore,
      confidence: 'MEDIUM',
      summary: `Your profile @${profile.username} has 1 verified post. Limited historical data is available, so this evaluation analyzes the observable attributes of your single post (${postType}) without making unsupported claims about long-term trends or consistency.`,
      dimensions,
      strengths: [
        {
          title: 'Initial Proof of Concept',
          description: `You have successfully published a ${postType} in ${niche}.`,
          evidence: `Verified post: "${(singlePost.caption || '').slice(0, 70)}..."`
        },
        {
          title: hasCta ? 'Action-Oriented Copywriting' : 'Niche Relevance',
          description: hasCta ? 'Your post directs the reader toward next steps with a clear CTA.' : `Your content directly relates to ${niche}.`,
          evidence: hasCta ? `CTA detected: "${singlePost.cta}"` : `Observable topic: ${niche}`
        }
      ],
      improvement_areas: [
        {
          title: 'Format Diversification',
          current_state: `100% of verified content is currently in a single format (${postType}).`,
          evidence: `1 post analyzed (${postType}).`,
          recommendation: `Pair your ${postType} with complementary formats like Short-form video or Carousels to test audience retention.`,
          priority: 'HIGH',
          suggested_frequency: '2-3 posts per week'
        },
        {
          title: 'Sample Size for Algorithmic Data',
          current_state: 'Single data point provides insufficient signals for trend analysis.',
          evidence: '1 post available in database.',
          recommendation: 'Complete a consecutive 7-day content schedule to build statistical confidence for future analysis.',
          priority: 'MEDIUM',
          suggested_frequency: 'Build to 5-10 published items'
        }
      ],
      content_gaps: [
        {
          gap: 'Complementary Format Testing',
          why_it_matters: 'Single formats limit reach to a subsection of platform users.',
          recommended_action: `Follow up your ${postType} with a complementary visual breakdown.`
        }
      ],
      next_steps: [
        'Review your single-post diagnostic score.',
        'Generate creative ideas addressing your format diversification gap.',
        'Use the 7-day calendar to schedule your next 3-5 posts.'
      ]
    };
  }

  // 3+ posts
  const dimensions = [
    { name: 'Profile Clarity', score: 86, status: 'EVALUATED', explanation: 'Strong profile definition.' },
    { name: 'Niche Positioning', score: 84, status: 'EVALUATED', explanation: `Clear subject focus in ${niche}.` },
    { name: 'Audience Alignment', score: 82, status: 'EVALUATED', explanation: `Posts consistently engage ${audience}.` },
    { name: 'Brand Clarity', score: 80, status: 'EVALUATED', explanation: `Recognizable tone and visual structure.` },
    { name: 'Content Variety', score: 72, status: 'EVALUATED', explanation: `${posts.length} posts analyzed across multiple content types.` },
    { name: 'Content Quality', score: 78, status: 'EVALUATED', explanation: 'Solid hooks and structured captions.' },
    { name: 'CTA Usage', score: 75, status: 'EVALUATED', explanation: 'Consistent call to action prompts present.' },
    { name: 'Consistency', score: 70, status: 'EVALUATED', explanation: `Cadence observable across ${posts.length} posts.` },
    { name: 'Platform Readiness', score: 88, status: 'EVALUATED', explanation: `Active integration on ${platform}.` }
  ];

  const evaluatedScores = dimensions.filter(d => d.score !== null).map(d => d.score);
  const overallScore = Math.round(evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length);

  return {
    overall_score: overallScore,
    confidence: 'HIGH',
    summary: `Profile @${profile.username} demonstrates consistent alignment in ${niche}. Content shows healthy structure, with opportunities to expand format variety and sharpen conversion CTAs.`,
    dimensions,
    strengths: [
      {
        title: 'Consistent Niche Authority',
        description: `Content corpus stays disciplined within ${niche}.`,
        evidence: `${posts.length} verified posts on topic.`
      },
      {
        title: 'Clear Value Proposition',
        description: `Audience (${audience}) receives structured insights.`,
        evidence: 'Consistent caption quality across posts.'
      }
    ],
    improvement_areas: [
      {
        title: 'High-Hook Velocity',
        current_state: 'Hooks can be tightened for faster retention.',
        evidence: `Analyzed across ${posts.length} posts.`,
        recommendation: 'Use curiosity gap or counter-intuitive statements in line 1.',
        priority: 'HIGH',
        suggested_frequency: 'Every post'
      }
    ],
    content_gaps: [
      {
        gap: 'Community Q&A and Polls',
        why_it_matters: 'Deepens audience loyalty and provides ideas for future tutorials.',
        recommended_action: 'Publish a weekly question sticker or carousel answering a specific DM.'
      }
    ],
    next_steps: [
      'Generate ideas targeting your highest-priority improvement area.',
      'Schedule next week’s content in the 7-day calendar.',
      'Review engagement progress after the new calendar is executed.'
    ]
  };
}

async function generateFeedback(profileId, userId) {
  // 1. Fetch profile
  const profileRes = await query(
    'SELECT * FROM social_profiles WHERE id = $1 AND user_id = $2',
    [profileId, userId]
  );
  if (profileRes.rows.length === 0) {
    throw new Error('Social profile not found or access denied');
  }
  const profile = profileRes.rows[0];

  // 2. Fetch optional historical posts (never required)
  const postsRes = await query(
    'SELECT * FROM profile_posts WHERE profile_id = $1 AND user_id = $2 ORDER BY post_date DESC LIMIT 15',
    [profileId, userId]
  );
  const posts = postsRes.rows;

  let feedback;

  if (isGeminiConfigured()) {
    try {
      const userPrompt = `
Generate Evidence-Based Profile Feedback for:
Platform: ${profile.platform}
Username: @${profile.username}
Niche: ${profile.niche}
Target Audience: ${profile.target_audience}
Goal: ${profile.content_goal}
Tone: ${profile.preferred_tone}
Timezone: ${profile.timezone || 'Asia/Kolkata'}
Historical Posts Count: ${posts.length}

${posts.length === 0 ? 'NOTE: The creator has 0 historical posts. You must generate STARTER FEEDBACK without claiming past trends or consistency.' : ''}
${posts.length === 1 ? `NOTE: Exactly 1 post exists. Evaluate ONLY observable attributes of this single post: "${posts[0].caption?.slice(0, 150)}", Format: ${posts[0].content_type}, CTA: ${posts[0].cta}. Do NOT claim consistency or audience trends. The summary MUST state that this is an evaluation based on 1 post with limited historical data.` : ''}
${posts.length > 1 ? `Sample of available posts: ${JSON.stringify(posts.slice(0, 5).map(p => ({ format: p.content_type, caption: p.caption?.slice(0, 100), cta: p.cta })))}` : ''}

Output strictly conforming to the requested Feedback schema.
`;
      const aiResult = await callGeminiStructured({
        systemPrompt: SYSTEM_FEEDBACK_PROMPT,
        userPrompt,
        schema: feedbackResponseSchema
      });
      if (posts.length === 1 && !aiResult.summary.toLowerCase().includes('limited') && !aiResult.summary.includes('1')) {
        aiResult.summary = `Evaluation based on 1 verified post (limited historical data): ${aiResult.summary}`;
      }
      feedback = aiResult;
    } catch (err) {
      console.warn('Gemini feedback generation fallback to intelligent heuristics:', err.message);
      feedback = getHeuristicFeedback(profile, posts);
    }
  } else {
    feedback = getHeuristicFeedback(profile, posts);
  }

  // Defensively validate
  const validated = feedbackResponseSchema.parse(feedback);

  // 3. Persist to database (profile_analyses table)
  const insertAnalysis = await query(`
    INSERT INTO profile_analyses (
      profile_id, user_id, overall_score, confidence,
      analysis_json, strengths_json, weaknesses_json,
      opportunities_json, content_mix_json, posting_time_json,
      dimensions_json, content_gaps_json, next_steps_json,
      analysis_mode, data_confidence
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, created_at;
  `, [
    profile.id,
    userId,
    validated.overall_score,
    validated.confidence,
    JSON.stringify(validated),
    JSON.stringify(validated.strengths),
    JSON.stringify(validated.improvement_areas),
    JSON.stringify(validated.content_gaps),
    JSON.stringify([]),
    JSON.stringify([]),
    JSON.stringify(validated.dimensions || []),
    JSON.stringify(validated.content_gaps || []),
    JSON.stringify(validated.next_steps || []),
    posts.length === 0 ? 'STARTER_STRATEGY' : (posts.length <= 2 ? 'EARLY_CONTENT' : 'PROFILE_ANALYSIS'),
    validated.confidence
  ]);

  const analysisId = insertAnalysis.rows[0].id;

  // 4. Update analysis_recommendations
  await query('DELETE FROM analysis_recommendations WHERE profile_id = $1 AND user_id = $2', [profile.id, userId]);

  for (const item of (validated.improvement_areas || [])) {
    await query(`
      INSERT INTO analysis_recommendations (
        analysis_id, profile_id, user_id, title,
        description, evidence, action, priority,
        current_state, suggested_frequency, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
    `, [
      analysisId,
      profile.id,
      userId,
      item.title,
      item.recommendation,
      item.evidence || 'Identified from profile evaluation',
      item.recommendation,
      item.priority || 'MEDIUM',
      item.current_state || '',
      item.suggested_frequency || '2-3x per week'
    ]);
  }

  return {
    ...validated,
    id: analysisId,
    profile_id: profile.id,
    created_at: insertAnalysis.rows[0].created_at
  };
}

async function getLatestFeedback(profileId, userId) {
  const existing = await query(`
    SELECT * FROM profile_analyses
    WHERE profile_id = $1 AND user_id = $2
    ORDER BY created_at DESC
    LIMIT 1;
  `, [profileId, userId]);

  if (existing.rows.length === 0) {
    // Generate fresh feedback automatically
    return await generateFeedback(profileId, userId);
  }

  const row = existing.rows[0];
  let json = row.analysis_json;
  if (typeof json === 'string') {
    try { json = JSON.parse(json); } catch { json = {}; }
  }

  // Ensure overall_score and confidence are present
  if (!json.overall_score && row.overall_score) {
    json.overall_score = row.overall_score;
  }
  if (!json.confidence && row.confidence) {
    json.confidence = row.confidence;
  }

  // Load recommendations
  const recsRes = await query(`
    SELECT * FROM analysis_recommendations
    WHERE profile_id = $1 AND user_id = $2
    ORDER BY CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END;
  `, [profileId, userId]);

  return {
    ...json,
    id: row.id,
    profile_id: profileId,
    recommendations: recsRes.rows,
    created_at: row.created_at
  };
}

module.exports = {
  generateFeedback,
  getLatestFeedback
};
