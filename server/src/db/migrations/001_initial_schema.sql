-- gen_random_uuid() is built into PostgreSQL 13+ and PGlite


-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Social Profiles table
CREATE TABLE IF NOT EXISTS social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL DEFAULT 'Instagram',
  profile_url TEXT NOT NULL,
  username VARCHAR(100) NOT NULL,
  niche VARCHAR(100),
  target_audience TEXT,
  content_goal TEXT,
  preferred_tone VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_user ON social_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_social_profiles_username ON social_profiles(username);

-- Profile Posts table (historical / sample posts analyzed)
CREATE TABLE IF NOT EXISTS profile_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_date TIMESTAMP WITH TIME ZONE,
  platform VARCHAR(50) DEFAULT 'Instagram',
  content_type VARCHAR(50),
  caption TEXT,
  hashtags JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_posts_profile ON profile_posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_posts_user ON profile_posts(user_id);

-- Profile Analyses table
CREATE TABLE IF NOT EXISTS profile_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_json JSONB NOT NULL,
  strengths_json JSONB NOT NULL,
  weaknesses_json JSONB NOT NULL,
  opportunities_json JSONB NOT NULL,
  content_mix_json JSONB NOT NULL,
  posting_time_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_analyses_profile ON profile_analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_analyses_user ON profile_analyses(user_id);

-- Analysis Recommendations table
CREATE TABLE IF NOT EXISTS analysis_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES profile_analyses(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT NOT NULL,
  action TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_analysis ON analysis_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON analysis_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON analysis_recommendations(user_id);

-- Content Ideas table
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  format VARCHAR(50) NOT NULL,
  concept TEXT NOT NULL,
  hook TEXT NOT NULL,
  caption_direction TEXT NOT NULL,
  cta TEXT NOT NULL,
  reason TEXT NOT NULL,
  gap_addressed TEXT NOT NULL,
  effort VARCHAR(20) DEFAULT 'MEDIUM',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_ideas_profile ON content_ideas(profile_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_user ON content_ideas(user_id);

-- Content Plans table
CREATE TABLE IF NOT EXISTS content_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  campaign_theme VARCHAR(255) NOT NULL,
  strategy_summary TEXT NOT NULL,
  strategy_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_plans_profile ON content_plans(profile_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_user ON content_plans(user_id);

-- Calendar Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL,
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  platform VARCHAR(50) DEFAULT 'Instagram',
  content_type VARCHAR(50) NOT NULL,
  topic TEXT NOT NULL,
  hook TEXT NOT NULL,
  caption TEXT NOT NULL,
  hashtags JSONB DEFAULT '[]'::jsonb,
  cta TEXT NOT NULL,
  goal VARCHAR(100) NOT NULL,
  suggested_time VARCHAR(20) NOT NULL,
  time_reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'DRAFT',
  ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_profile ON posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_plan ON posts(plan_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_date ON posts(scheduled_date);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES social_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_profile ON campaigns(profile_id);
