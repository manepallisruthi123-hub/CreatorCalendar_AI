const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { contentPlanResponseSchema, calendarPostSchema } = require('../schemas/validation.schemas');

const SYSTEM_CALENDAR_PROMPT = `
You are CreatorCalendar AI's master multi-platform content planner and calendar architect.
Generate a structured, cohesive 7-day content strategy and day-by-day calendar.

Return structured JSON adhering STRICTLY to this EXACT schema format:
{
  "campaign_theme": "Cohesive campaign theme title",
  "strategy_summary": "Strategic rationale connecting creator goals to this week's posts",
  "content_pillars": ["Pillar 1", "Pillar 2", "Pillar 3", "Pillar 4"],
  "content_mix": [
    { "content_type": "Reel", "percentage": 35 },
    { "content_type": "Carousel", "percentage": 35 },
    { "content_type": "Story", "percentage": 20 },
    { "content_type": "Static Post", "percentage": 10 }
  ],
  "posts": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "platform": "Instagram",
      "content_type": "Reel",
      "topic": "Specific subject title",
      "hook": "Gripping first-line hook",
      "caption": "Complete, ready-to-post caption with paragraphs and emojis",
      "hashtags": ["#Topic1", "#Topic2", "#CreatorTips", "#Growth"],
      "cta": "Clear call to action",
      "goal": "Engagement",
      "suggested_time": "19:00",
      "time_reason": "Optimal engagement window"
    }
  ]
}
Generate exactly 7 posts, one for each consecutive day of the provided week.
`;

const SYSTEM_REGENERATE_PROMPT = `
You are CreatorCalendar AI's adaptive post editor.
Regenerate a single post based on the creator's modified tone, format, objective, or custom instruction.
Supported tone options: Professional, Friendly, Funny, Bold, Educational, Short & punchy.

Return structured JSON adhering STRICTLY to this EXACT schema format:
{
  "day": "Monday",
  "date": "YYYY-MM-DD",
  "platform": "Instagram",
  "content_type": "Reel",
  "topic": "Specific subject title",
  "hook": "Gripping first-line hook",
  "caption": "Complete, ready-to-post caption with paragraphs and emojis",
  "hashtags": ["#Topic1", "#Topic2", "#CreatorTips"],
  "cta": "Clear call to action",
  "goal": "Engagement",
  "suggested_time": "19:00",
  "time_reason": "Optimal engagement window"
}
`;

function getNextWeekDates() {
  const dates = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (1 + 7 - dayOfWeek) % 7 || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push({
      day: days[i],
      date: d.toISOString().split('T')[0]
    });
  }
  return dates;
}

