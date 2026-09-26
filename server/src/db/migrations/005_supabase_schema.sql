-- Migration 005: Supabase Schema Extensions & Alignment

-- 1. USERS: Add auth_provider, email_verified
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- 2. SOCIAL ACCOUNTS: Add connection_status
ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS connection_status VARCHAR(50) DEFAULT 'CONNECTED';

-- 3. PROFILE POSTS: Add social_account_id, platform_post_id, title, description, permalink, published_at
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL;
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS platform_post_id VARCHAR(255);
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS permalink TEXT;
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Ensure metrics are nullable (allow NULL for missing/unavailable real metrics)
ALTER TABLE profile_posts ALTER COLUMN likes DROP NOT NULL;
ALTER TABLE profile_posts ALTER COLUMN comments DROP NOT NULL;
ALTER TABLE profile_posts ALTER COLUMN views DROP NOT NULL;
ALTER TABLE profile_posts ALTER COLUMN reach DROP NOT NULL;
ALTER TABLE profile_posts ALTER COLUMN engagement_rate DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_posts_social_account ON profile_posts(social_account_id);
CREATE INDEX IF NOT EXISTS idx_profile_posts_is_demo ON profile_posts(is_demo);

-- 4. PROFILE ANALYSES: Add social_account_id, analysis_mode, data_confidence, updated_at
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL;
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS analysis_mode VARCHAR(50) DEFAULT 'PROFILE_ANALYSIS';
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS data_confidence VARCHAR(50) DEFAULT 'HIGH';
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_profile_analyses_social_account ON profile_analyses(social_account_id);

-- 5. CONTENT IDEAS: Add status, caption, why_it_fits, updated_at
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS why_it_fits TEXT;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 6. CONTENT PLANS: Add name, start_date, end_date, goal
ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS goal TEXT;

-- 7. POSTS / CALENDAR ITEMS: Add content_plan_id, scheduled_at, published_at
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- 8. CAMPAIGNS: Add description, goal
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS goal TEXT;
