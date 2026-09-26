const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { contentPlanResponseSchema, calendarPostSchema } = require('../schemas/validation.schemas');

const SYSTEM_CALENDAR_PROMPT = `
You are CreatorCalendar AI's master content planner and calendar architect.
Generate a structured, cohesive 7-day content strategy and day-by-day calendar for the given creator profile.

First create:
- campaign_theme: Cohesive theme for the week (e.g. "Build Trust Through Practical Content")
- strategy_summary: Strategic rationale connecting profile gaps to this week's posts
- content_pillars: 3 to 4 core thematic pillars
- content_mix: Content format distribution with percentages

Then generate 7 distinct posts (one for each consecutive day):
Ensure strong variety across the week (e.g. Reel, Carousel, Story, Tutorial, Behind-the-scenes, Community, Weekly Recap).
Each post must have:
- day: e.g. "Monday"
- date: YYYY-MM-DD
- platform: "Instagram"
- content_type: e.g. "Reel", "Carousel", "Story", "Static Post"
- topic: specific subject
- hook: gripping first-line hook
- caption: rich, complete, ready-to-post caption with paragraphs and emojis
- hashtags: array of 4-8 relevant hashtags
- cta: specific call-to-action
- goal: e.g. "Engagement", "Saves & Bookmarks", "Reach", "Community"
- suggested_time: "HH:MM" 24h format
- time_reason: explanation for this time window

Return structured JSON adhering strictly to the schema.
`;

const SYSTEM_REGENERATE_PROMPT = `
You are CreatorCalendar AI's adaptive post editor.
Regenerate a single post based on the creator's modified tone, format, objective, or custom instruction.
Preserve the overarching campaign context, niche, and audience.
Return a single JSON post matching the required schema.
`;