function getHeuristicPlan(profile, weekDates, targetPlatform = null) {
  const niche = profile.niche || 'Technology';
  const audience = profile.target_audience || 'College students, creators, and professionals';
  const plat = targetPlatform || profile.platform || 'Instagram';

  // Multi-platform format templates
  let postsTemplate = [];

  if (plat.toLowerCase() === 'youtube') {
    postsTemplate = [
      {
        day: 'Monday',
        platform: 'YouTube',
        content_type: 'Short',
        topic: `3 Costly Mistakes in ${niche} (Avoid These in 2026)`,
        hook: `Stop doing this in ${niche} if you want real results...`,
        caption: `Almost every beginner falls into these 3 traps:\n1. Over-complicating early builds\n2. Ignoring feedback loops\n3. Switching tools every week\n\nFocus on consistency over perfection!`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#YouTubeShorts', '#Tutorial', '#TechTips'],
        cta: 'Subscribe for the full deep-dive video dropping Wednesday!',
        goal: 'Channel Reach & Subscribers',
        suggested_time: '18:00',
        time_reason: 'Evening browse window for YouTube Shorts.'
      },
      {
        day: 'Wednesday',
        platform: 'YouTube',
        content_type: 'Video',
        topic: `The Complete ${niche} Blueprint: From Zero to Production`,
        hook: `If I had to start learning ${niche} today, here is the exact 90-day curriculum I would use.`,
        caption: `In this complete walkthrough, we break down:\n- Core fundamentals you cannot skip\n- The top 3 tools that actually matter\n- Practical project milestones to build your portfolio\n\nTimestamps:\n0:00 Intro\n1:45 The Setup\n5:20 Live Walkthrough\n11:00 Final Takeaways`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#FullTutorial', '#CareerRoadmap', '#DeepDive'],
        cta: 'Download the free project resource link in the description!',
        goal: 'Watch Time & Community',
        suggested_time: '19:30',
        time_reason: 'Mid-week prime viewing window for in-depth educational videos.'
      },
      {
        day: 'Friday',
        platform: 'YouTube',
        content_type: 'Short',
        topic: `One Line of Code / Concept That Changed How I Think About ${niche}`,
        hook: `I spent 3 hours debugging before realizing this simple fix...`,
        caption: `Sometimes the simplest principles make the biggest difference in your build velocity. Have you ever encountered this?`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#DevShorts', '#CodingHacks'],
        cta: 'Hit like if you have ever lost hours to a tiny mistake!',
        goal: 'Engagement & Likes',
        suggested_time: '17:00',
        time_reason: 'Pre-weekend browsing peak.'
      },
      {
        day: 'Sunday',
        platform: 'YouTube',
        content_type: 'Community Post',
        topic: `Weekly Creator Check-in: What did you ship this week?`,
        hook: `Sunday retrospective: Share your wins or blockers!`,
        caption: `Take 60 seconds to reflect on your progress this week. What was your biggest achievement in ${niche}?`,
        hashtags: ['#CreatorCommunity', '#BuildInPublic'],
        cta: 'Drop your project link or update in the comments below!',
        goal: 'Community Interaction',
        suggested_time: '12:00',
        time_reason: 'Sunday daytime community engagement.'
      }
    ];
  } else if (plat.toLowerCase() === 'linkedin') {
    postsTemplate = [
      {
        day: 'Monday',
        platform: 'LinkedIn',
        content_type: 'Thought Leadership',
        topic: `The Uncomfortable Truth About ${niche} in 2026`,
        hook: `Most advice about ${niche} is 3 years behind the curve. Here is what is actually shifting:`,
        caption: `Over the past year, the benchmark for quality in ${niche} has dramatically changed.\n\n3 key takeaways:\n1. Execution speed beats speculative planning.\n2. Deep domain mastery outweighs superficial familiarity.\n3. The ability to articulate complex ideas is your biggest competitive advantage.\n\nHow is your organization adapting?`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#Leadership', '#FutureOfWork', '#ProfessionalDevelopment'],
        cta: 'Share your perspective in the comments below.',
        goal: 'Thought Leadership & Comments',
        suggested_time: '08:30',
        time_reason: 'Monday morning professional commute and planning window.'
      },
      {
        day: 'Wednesday',
        platform: 'LinkedIn',
        content_type: 'Carousel',
        topic: `The 5-Step Framework for Solving Complex ${niche} Bottlenecks`,
        hook: `Swipe through for the exact checklist we use to unblock projects:`,
        caption: `Having a repeatable playbook turns chaotic problem-solving into predictable execution.\n\nSlide 1: Identify root causes\nSlide 2: Isolate variables\nSlide 3: Test minimum fixes\nSlide 4: Document the outcome\nSlide 5: Automate safeguards\n\nBookmark this post for your next sprint.`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#Framework', '#Productivity', '#BestPractices'],
        cta: 'Click "Save" to keep this playbook handy.',
        goal: 'Document Saves & Impressions',
        suggested_time: '11:00',
        time_reason: 'Mid-morning peak reading slot on LinkedIn.'
      },
      {
        day: 'Friday',
        platform: 'LinkedIn',
        content_type: 'Thought Leadership',
        topic: `Lessons Learned from a Difficult Week in ${niche}`,
        hook: `Things didn't go according to plan this week. Here is what happened:`,
        caption: `We rarely discuss the pivots, the missed deadlines, and the redesigns. But transparency builds far more trust than manufactured perfection.\n\nHere are 2 valuable lessons from this week's challenges:\n• Verify assumptions earlier.\n• Never rush the testing phase.\n\nHave a great weekend everyone!`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#LessonsLearned', '#Transparency', '#GrowthMindset'],
        cta: 'What was your biggest takeaway from this work week?',
        goal: 'Authentic Engagement',
        suggested_time: '16:00',
        time_reason: 'Friday afternoon reflective reading window.'
      }
    ];
  }

  // If less than 7 posts, fill with versatile platform-adapted content
  const defaultWeekPosts = [
    {
      day: 'Monday',
      platform: plat,
      content_type: plat.toLowerCase() === 'youtube' ? 'Short' : (plat.toLowerCase() === 'linkedin' ? 'Thought Leadership' : 'Reel'),
      topic: `3 Essential Rules for Excelling in ${niche}`,
      hook: `If you want to master ${niche} faster, start with these 3 rules...`,
      caption: `1. Build small projects daily.\n2. Document what breaks along the way.\n3. Share your learnings publicly.\n\nConsistency compounds! 🚀`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#CreatorTips', '#GrowthJourney'],
      cta: 'Save this post so you have it ready when you need focus!',
      goal: 'Reach & Saves',
      suggested_time: '19:00',
      time_reason: 'Evening high-engagement window.'
    },
    {
      day: 'Tuesday',
      platform: plat,
      content_type: 'Carousel',
      topic: `5 Free Resources for ${niche} You Should Be Using`,
      hook: `Bookmark this: 5 powerful tools for ${niche} that cost \$0.`,
      caption: `Swipe through for 5 game-changing resources that will save you hours every week.\n\n1. Documentation Hub\n2. Visual Design Sandbox\n3. Community Discord\n4. Code Playgrounds\n5. Workflow Cheatsheets`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#Resources', '#ProductivityHacks'],
      cta: 'Which of these is already part of your stack?',
      goal: 'Saves & Bookmarks',
      suggested_time: '18:30',
      time_reason: 'Peak educational carousel reading.'
    },
    {
      day: 'Wednesday',
      platform: plat,
      content_type: 'Reel',
      topic: `How I Solved a Tricky Problem in ${niche}`,
      hook: `I was stuck on this for hours—here is the solution in 30 seconds.`,
      caption: `When troubleshooting ${niche}, always start by isolating the core module.\n\nHere is what went wrong and how one simple adjustment resolved it completely.`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#ProblemSolving', '#QuickTips'],
      cta: 'Drop a comment if you want a detailed breakdown!',
      goal: 'Engagement & Comments',
      suggested_time: '19:00',
      time_reason: 'High video completion rates in mid-week evening.'
    },
    {
      day: 'Thursday',
      platform: plat,
      content_type: 'Story',
      topic: `This or That: Quick ${niche} Community Poll`,
      hook: `Help me settle a debate: which workflow do you prefer?`,
      caption: `Option A: Clean minimal setup\nOption B: Multi-monitor loaded dashboard\n\nTap your vote!`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#Poll', '#Community'],
      cta: 'Tap your choice on the interactive sticker!',
      goal: 'Community Engagement',
      suggested_time: '14:00',
      time_reason: 'Mid-afternoon casual story views.'
    },
    {
      day: 'Friday',
      platform: plat,
      content_type: 'Static Post',
      topic: `The Weekly Milestone: Celebrating Progress`,
      hook: `Small steps every single day add up to massive leaps over months.`,
      caption: `Before logging off for the weekend, write down 1 win from this week in ${niche}.\n\nIt does not have to be huge. Progress is progress! 🙌`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#FridayVibes', '#WeeklyWins'],
      cta: 'Celebrate your win in the comments below!',
      goal: 'Community Connection',
      suggested_time: '17:30',
      time_reason: 'End-of-week reflection window.'
    },
    {
      day: 'Saturday',
      platform: plat,
      content_type: 'Carousel',
      topic: `Weekend Reading: Deep Dive into ${niche} Trends`,
      hook: `Grab a coffee and swipe through this weekend deep-dive:`,
      caption: `3 emerging trends shaping the landscape of ${niche} in the coming months.\n\nSlide 1: Automation and intelligent tooling\nSlide 2: Niche creator ecosystems\nSlide 3: High-trust personal branding`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#DeepDive', '#WeekendReading'],
      cta: 'Save this deck for your weekend reading list!',
      goal: 'Saves & Read Time',
      suggested_time: '11:00',
      time_reason: 'Weekend relaxed reading slot.'
    },
    {
      day: 'Sunday',
      platform: plat,
      content_type: 'Story',
      topic: `Planning Next Week’s Content Calendar`,
      hook: `Behind the scenes: setting up next week's content goals with CreatorCalendar AI!`,
      caption: `Sunday is for planning and getting organized. What are your primary goals for the upcoming week?`,
      hashtags: [`#${niche.replace(/\s+/g, '')}`, '#SundayPlanning', '#CreatorCalendar'],
      cta: 'Reply with your #1 goal for this week!',
      goal: 'Direct Messages & Story Replies',
      suggested_time: '20:00',
      time_reason: 'Sunday night weekly prep session.'
    }
  ];

  const finalPosts = weekDates.map((wd, idx) => {
    const base = (postsTemplate[idx] || defaultWeekPosts[idx]);
    return {
      day: wd.day,
      date: wd.date,
      platform: base.platform || plat,
      content_type: base.content_type,
      topic: base.topic,
      hook: base.hook,
      caption: base.caption,
      hashtags: base.hashtags,
      cta: base.cta,
      goal: base.goal,
      suggested_time: base.suggested_time,
      time_reason: base.time_reason
    };
  });

  return {
    campaign_theme: `Authority, Engagement & Momentum in ${niche}`,
    strategy_summary: `This 7-day strategic calendar provides high-variety, audience-centered content across ${plat}, systematically moving from actionable problem solving to resource saves and community dialogue.`,
    content_pillars: [
      'Problem Solving & Tutorials',
      'Actionable Resource Guides',
      'Community Discussions & Polls',
      'Behind-the-Scenes & Workflow'
    ],
    content_mix: [
      { content_type: 'Reel / Video', percentage: 35 },
      { content_type: 'Carousel / Deck', percentage: 35 },
      { content_type: 'Story / Interactive', percentage: 20 },
      { content_type: 'Thought / Static Post', percentage: 10 }
    ],
    posts: finalPosts
  };
}

