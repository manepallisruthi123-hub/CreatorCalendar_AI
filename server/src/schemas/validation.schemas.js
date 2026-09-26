const { z } = require('zod');

// Authentication schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Social profile schemas
const socialProfileSchema = z.object({
  creator_name: z.string().optional().default(''),
  platform: z.string().default('Instagram'),
  preferred_platforms: z.union([z.array(z.string()), z.string()]).optional().default(['Instagram']),
  profile_url: z.string().min(1, 'Profile URL is required'),
  username: z.string().min(1, 'Username is required'),
  niche: z.string().optional().default('General'),
  target_audience: z.string().optional().default('General Audience'),
  content_goal: z.string().optional().default('Growth & Engagement'),
  preferred_tone: z.string().optional().default('Authentic & Professional'),
  timezone: z.string().optional().default('Asia/Kolkata')
});

const updateSocialProfileSchema = socialProfileSchema.partial();

// Profile post schema (for manual entry or CSV ingestion)
const profilePostSchema = z.object({
  post_date: z.string().optional().nullable(),
  platform: z.string().default('Instagram'),
  content_type: z.string().min(1, 'Content type is required'), // Reel, Carousel, Story, Image, Static Post
  caption: z.string().optional().default(''),
  hashtags: z.union([z.array(z.string()), z.string()]).optional().default([]),
  likes: z.coerce.number().int().nonnegative().optional().default(0),
  comments: z.coerce.number().int().nonnegative().optional().default(0),
  views: z.coerce.number().int().nonnegative().optional().default(0),
  reach: z.coerce.number().int().nonnegative().optional().default(0),
  engagement_rate: z.coerce.number().nonnegative().optional().default(0),
  cta: z.string().optional().default(''),
  is_demo: z.boolean().optional().default(false)
});

const strengthItemSchema = z.union([
  z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    evidence: z.string().optional().default('')
  }),
  z.string().transform(str => ({ title: str, description: str, evidence: 'Identified in profile analysis' }))
]);

const weaknessItemSchema = z.union([
  z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    evidence: z.string().optional().default('')
  }),
  z.string().transform(str => ({ title: str, description: str, evidence: 'Identified in profile analysis' }))
]);

const opportunityItemSchema = z.union([
  z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    action: z.string().optional().default('Implement recommended content strategy'),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).or(z.string()).optional().default('MEDIUM')
  }),
  z.string().transform(str => ({ title: str, description: str, action: 'Implement recommended content strategy', priority: 'MEDIUM' }))
]);

const postingWindowItemSchema = z.object({
  day: z.string(),
  start: z.string(),
  end: z.string(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).or(z.string()).optional().default('MEDIUM'),
  reason: z.string().optional().default('Suggested window based on audience behavior')
});

// AI Profile Analysis schema (matching Section 20)
const nullableIndicatorSchema = z.union([
  z.number(),
  z.null()
]).optional();

const profileAnalysisSchema = z.object({
  analysis_mode: z.enum(['STARTER_STRATEGY', 'EARLY_CONTENT', 'PROFILE_ANALYSIS']).or(z.string()).optional().default('PROFILE_ANALYSIS'),
  data_confidence: z.enum(['NONE', 'LIMITED', 'HIGH', 'LOW', 'MEDIUM']).or(z.string()).optional().default('HIGH'),
  profile_summary: z.object({
    niche: z.string(),
    audience: z.string(),
    positioning: z.string()
  }),
  content_mix: z.array(z.object({
    content_type: z.string(),
    percentage: z.coerce.number()
  })),
  content_themes: z.array(z.object({
    theme: z.string(),
    percentage: z.coerce.number()
  })).optional().default([]),
  consistency: z.object({
    indicator: nullableIndicatorSchema,
    explanation: z.string().optional().default('')
  }),
  content_variety: z.object({
    indicator: nullableIndicatorSchema,
    explanation: z.string().optional().default('')
  }),
  caption_quality: z.object({
    indicator: nullableIndicatorSchema,
    explanation: z.string().optional().default('')
  }),
  cta_usage: z.object({
    indicator: nullableIndicatorSchema,
    explanation: z.string().optional().default('')
  }),
  strengths: z.array(strengthItemSchema).optional().default([]),
  weaknesses: z.array(weaknessItemSchema).optional().default([]),
  opportunities: z.array(opportunityItemSchema).optional().default([]),
  content_gaps: z.array(z.union([
    z.string(),
    z.object({
      gap: z.string().optional().default(''),
      recommendation: z.string().optional().default('')
    })
  ])).optional().default([]),
  posting_windows: z.array(postingWindowItemSchema).optional().default([]),
  recommended_next_posts: z.array(z.object({
    title: z.string(),
    format: z.string().optional().default('Post'),
    concept: z.string().optional().default(''),
    hook: z.string().optional().default(''),
    caption: z.string().optional().default(''),
    cta: z.string().optional().default(''),
    hashtags: z.array(z.string()).optional().default([])
  })).optional().default([])
});

