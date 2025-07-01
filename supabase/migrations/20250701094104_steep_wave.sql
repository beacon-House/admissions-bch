/*
  # Update form_sessions table for simplified form structure v8.0

  1. Schema Updates
    - Add new simplified form fields
    - Update existing fields for new structure
    - Add page/funnel tracking fields
    - Maintain backward compatibility

  2. New Fields Added
    - `target_geographies` (jsonb) - Replaces preferred_countries
    - `counselor_assigned` (text) - Track assigned counselor
    - `page_completed` (integer) - Track page completion
    - `funnel_stage` (text) - Track funnel progression
    - `is_qualified_lead` (boolean) - Quick qualification flag

  3. Indexes
    - Add indexes for new query patterns
    - Optimize for page/funnel analytics

  4. Data Migration
    - Migrate existing data to new structure
    - Set default values for new fields
*/

-- Add new columns for simplified form structure
ALTER TABLE form_sessions 
ADD COLUMN IF NOT EXISTS target_geographies jsonb,
ADD COLUMN IF NOT EXISTS counselor_assigned text,
ADD COLUMN IF NOT EXISTS page_completed integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS funnel_stage text DEFAULT 'initial_capture',
ADD COLUMN IF NOT EXISTS is_qualified_lead boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS form_version text DEFAULT 'v8.0';

-- Update existing data to set qualified lead flags
UPDATE form_sessions 
SET is_qualified_lead = true 
WHERE lead_category IN ('bch', 'lum-l1', 'lum-l2');

-- Set counselor assignments based on lead category
UPDATE form_sessions 
SET counselor_assigned = CASE 
  WHEN lead_category = 'bch' THEN 'Viswanathan'
  WHEN lead_category IN ('lum-l1', 'lum-l2') THEN 'Karthik Lakshman'
  ELSE NULL
END
WHERE counselor_assigned IS NULL;

-- Migrate preferred_countries to target_geographies
UPDATE form_sessions 
SET target_geographies = preferred_countries
WHERE target_geographies IS NULL AND preferred_countries IS NOT NULL;

-- Set funnel stages based on step completion
UPDATE form_sessions 
SET funnel_stage = CASE 
  WHEN step_completed = 1 THEN 'initial_capture'
  WHEN step_completed = 2 AND is_qualified_lead = true THEN 'counseling_booked'
  WHEN step_completed = 2 AND is_qualified_lead = false THEN 'contact_submitted'
  ELSE 'initial_capture'
END
WHERE funnel_stage = 'initial_capture';

-- Set page completion based on step completion
UPDATE form_sessions 
SET page_completed = CASE 
  WHEN step_completed >= 2 THEN 2
  ELSE 1
END
WHERE page_completed = 1;

-- Add new indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_form_sessions_page_completed ON form_sessions(page_completed);
CREATE INDEX IF NOT EXISTS idx_form_sessions_funnel_stage ON form_sessions(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_form_sessions_is_qualified ON form_sessions(is_qualified_lead);
CREATE INDEX IF NOT EXISTS idx_form_sessions_counselor ON form_sessions(counselor_assigned);
CREATE INDEX IF NOT EXISTS idx_form_sessions_target_geo ON form_sessions USING gin(target_geographies);
CREATE INDEX IF NOT EXISTS idx_form_sessions_form_version ON form_sessions(form_version);

-- Add composite indexes for common analytics queries
CREATE INDEX IF NOT EXISTS idx_form_sessions_analytics ON form_sessions(
  environment, 
  created_at, 
  lead_category, 
  funnel_stage
);

CREATE INDEX IF NOT EXISTS idx_form_sessions_conversion ON form_sessions(
  environment,
  form_filler_type,
  is_qualified_lead,
  page_completed
);

-- Add check constraints for data integrity
ALTER TABLE form_sessions 
ADD CONSTRAINT chk_page_completed CHECK (page_completed >= 1 AND page_completed <= 2),
ADD CONSTRAINT chk_funnel_stage CHECK (funnel_stage IN (
  'initial_capture', 
  'counseling_booked', 
  'contact_submitted',
  'abandoned'
));

-- Update table comment
COMMENT ON TABLE form_sessions IS 'Tracks simplified 2-page form submissions with lead categorization and funnel analytics - v8.0';

-- Add column comments
COMMENT ON COLUMN form_sessions.target_geographies IS 'Selected target study destinations (US, UK, Rest of World, Need Guidance)';
COMMENT ON COLUMN form_sessions.counselor_assigned IS 'Assigned counselor name (Viswanathan for BCH, Karthik for Luminaire)';
COMMENT ON COLUMN form_sessions.page_completed IS 'Last page completed (1=initial capture, 2=final submission)';
COMMENT ON COLUMN form_sessions.funnel_stage IS 'Current stage in conversion funnel';
COMMENT ON COLUMN form_sessions.is_qualified_lead IS 'Quick flag for qualified leads (BCH, Luminaire L1, L2)';
COMMENT ON COLUMN form_sessions.form_version IS 'Form structure version for tracking changes';