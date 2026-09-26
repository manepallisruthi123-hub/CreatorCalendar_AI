-- Migration 006: Feedback Alignment & Decoupling
-- Ensures profile_analyses and analysis_recommendations support the comprehensive Feedback JSON schema

ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS confidence VARCHAR(50) DEFAULT 'LOW';
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS dimensions_json JSONB;
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS content_gaps_json JSONB;
ALTER TABLE profile_analyses ADD COLUMN IF NOT EXISTS next_steps_json JSONB;

-- Extend analysis_recommendations with current_state and suggested_frequency
ALTER TABLE analysis_recommendations ADD COLUMN IF NOT EXISTS current_state TEXT;
ALTER TABLE analysis_recommendations ADD COLUMN IF NOT EXISTS suggested_frequency VARCHAR(255);

-- Ensure index on profile_analyses overall_score
CREATE INDEX IF NOT EXISTS idx_profile_analyses_score ON profile_analyses(overall_score);
