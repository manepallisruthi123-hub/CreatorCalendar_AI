const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { creativeIdeasResponseSchema } = require('../schemas/validation.schemas');

const SYSTEM_IDEAS_PROMPT = `
You are CreatorCalendar AI's lead creative director.
Generate fresh, non-cliché, personalized content ideas based on the provided profile, target audience, content gaps, and niche.

Do not repeat existing content ideas.
Prioritize creative variation and strong attention-grabbing hooks.
Return structured JSON adhering strictly to the schema.
`;

function getHeuristicIdeas(profile) {
  const niche = profile.niche || 'Technology';
  return {
    ideas: [
      {
        title: '3 Costly Mistakes Beginners Make (And How to Avoid Them)',
        format: 'Reel',
        concept: 'High-energy 45-second screen recording showing a common bad practice followed by the clean, modern alternative.',
        hook: 'Stop making this mistake if you started learning ' + niche + ' this year...',
        caption_direction: 'Break down each mistake in numbered bullet points. Mention a tool or resource that helps solve it.',
        cta: 'Save this reel so you do not make this mistake on your next project!',
        why_it_fits: `Your profile excels at educational clarity, and short-form video will expand top-of-funnel reach for ${profile.target_audience || 'students'}.`,
        gap_addressed: 'Lack of high-velocity short-form video hooks.',
        estimated_effort: 'LOW'
      },
      {
        title: 'Behind the Build: 3 Hours Fixing a Silent Bug',
        format: 'Carousel',
        concept: 'Step-by-step 5-slide breakdown of an actual real-world challenge, the debugging thought process, and key lessons learned.',
        hook: 'I lost 3 hours debugging this exact line of code. Here is what happened...',
        caption_direction: 'Tell a narrative story: the problem, the panic, the realization, and the final solution.',
        cta: 'Have you ever spent hours on a single character or typo? Drop your worst debugging story below!',
        why_it_fits: 'Humanizes your expertise while delivering tangible technical problem-solving insights.',
        gap_addressed: 'Limited behind-the-scenes storytelling and personal vulnerability.',
        estimated_effort: 'MEDIUM'
      },
      {
        title: 'My Daily Creator / Developer Tech Stack for 2026',
        format: 'Carousel',
        concept: 'Visual showcase of your favorite tools, extensions, and productivity workflow with aesthetic slides.',
        hook: 'The 4 tools I actually use every day (that aren’t overrated).',
        caption_direction: 'Brief summary of what each tool does and a quick pro-tip on how to configure it for maximum speed.',
        cta: 'Which of these is already in your daily workflow? Comment below.',
        why_it_fits: 'Resource carousels generate the highest bookmark and save rates on social media.',
        gap_addressed: 'Resource curation and high-save reference content.',
        estimated_effort: 'MEDIUM'
      },
      {
        title: 'This or That? Audience Preference Showdown',
        format: 'Story',
        concept: 'Interactive multi-part story poll pitting two popular approaches or tools against each other.',
        hook: 'Quick poll for you all: which approach do you swear by?',
        caption_direction: 'Present two alternatives with quick pros and cons sticker overlays.',
        cta: 'Tap your vote on the sticker below!',
        why_it_fits: 'Directly triggers audience interaction algorithms and gives you data on what your followers care about.',
        gap_addressed: 'Low interactive community participation.',
        estimated_effort: 'LOW'
      },
      {
        title: 'From Zero to Shipped: Project Breakdown in 60 Seconds',
        format: 'Reel',
        concept: 'Fast-paced overview of a project concept, architecture diagram, and final running demo with voiceover.',
        hook: 'Everyone told me this project would take weeks. Here is how I shipped it in a weekend.',
        caption_direction: 'Detail the tech stack used and link to the repository or demo link.',
        cta: 'What feature should I build into this next? Best idea gets featured!',
        why_it_fits: 'Demonstrates real execution and inspires your audience to build their own projects.',
        gap_addressed: 'Project showcase and demonstration of competence.',
        estimated_effort: 'HIGH'
      },
      {
        title: 'The Unspoken Rules of Breaking Into ' + niche,
        format: 'Static Post',
        concept: 'A clean typographic quote graphic sharing unconventional advice for career growth.',
        hook: 'The advice people give you about breaking into ' + niche + ' is outdated.',
        caption_direction: 'Share 3 unwritten rules about networking, portfolio building, and consistency.',
        cta: 'Share this with someone who is currently job hunting or building their portfolio!',
        why_it_fits: 'High shareability and emotional resonance with career-focused followers.',
        gap_addressed: 'Thought leadership and industry perspective.',
        estimated_effort: 'LOW'
      }
    ]
  };
}

async function generateContentIdeas(profileId, userId) {
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

  let ideasData;

  if (isGeminiConfigured()) {
    try {
      const userPrompt = `
Generate 6-8 creative, diverse content ideas for this creator profile:
Platform: ${profile.platform}
Username: @${profile.username}
Niche: ${profile.niche}
Target Audience: ${profile.target_audience}
Goal: ${profile.content_goal}
Tone: ${profile.preferred_tone}

Identified Weaknesses & Opportunities from Analysis:
${JSON.stringify({
  weaknesses: analysis?.weaknesses || [],
  opportunities: analysis?.opportunities || []
}, null, 2)}

Provide compelling, practical ideas spanning Reels, Carousels, Stories, and Posts.
`;
      ideasData = await callGeminiStructured({
        systemPrompt: SYSTEM_IDEAS_PROMPT,
        userPrompt,
        schema: creativeIdeasResponseSchema
      });
    } catch (err) {
      console.warn('Gemini ideas generation failed, using intelligent fallback:', err.message);
      ideasData = getHeuristicIdeas(profile);
    }
  } else {
    ideasData = getHeuristicIdeas(profile);
  }

  // 3. Persist ideas to content_ideas table
  const insertedIdeas = [];
  for (const idea of ideasData.ideas) {
    const res = await query(`
      INSERT INTO content_ideas (
        profile_id, user_id, title, format, concept, hook,
        caption_direction, cta, reason, gap_addressed, effort
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `, [
      profileId,
      userId,
      idea.title,
      idea.format,
      idea.concept,
      idea.hook,
      idea.caption_direction,
      idea.cta,
      idea.why_it_fits || idea.reason || 'Strategic alignment with profile goals',
      idea.gap_addressed || 'Format diversity',
      idea.estimated_effort || 'MEDIUM'
    ]);
    insertedIdeas.push(res.rows[0]);
  }

  return insertedIdeas;
}

module.exports = {
  generateContentIdeas,
  getHeuristicIdeas
};
