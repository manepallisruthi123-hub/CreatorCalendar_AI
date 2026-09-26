const { query } = require('../config/database');
const { callGeminiStructured, isGeminiConfigured } = require('./gemini.service');
const { creativeIdeasResponseSchema } = require('../schemas/validation.schemas');

const SYSTEM_IDEAS_PROMPT = `
You are CreatorCalendar AI's lead multi-platform creative director.
Generate fresh, non-cliché, personalized content ideas tailored to the creator's niche, audience, and platform.

Supported platform formats:
- Instagram: Reel, Carousel, Story, Static Post
- YouTube: YouTube Short, Long-form Video, Community Post
- TikTok: TikTok Video, Story, Duet/Stitch Concept
- LinkedIn: Thought Leadership Post, PDF Carousel, Industry Poll
- Facebook: Discussion Post, Video/Reel, Story

Return structured JSON adhering STRICTLY to this EXACT schema format:
{
  "ideas": [
    {
      "title": "Compelling Idea Title",
      "format": "Reel",
      "concept": "Detailed description of the content concept",
      "hook": "Attention-grabbing first line hook",
      "caption_direction": "Guidance on how to structure the caption",
      "cta": "Clear call to action",
      "why_it_fits": "Strategic explanation connecting this idea to profile goals",
      "gap_addressed": "Specific format or topic gap resolved",
      "estimated_effort": "LOW"
    }
  ]
}
`;

function getHeuristicIdeas(profile, targetPlatform = 'Instagram') {
  const niche = profile.niche || 'Technology';
  const plat = targetPlatform || profile.platform || 'Instagram';

  // Platform-specific concept sets
  if (plat.toLowerCase() === 'youtube') {
    return {
      ideas: [
        {
          title: `Full Roadmap: Mastering ${niche} from Scratch`,
          format: 'Long-form Video',
          concept: 'Comprehensive 12-minute deep dive structured with time-stamped chapters, on-screen diagrams, and resource links.',
          hook: `If I had to learn ${niche} all over again in 2026, here is the exact 90-day blueprint I would follow...`,
          caption_direction: 'Detailed video description with timestamps, relevant documentation links, and Discord/community invite.',
          cta: 'Subscribe and hit the bell for next week’s practical walkthrough!',
          why_it_fits: 'Long-form YouTube videos build evergreen search traffic and viewer trust.',
          gap_addressed: 'Evergreen search authority.',
          estimated_effort: 'HIGH'
        },
        {
          title: `This ${niche} Shortcut Feels Illegal to Know`,
          format: 'YouTube Short',
          concept: 'Fast 50-second screen capture demonstrating an unknown shortcut or workflow booster.',
          hook: `Stop doing this manually in ${niche}—use this built-in trick instead!`,
          caption_direction: 'Short description highlighting why this saves 30 minutes every day.',
          cta: 'Like this Short if you learned something new today!',
          why_it_fits: 'YouTube Shorts accelerate channel subscriber velocity with high algorithmic recommendation.',
          gap_addressed: 'Top-of-funnel discovery.',
          estimated_effort: 'LOW'
        },
        {
          title: `Community Poll: What is your biggest roadblock in ${niche}?`,
          format: 'Community Post',
          concept: 'Interactive YouTube community post poll with 4 specific pain point options.',
          hook: `Creator check-in: Which topic do you want the next tutorial to cover?`,
          caption_direction: 'Brief context explaining upcoming project plans and soliciting direct votes.',
          cta: 'Vote in the poll and leave a comment explaining your choice!',
          why_it_fits: 'Engages subscribers in between video uploads.',
          gap_addressed: 'Community feedback loop.',
          estimated_effort: 'LOW'
        }
      ]
    };
  }

  if (plat.toLowerCase() === 'linkedin') {
    return {
      ideas: [
        {
          title: `The Shift in ${niche} That Most Professionals Are Ignoring`,
          format: 'Thought Leadership Post',
          concept: 'Text breakdown analyzing emerging industry shifts, skill requirements, and practical advice for professionals.',
          hook: `The way we approached ${niche} 2 years ago no longer works. Here is what changed:`,
          caption_direction: 'Structured post using clean whitespace, 3 bulleted insights, and an actionable takeaway.',
          cta: 'How is your team adapting to this shift? I’d love to hear your thoughts in the comments.',
          why_it_fits: 'LinkedIn rewards substantive perspective and professional commentary.',
          gap_addressed: 'B2B and professional thought leadership.',
          estimated_effort: 'MEDIUM'
        },
        {
          title: `The 5-Page Playbook for ${niche} Execution`,
          format: 'PDF Carousel',
          concept: 'Multi-slide visual document summarizing a step-by-step framework.',
          hook: `Swipe through for the 5-step framework I use to execute ${niche} projects on time:`,
          caption_direction: 'Brief intro outlining the core objective of the playbook.',
          cta: 'Save this post or download the PDF for your team meetings.',
          why_it_fits: 'LinkedIn PDF documents enjoy high dwell time and bookmark rates.',
          gap_addressed: 'High-value downloadable resource positioning.',
          estimated_effort: 'MEDIUM'
        }
      ]
    };
  }

  if (plat.toLowerCase() === 'tiktok') {
    return {
      ideas: [
        {
          title: `POV: You just discovered this ${niche} secret`,
          format: 'TikTok Video',
          concept: 'Fast-paced talking head video with dynamic text overlays and punchy sound design.',
          hook: `I bet you didn't know you could do THIS in ${niche}...`,
          caption_direction: 'Punchy 2-line caption with trending hashtags.',
          cta: 'Save this video before you forget where to find it!',
          why_it_fits: 'Casual, fast-paced video builds virality on TikTok.',
          gap_addressed: 'Short-form visual engagement.',
          estimated_effort: 'LOW'
        }
      ]
    };
  }

  // Default Instagram ideas
  return {
    ideas: [
      {
        title: '3 Costly Mistakes Beginners Make (And How to Avoid Them)',
        format: 'Reel',
        concept: 'High-energy 45-second screen recording showing a common bad practice followed by the clean, modern alternative.',
        hook: `Stop making this mistake if you started learning ${niche} this year...`,
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
        title: `My Daily Creator / Developer Tech Stack for 2026`,
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
        title: `The Unspoken Rules of Breaking Into ${niche}`,
        format: 'Static Post',
        concept: 'A clean typographic quote graphic sharing unconventional advice for career growth.',
        hook: `The advice people give you about breaking into ${niche} is outdated.`,
        caption_direction: 'Share 3 unwritten rules about networking, portfolio building, and consistency.',
        cta: 'Share this with someone who is currently job hunting or building their portfolio!',
        why_it_fits: 'High shareability and emotional resonance with career-focused followers.',
        gap_addressed: 'Thought leadership and industry perspective.',
        estimated_effort: 'LOW'
      }
    ]
  };
}