async function generateCalendarPlan(profileId, userId, platform = null) {
  // 1. Fetch profile
  const profileRes = await query(
    'SELECT * FROM social_profiles WHERE id = $1 AND user_id = $2',
    [profileId, userId]
  );
  if (profileRes.rows.length === 0) {
    throw new Error('Profile not found');
  }
  const profile = profileRes.rows[0];

  const targetPlatform = platform || profile.platform || 'Instagram';

  // 2. Fetch latest analysis
  const analysisRes = await query(
    'SELECT * FROM profile_analyses WHERE profile_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
    [profileId, userId]
  );
  const analysis = analysisRes.rows[0] ? analysisRes.rows[0].analysis_json : null;

  const weekDates = getNextWeekDates();
  const weekStart = weekDates[0].date;

  let planData;

  if (isGeminiConfigured()) {
    try {
      const userPrompt = `
Generate a 7-day personalized content strategy and calendar for:
Creator Name: ${profile.creator_name || profile.username}
Platform: ${targetPlatform}
Username: @${profile.username}
Niche: ${profile.niche}
Target Audience: ${profile.target_audience}
Goal: ${profile.content_goal}
Tone: ${profile.preferred_tone}
Timezone: ${profile.timezone || 'Asia/Kolkata'}

Week Dates:
${JSON.stringify(weekDates, null, 2)}

Feedback Context:
Improvement Areas: ${JSON.stringify(analysis?.improvement_areas || analysis?.opportunities || [])}
Content Gaps: ${JSON.stringify(analysis?.content_gaps || [])}
Timezone: ${profile.timezone || 'Asia/Kolkata'}

Create an actionable 7-day plan tailored for ${targetPlatform} with high format variety, compelling hooks, complete captions, hashtags, ctas, and recommended posting windows with time reasons grounded in creator timezone (${profile.timezone || 'Asia/Kolkata'}). Describe posting times as "Recommended posting window".
`;
      planData = await callGeminiStructured({
        systemPrompt: SYSTEM_CALENDAR_PROMPT,
        userPrompt,
        schema: contentPlanResponseSchema
      });
    } catch (err) {
      console.warn('Gemini calendar generation failed, using intelligent fallback:', err.message);
      planData = getHeuristicPlan(profile, weekDates, targetPlatform);
    }
  } else {
    planData = getHeuristicPlan(profile, weekDates, targetPlatform);
  }

  // 3. Save content plan to content_plans table
  const planInsert = await query(`
    INSERT INTO content_plans (
      profile_id, user_id, week_start, campaign_theme, strategy_summary, strategy_json
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `, [
    profileId,
    userId,
    weekStart,
    planData.campaign_theme,
    planData.strategy_summary,
    JSON.stringify({
      content_pillars: planData.content_pillars,
      content_mix: planData.content_mix
    })
  ]);

  const planRecord = planInsert.rows[0];

  // 4. Save 7 posts to posts table with default status 'DRAFT'
  const insertedPosts = [];
  for (let i = 0; i < planData.posts.length; i++) {
    const p = planData.posts[i];
    const postDate = p.date || (weekDates[i] ? weekDates[i].date : weekStart);

    const postInsert = await query(`
      INSERT INTO posts (
        plan_id, profile_id, user_id, scheduled_date, platform, content_type,
        topic, hook, caption, hashtags, cta, goal, suggested_time,
        time_reason, status, ai_generated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'DRAFT', true)
      RETURNING *;
    `, [
      planRecord.id,
      profileId,
      userId,
      postDate,
      p.platform || targetPlatform,
      p.content_type,
      p.topic,
      p.hook,
      p.caption,
      JSON.stringify(p.hashtags || []),
      p.cta,
      p.goal,
      p.suggested_time || '19:00',
      p.time_reason || 'Optimal engagement window'
    ]);
    insertedPosts.push(postInsert.rows[0]);
  }

  return {
    plan: planRecord,
    posts: insertedPosts
  };
}