// Recommendation schema
const recommendationUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED'])
});

// Creative Idea schema (Section 21)
const creativeIdeaItemSchema = z.object({
  title: z.string(),
  format: z.string(),
  concept: z.string(),
  hook: z.string(),
  caption_direction: z.string(),
  cta: z.string(),
  why_it_fits: z.string(),
  gap_addressed: z.string(),
  estimated_effort: z.enum(['LOW', 'MEDIUM', 'HIGH']).or(z.string())
});

const creativeIdeasResponseSchema = z.object({
  ideas: z.array(creativeIdeaItemSchema)
});

// Calendar Post schema (Section 22)
const calendarPostSchema = z.object({
  day: z.string(),
  date: z.string(),
  platform: z.string().default('Instagram'),
  content_type: z.string(),
  topic: z.string(),
  hook: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  goal: z.string(),
  suggested_time: z.string(),
  time_reason: z.string()
});

// Content Plan schema
const contentPlanResponseSchema = z.object({
  campaign_theme: z.string(),
  strategy_summary: z.string(),
  content_pillars: z.array(z.string()),
  content_mix: z.array(z.object({
    content_type: z.string(),
    percentage: z.number()
  })),
  posts: z.array(calendarPostSchema)
});

// Post update schema
const postUpdateSchema = z.object({
  topic: z.string().optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  cta: z.string().optional(),
  goal: z.string().optional(),
  suggested_time: z.string().optional(),
  content_type: z.string().optional(),
  scheduled_date: z.string().optional(),
  status: z.enum(['DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional()
});

// Post status update schema
const postStatusSchema = z.object({
  status: z.enum(['DRAFT', 'READY', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'])
});

// Post regeneration request schema
const postRegenerateRequestSchema = z.object({
  post_id: z.string().uuid(),
  tone: z.string().optional(),
  content_type: z.string().optional(),
  objective: z.string().optional(),
  instruction: z.string().optional()
});

// Feedback schemas (Section: FEEDBACK JSON)
const feedbackDimensionSchema = z.object({
  name: z.string(),
  score: z.number().nullable().optional(),
  status: z.enum(['EVALUATED', 'INSUFFICIENT_DATA']).optional().default('EVALUATED'),
  explanation: z.string().optional().default('')
});

const feedbackStrengthSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(''),
  evidence: z.string().optional().default('')
});

const feedbackImprovementAreaSchema = z.object({
  title: z.string(),
  current_state: z.string().optional().default(''),
  evidence: z.string().optional().default(''),
  recommendation: z.string(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).or(z.string()).default('MEDIUM'),
  suggested_frequency: z.string().optional().default('2-3x per week')
});

const feedbackContentGapSchema = z.object({
  gap: z.string(),
  why_it_matters: z.string().optional().default(''),
  recommended_action: z.string().optional().default('')
});

const feedbackResponseSchema = z.object({
  overall_score: z.coerce.number().min(0).max(100),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).or(z.string()).default('LOW'),
  summary: z.string(),
  dimensions: z.array(feedbackDimensionSchema).optional().default([]),
  strengths: z.array(feedbackStrengthSchema).default([]),
  improvement_areas: z.array(feedbackImprovementAreaSchema).default([]),
  content_gaps: z.array(feedbackContentGapSchema).default([]),
  next_steps: z.array(z.string()).default([])
});

module.exports = {
  registerSchema,
  loginSchema,
  socialProfileSchema,
  updateSocialProfileSchema,
  profilePostSchema,
  profileAnalysisSchema,
  feedbackDimensionSchema,
  feedbackStrengthSchema,
  feedbackImprovementAreaSchema,
  feedbackContentGapSchema,
  feedbackResponseSchema,
  recommendationUpdateSchema,
  creativeIdeaItemSchema,
  creativeIdeasResponseSchema,
  calendarPostSchema,
  contentPlanResponseSchema,
  postUpdateSchema,
  postStatusSchema,
  postRegenerateRequestSchema
};