function getNextWeekDates() {
  const dates = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const now = new Date();
  // Find upcoming Monday
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

function getHeuristicPlan(profile, weekDates) {
  const niche = profile.niche || 'Technology';
  const audience = profile.target_audience || 'College students and creators';

  return {
    campaign_theme: 'Build Authority & Community Through Practical Value',
    strategy_summary: `This 7-day sprint addresses the format concentration identified in your profile analysis by weaving high-retention video reels, interactive story stickers, and in-depth carousels targeted directly at ${audience}.`,
    content_pillars: [
      'Foundational Problem Solving',
      'Behind-the-Scenes & Workflow',
      'Audience Engagement & Community',
      'Actionable Resource Curation'
    ],
    content_mix: [
      { content_type: 'Reel', percentage: 35 },
      { content_type: 'Carousel', percentage: 35 },
      { content_type: 'Story', percentage: 20 },
      { content_type: 'Static Post', percentage: 10 }
    ],
    posts: [
      {
        day: 'Monday',
        date: weekDates[0].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Reel',
        topic: '3 Beginner Pitfalls in ' + niche + ' (And Quick Fixes)',
        hook: 'The 3 mistakes I see almost everyone make when starting in ' + niche + '...',
        caption: `Starting out in ${niche} feels overwhelming when you do not know what traps to avoid.\n\nHere are 3 subtle mistakes that cost you weeks of frustration:\n1. Over-optimizing before shipping a basic prototype.\n2. Skipping core fundamentals in favor of shiny frameworks.\n3. Working in isolation without asking for feedback.\n\nFocus on shipping messy experiments first—polish comes with iteration! 🚀`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#LearningInPublic', '#TechTips', '#CareerGrowth', '#BeginnerGuide'],
        cta: 'Save this reel for your next study or build session!',
        goal: 'Reach & Saves',
        suggested_time: '19:00',
        time_reason: 'Weekday evening window maximizes viewing completion for short-form instructional reels.'
      },
      {
        day: 'Tuesday',
        date: weekDates[1].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Carousel',
        topic: '5 Essential Resources Every ' + niche + ' Creator Needs',
        hook: 'Bookmark this: 5 free tools that saved me 10+ hours this month.',
        caption: `Swipe through to upgrade your creative toolkit without spending a dime.\n\nSlide 1: Notion templates for project planning\nSlide 2: Excalidraw for clear architecture sketches\nSlide 3: Free API directory for realistic mockups\nSlide 4: Ray.so for beautiful code snippets\nSlide 5: Loom for crisp async explanations\n\nWhich tool are you testing first?`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#ResourceGuide', '#ProductivityHacks', '#CreatorToolkit', '#TechStudents'],
        cta: 'Double tap and save this slide deck for reference!',
        goal: 'Saves & Bookmarks',
        suggested_time: '18:30',
        time_reason: 'Tuesday mid-evening has consistently high carousel swipe-through rates.'
      },
      {
        day: 'Wednesday',
        date: weekDates[2].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Story',
        topic: 'Mid-Week Check-in & Dilemma Poll',
        hook: 'Real talk: what is currently your biggest roadblock this week?',
        caption: `Mid-week gut check! Sharing two different approaches to solving our latest architecture problem. Drop your vote on the sticker below so we can discuss the tradeoffs in tomorrow's breakdown!`,
        hashtags: ['#AskTheAudience', '#DailyGrind', '#CommunityPoll'],
        cta: 'Tap your answer on the poll sticker and reply with your reasoning!',
        goal: 'Audience Interaction',
        suggested_time: '13:00',
        time_reason: 'Lunch break window has the highest story sticker tap rate.'
      },
      {
        day: 'Thursday',
        date: weekDates[3].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Carousel',
        topic: 'Step-by-Step Tutorial: Implementing Clean Architecture',
        hook: 'Stop putting all your logic in one giant file. Do this instead.',
        caption: `A clean separation of concerns makes your codebase 10x easier to maintain, debug, and scale.\n\nIn this visual breakdown, we unpack:\n- Service layer separation\n- Validation boundaries\n- Safe error dispatching\n\nSwipe through for practical code before/after snippets that you can drop into your current project! 💡`,
        hashtags: [`#${niche.replace(/\s+/g, '')}`, '#CleanCode', '#SoftwareArchitecture', '#TutorialThursday', '#LearnToCode'],
        cta: 'Tag a friend who is building a project this semester!',
        goal: 'Educational Authority',
        suggested_time: '19:30',
        time_reason: 'In-depth tutorial readership peaks when viewers have unwound for the evening.'
      },
      {
        day: 'Friday',
        date: weekDates[4].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Reel',
        topic: 'Behind-the-Scenes: The Unfiltered Reality of Debugging',
        hook: 'I spent 3 hours fixing what turned out to be a single missing bracket...',
        caption: `Never let social media fool you into thinking everything works on the first try! 😅\n\nHere is the real behind-the-scenes timeline of yesterday's build session:\n- 2:00 PM: "This will take 10 minutes"\n- 3:30 PM: Wondering why the universe hates me\n- 5:00 PM: Found the typo.\n\nNormalize talking about the messy middle!`,
        hashtags: ['#BehindTheScenes', '#RealDeveloperLife', '#TechHumor', '#RelatableTech', '#DebuggingStruggles'],
        cta: 'Drop your funniest or most frustrating debugging story below!',
        goal: 'Engagement & Comments',
        suggested_time: '17:30',
        time_reason: 'Friday afternoon audience prefers lighthearted, relatable behind-the-scenes content.'
      },
      {
        day: 'Saturday',
        date: weekDates[5].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Static Post',
        topic: 'Weekend Mindset: Sustainable Pacing vs Burnout',
        hook: 'Grind culture will tell you to never rest. Here is why that backfires.',
        caption: `Your best ideas will rarely come when you are staring at a screen for the 14th consecutive hour.\n\nRest is not a reward for finished work—it is an active ingredient in cognitive clarity and high-level creative synthesis.\n\nStep away from the screen today, take a walk, and recharge your battery. 🌿`,
        hashtags: ['#CreatorWellness', '#SustainablePacing', '#MindsetShift', '#TechLifeBalance'],
        cta: 'Share this reminder to your story for someone who needs to hear it today!',
        goal: 'Shares & Resonance',
        suggested_time: '11:00',
        time_reason: 'Saturday late morning reaches users during relaxed scrolling periods.'
      },
      {
        day: 'Sunday',
        date: weekDates[6].date,
        platform: profile.platform || 'Instagram',
        content_type: 'Carousel',
        topic: 'Weekly Recap & Goals for the Upcoming Sprint',
        hook: 'What did we ship this week? A transparent breakdown.',
        caption: `Wrapping up an intensive week of building and learning!\n\nHighlights:\n✅ Shipped the prototype feature\n✅ Published 3 community tutorials\n✅ Welcomed 250+ new curious builders to our circle\n\nWhat is your #1 priority goal for the upcoming week? Let’s hold each other accountable in the comments! 👇`,
        hashtags: ['#WeeklyRecap', '#GoalSetting', '#SundayReflections', '#BuilderCommunity', '#Accountability'],
        cta: 'Drop your main focus for next week in the comments below!',
        goal: 'Community Discussion',
        suggested_time: '20:00',
        time_reason: 'Sunday evening is prime time for weekly planning and goal reflection.'
      }
    ]
  };
}

async function generateCalendarPlan(profileId, userId) {
  // 1. Fetch profile
  const profileRes = await query(
    'SELECT * FROM social_profiles WHERE id = $1 AND user_id = $2',
    [profileId, userId]
  );
  if (profileRes.rows.length === 0) {
    throw new Error('Profile not found');
  }
  const profile = profileRes.rows[0];

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
Platform: ${profile.platform}
Username: @${profile.username}
Niche: ${profile.niche}
Target Audience: ${profile.target_audience}
Goal: ${profile.content_goal}
Tone: ${profile.preferred_tone}

Week Dates:
${JSON.stringify(weekDates, null, 2)}

Analysis Context:
Weaknesses: ${JSON.stringify(analysis?.weaknesses || [])}
Opportunities: ${JSON.stringify(analysis?.opportunities || [])}
Suggested Posting Windows: ${JSON.stringify(analysis?.posting_windows || [])}

Create an actionable 7-day plan with high format variety (Reels, Carousels, Stories, Posts), compelling hooks, complete captions, and targeted times.
`;
      planData = await callGeminiStructured({
        systemPrompt: SYSTEM_CALENDAR_PROMPT,
        userPrompt,
        schema: contentPlanResponseSchema
      });
    } catch (err) {
      console.warn('Gemini calendar generation failed, using intelligent fallback:', err.message);
      planData = getHeuristicPlan(profile, weekDates);
    }
  } else {
    planData = getHeuristicPlan(profile, weekDates);
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

  // 4. Save 7 posts to posts table
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
      p.platform || profile.platform || 'Instagram',
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

  const targetTone = tone || profile?.preferred_tone || 'Engaging & Authentic';
  const targetType = contentType || existingPost.content_type;
  const targetGoal = objective || existingPost.goal;
  const customInstr = instruction || 'Make the hook punchier and the caption more dynamic.';

  let newPost;

  if (isGeminiConfigured()) {
    try {
      const userPrompt = `
Regenerate this specific post with the following modifications:
- New Tone: ${targetTone}
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

Preserve the day (${(new Date(existingPost.scheduled_date)).toLocaleDateString('en-US', { weekday: 'long' })}), date (${existingPost.scheduled_date}), and general subject focus while adopting the new tone, format, and instructions.
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

  // Return preview WITHOUT saving to DB yet (Section 23 requirement)
  return {
    post_id: postId,
    preview: newPost
  };
}

function generateAdaptivePost(existing, tone, contentType, objective, instruction) {
  const toneAdjectives = {
    'Funny': { prefix: 'Wait, did you really think', toneStyle: 'humorous and self-deprecating' },
    'Witty': { prefix: 'Here is the plot twist nobody warned you about', toneStyle: 'sharp and witty' },
    'Inspirational': { prefix: 'One year from now you will wish you started today', toneStyle: 'uplifting and motivating' },
    'Authoritative': { prefix: 'The data is conclusive: here is what actually works', toneStyle: 'deeply technical and rigorous' },
    'Casual': { prefix: 'Quick thought while taking my coffee break', toneStyle: 'casual and conversational' }
  };

  const selectedTone = toneAdjectives[tone] || { prefix: 'Fresh perspective on', toneStyle: tone };

  return {
    day: new Date(existing.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' }) || 'Monday',
    date: existing.scheduled_date ? new Date(existing.scheduled_date).toISOString().split('T')[0] : '2026-09-28',
    platform: existing.platform || 'Instagram',
    content_type: contentType || existing.content_type,
    topic: `${existing.topic} (${tone} Edition)`,
    hook: `${selectedTone.prefix}: ${existing.topic}! 👀`,
    caption: `Rewritten with a ${selectedTone.toneStyle} angle based on your instruction: "${instruction || 'refined execution'}"\n\n${existing.topic} does not have to be complicated. When you approach it from this vantage point, everything clicks faster.\n\nKey takeaways:\n• Cut the unnecessary fluff\n• Focus strictly on high-leverage execution\n• Test in small increments\n\nWhat do you think of this approach? Let's discuss below! 👇`,
    hashtags: ['#CreatorCalendar', '#ContentStrategy', '#NewTone', '#RefreshedPost'],
    cta: 'Drop your honest reaction in the comments!',
    goal: objective || existing.goal,
    suggested_time: existing.suggested_time || '19:00',
    time_reason: `Maintained optimal engagement window for ${contentType || existing.content_type}.`
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