async function generateContentIdeas(profileId, userId, platform = null) {
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

  let ideasData;

  if (isGeminiConfigured()) {
    try {
      const feedbackContext = {
        improvement_areas: analysis?.improvement_areas || analysis?.opportunities || [],
        content_gaps: analysis?.content_gaps || [],
        strengths: analysis?.strengths || []
      };

      const userPrompt = `
Generate 6-8 creative, diverse content ideas tailored for:
Platform: ${targetPlatform}
Creator Name: ${profile.creator_name || profile.username}
Username: @${profile.username}
Niche: ${profile.niche}
Target Audience: ${profile.target_audience}
Goal: ${profile.content_goal}
Tone: ${profile.preferred_tone}

FEEDBACK CONTEXT (Address these specific gaps & improvement areas):
${JSON.stringify(feedbackContext, null, 2)}

Provide compelling, practical ideas tailored for ${targetPlatform} formats (e.g. video reels/shorts, carousels, text posts, stories, polls). Each idea must explicitly solve a gap_addressed and have why_it_fits grounded in the feedback.
`;
      ideasData = await callGeminiStructured({
        systemPrompt: SYSTEM_IDEAS_PROMPT,
        userPrompt,
        schema: creativeIdeasResponseSchema
      });
    } catch (err) {
      console.warn('Gemini ideas generation failed, using intelligent fallback:', err.message);
      ideasData = getHeuristicIdeas(profile, targetPlatform);
    }
  } else {
    ideasData = getHeuristicIdeas(profile, targetPlatform);
  }

  // 3. Persist ideas to content_ideas table
  const insertedIdeas = [];
  for (const idea of ideasData.ideas) {
    const res = await query(`
      INSERT INTO content_ideas (
        profile_id, user_id, title, format, concept, hook,
        caption_direction, cta, reason, gap_addressed, effort, platform
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      idea.estimated_effort || 'MEDIUM',
      targetPlatform
    ]);
    insertedIdeas.push(res.rows[0]);
  }

  return insertedIdeas;
}

module.exports = {
  generateContentIdeas,
  getHeuristicIdeas
};