async function regeneratePostPreview({ postId, userId, tone, contentType, objective, instruction }) {
  // Fetch existing post
  const postRes = await query(
    'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
    [postId, userId]
  );
  if (postRes.rows.length === 0) {
    throw new Error('Post not found or unauthorized');
  }
  const existingPost = postRes.rows[0];

  // Fetch profile
  const profileRes = await query(
    'SELECT * FROM social_profiles WHERE id = $1',
    [existingPost.profile_id]
  );
  const profile = profileRes.rows[0];

  const targetTone = tone || profile?.preferred_tone || 'Professional';
  const targetType = contentType || existingPost.content_type;
  const targetGoal = objective || existingPost.goal;
  const customInstr = instruction || 'Refine the hook and enhance audience engagement.';

  let newPost;

  if (isGeminiConfigured()) {
    try {
      const userPrompt = `
Regenerate this specific post with the following modifications:
- New Tone: ${targetTone} (Selected from: Professional, Friendly, Funny, Bold, Educational, Short & punchy)
- Content Type: ${targetType}
- Objective: ${targetGoal}
- Specific User Instruction: ${customInstr}

Current Post Details:
Day: ${(new Date(existingPost.scheduled_date)).toLocaleDateString('en-US', { weekday: 'long' })}
Date: ${existingPost.scheduled_date}
Original Topic: ${existingPost.topic}
Original Hook: ${existingPost.hook}
Original Caption: ${existingPost.caption}
Original CTA: ${existingPost.cta}
Suggested Time: ${existingPost.suggested_time}

Preserve the day (${(new Date(existingPost.scheduled_date)).toLocaleDateString('en-US', { weekday: 'long' })}), date (${existingPost.scheduled_date}), and general subject focus while adopting the new tone (${targetTone}), format (${targetType}), and user instructions.
`;
      newPost = await callGeminiStructured({
        systemPrompt: SYSTEM_REGENERATE_PROMPT,
        userPrompt,
        schema: calendarPostSchema
      });
    } catch (err) {
      console.warn('Gemini regeneration failed, using deterministic adaptive generation:', err.message);
      newPost = generateAdaptivePost(existingPost, targetTone, targetType, targetGoal, customInstr);
    }
  } else {
    newPost = generateAdaptivePost(existingPost, targetTone, targetType, targetGoal, customInstr);
  }

  // Return preview WITHOUT saving to DB yet, returning both original and new preview for clear comparison
  return {
    post_id: postId,
    original: existingPost,
    preview: newPost
  };
}

