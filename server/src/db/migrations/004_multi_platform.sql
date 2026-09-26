-- Migration 004: Multi-platform Social Accounts & Creator Extensions

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_user_id VARCHAR(255),
  username VARCHAR(255),
  display_name VARCHAR(255),
  profile_url TEXT,
  avatar_url TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);

-- Add creator profile extensions
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS creator_name VARCHAR(255);
ALTER TABLE social_profiles ADD COLUMN IF NOT EXISTS preferred_platforms JSONB DEFAULT '["Instagram"]'::jsonb;
ALTER TABLE social_profiles ALTER COLUMN timezone SET DEFAULT 'Asia/Kolkata';

-- Add platform and hashtags fields to content_ideas
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'Instagram';
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS hashtags JSONB DEFAULT '[]'::jsonb;
