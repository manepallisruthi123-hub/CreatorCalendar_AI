const { z } = require('zod');

// Authentication schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Social profile schemas
const socialProfileSchema = z.object({
  platform: z.string().default('Instagram'),
  profile_url: z.string().min(1, 'Profile URL is required'),
  username: z.string().min(1, 'Username is required'),
  niche: z.string().optional().default('General'),
  target_audience: z.string().optional().default('General Audience'),
  content_goal: z.string().optional().default('Growth & Engagement'),
  preferred_tone: z.string().optional().default('Authentic & Professional'),
  timezone: z.string().optional().default('UTC')
});

const updateSocialProfileSchema = socialProfileSchema.partial();

// Profile post schema (for manual entry or CSV ingestion)
const profilePostSchema = z.object({
  post_date: z.string().optional().nullable(),
  platform: z.string().default('Instagram'),
  content_type: z.string().min(1, 'Content type is required'), // Reel, Carousel, Story, Static Post
  caption: z.string().optional().default(''),
  hashtags: z.array(z.string()).optional().default([]),
  likes: z.number().int().nonnegative().optional().default(0),
  comments: z.number().int().nonnegative().optional().default(0),
  views: z.number().int().nonnegative().optional().default(0),
  reach: z.number().int().nonnegative().optional().default(0),
  engagement_rate: z.number().nonnegative().optional().default(0)
});

// AI Profile Analysis schema (matching Section 20)
const profileAnalysisSchema = z.object({
  profile_summary: z.object({
    niche: z.string(),
    audience: z.string(),
    positioning: z.string()
  }),
  content_mix: z.array(z.object({
    content_type: z.string(),
    percentage: z.number()
  })),
  content_themes: z.array(z.object({
    theme: z.string(),
    percentage: z.number()
  })),
  consistency: z.object({
    indicator: z.number(),
    explanation: z.string()
  }),
  content_variety: z.object({
    indicator: z.number(),
    explanation: z.string()
  }),
  caption_quality: z.object({
    indicator: z.number(),
    explanation: z.string()
  }),
  cta_usage: z.object({
    indicator: z.number(),
    explanation: z.string()
  }),
  strengths: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string()
  })),
  weaknesses: z.array(z.object({
    title: z.string(),
    description: z.string(),
    evidence: z.string()
  })),
  opportunities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    action: z.string(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).or(z.string())
  })),
  posting_windows: z.array(z.object({
    day: z.string(),
    start: z.string(),
    end: z.string(),
    confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).or(z.string()),
    reason: z.string()
  }))
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
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).optional()
});

// Post status update schema
const postStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'])
});

// Post regeneration request schema
const postRegenerateRequestSchema = z.object({
  post_id: z.string().uuid(),
  tone: z.string().optional(),
  content_type: z.string().optional(),
  objective: z.string().optional(),
  instruction: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  socialProfileSchema,
  updateSocialProfileSchema,
  profilePostSchema,
  profileAnalysisSchema,
  recommendationUpdateSchema,
  creativeIdeaItemSchema,
  creativeIdeasResponseSchema,
  calendarPostSchema,
  contentPlanResponseSchema,
  postUpdateSchema,
  postStatusSchema,
  postRegenerateRequestSchema
};
