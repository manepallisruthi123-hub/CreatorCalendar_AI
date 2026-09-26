-- Migration 003: Post Ingestion Support (CTA and Demo flag)
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS cta VARCHAR(255);
ALTER TABLE profile_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profile_posts_is_demo ON profile_posts(is_demo);