function generateAdaptivePost(existing, tone, contentType, objective, instruction) {
  const toneMap = {
    'Professional': {
      prefix: 'Strategic Perspective',
      style: 'authoritative, clear, and industry-oriented',
      hook: `In our industry, the difference between good and exceptional comes down to one principle: ${existing.topic}.`,
      closing: 'What are the primary operational challenges you are observing in your team?'
    },
    'Friendly': {
      prefix: 'Hey creators',
      style: 'warm, welcoming, and community-minded',
      hook: `Quick coffee chat thought: let’s talk about ${existing.topic}! ☕`,
      closing: 'I would love to know how you tackle this. Drop a note below!'
    },
    'Funny': {
      prefix: 'Nobody warned me about this',
      style: 'humorous, relatable, and self-deprecating',
      hook: `Tell me I am not the only one who learned about ${existing.topic} the painful way... 😂`,
      closing: 'Drop your funniest or most chaotic experience in the comments!'
    },
    'Bold': {
      prefix: 'Unpopular truth',
      style: 'provocative, contrarian, and high-impact',
      hook: `Most people are completely wrong about ${existing.topic}. Here is why: 🔥`,
      closing: 'Agree or disagree? Do not hold back in the replies.'
    },
    'Educational': {
      prefix: 'Step-by-step masterclass',
      style: 'pedagogical, structured, and immediately actionable',
      hook: `How to master ${existing.topic} in 3 actionable steps without the confusion: 📚`,
      closing: 'Save this guide and review it before your next project build!'
    },
    'Short & punchy': {
      prefix: 'Fast reality check',
      style: 'concise, minimal, and punchy',
      hook: `${existing.topic}. Simple rule: cut the fluff, test early, ship often.`,
      closing: 'Double tap if you needed this reminder today.'
    }
  };

  const selectedTone = toneMap[tone] || toneMap['Professional'];

  return {
    day: new Date(existing.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' }) || 'Monday',
    date: existing.scheduled_date ? new Date(existing.scheduled_date).toISOString().split('T')[0] : '2026-09-28',
    platform: existing.platform || 'Instagram',
    content_type: contentType || existing.content_type,
    topic: `${existing.topic} (${tone} Edition)`,
    hook: selectedTone.hook,
    caption: `Tone: ${tone} • ${selectedTone.style.toUpperCase()}\n\n${selectedTone.hook}\n\nKey takeaways:\n• Streamline your execution\n• Focus on tangible audience value\n• Review progress at regular intervals\n\nCustom Direction applied: "${instruction || 'Sharpen hook and tone'}"\n\n${selectedTone.closing}`,
    hashtags: ['#CreatorCalendar', `#${tone.replace(/\s+/g, '')}Tone`, '#ContentStrategy', '#CreatorEconomy'],
    cta: selectedTone.closing,
    goal: objective || existing.goal,
    suggested_time: existing.suggested_time || '19:00',
    time_reason: `Maintained target window for ${contentType || existing.content_type}.`
  };
}

async function applyRegeneratedPost(postId, userId, updatedData) {
  const res = await query(`
    UPDATE posts
    SET
      content_type = COALESCE($1, content_type),
      topic = COALESCE($2, topic),
      hook = COALESCE($3, hook),
      caption = COALESCE($4, caption),
      hashtags = COALESCE($5, hashtags),
      cta = COALESCE($6, cta),
      goal = COALESCE($7, goal),
      suggested_time = COALESCE($8, suggested_time),
      time_reason = COALESCE($9, time_reason),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10 AND user_id = $11
    RETURNING *;
  `, [
    updatedData.content_type,
    updatedData.topic,
    updatedData.hook,
    updatedData.caption,
    JSON.stringify(updatedData.hashtags || []),
    updatedData.cta,
    updatedData.goal,
    updatedData.suggested_time,
    updatedData.time_reason,
    postId,
    userId
  ]);

  if (res.rows.length === 0) {
    throw new Error('Post not found or unauthorized');
  }

  return res.rows[0];
}

module.exports = {
  generateCalendarPlan,
  regeneratePostPreview,
  applyRegeneratedPost,
  getNextWeekDates
};
