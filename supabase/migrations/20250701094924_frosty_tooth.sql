/*
  # Create New Form Sessions Table v8.0

  1. New Tables
    - Drop existing `form_sessions` table
    - Create new `form_sessions` table with simplified 2-page form structure
    - Includes Page 1: Initial lead capture fields
    - Includes Page 2A: Qualified lead counseling fields  
    - Includes Page 2B: Disqualified lead contact fields
    - Includes System fields for analytics and tracking

  2. Security
    - Enable RLS on `form_sessions` table
    - Add policy for authenticated access

  3. Indexes
    - Primary key on id
    - Indexes for analytics queries
    - Composite indexes for conversion tracking
    - GIN index for JSON fields

  4. Constraints
    - Check constraints for data integrity
    - Valid funnel stages and page completion values
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.form_sessions CASCADE;

-- Create new table with updated schema for v8.0 form
CREATE TABLE public.form_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    environment text NOT NULL DEFAULT 'staging'::text,
    created_at timestamp with time zone DEFAULT now(),
    user_agent text,
    
    -- Page 1: Initial Lead Capture Data
    student_first_name text,
    student_last_name text,
    current_grade text,
    form_filler_type text,
    curriculum_type text,
    school_name text,
    grade_format text,
    gpa_value text,
    percentage_value text,
    scholarship_requirement text,
    target_geographies jsonb,
    phone_number text,
    
    -- Page 2: Contact and Counseling Data (conditional based on lead type)
    parent_name text,
    email text,
    counselling_slot_picked boolean DEFAULT false,
    counselling_date text,
    counselling_time text,
    
    -- System Generated Data & Analytics
    lead_category text,
    counselor_assigned text,
    total_time_spent integer,
    page_completed integer DEFAULT 1,
    funnel_stage text DEFAULT 'initial_capture'::text,
    is_qualified_lead boolean DEFAULT false,
    form_version text DEFAULT 'v8.0'::text,
    triggered_events jsonb,
    
    -- Tracking fields
    step_number numeric(2,1) DEFAULT 1.0,
    step_type text DEFAULT 'initial_capture'::text,
    step_completed integer DEFAULT 1
);

-- Add comments to the table and columns for better documentation
COMMENT ON TABLE public.form_sessions IS 'Tracks simplified 2-page form submissions with lead categorization and funnel analytics - v8.0';

-- Add column comments
COMMENT ON COLUMN public.form_sessions.session_id IS 'Unique session identifier for tracking user journey';
COMMENT ON COLUMN public.form_sessions.environment IS 'Environment where form was submitted (staging, production)';
COMMENT ON COLUMN public.form_sessions.student_first_name IS 'Student first name from Page 1';
COMMENT ON COLUMN public.form_sessions.student_last_name IS 'Student last name from Page 1';
COMMENT ON COLUMN public.form_sessions.current_grade IS 'Student grade level (7_below, 8, 9, 10, 11, 12, masters)';
COMMENT ON COLUMN public.form_sessions.form_filler_type IS 'Who filled the form (parent, student)';
COMMENT ON COLUMN public.form_sessions.curriculum_type IS 'Academic curriculum (IB, IGCSE, CBSE, ICSE, State_Boards, Others)';
COMMENT ON COLUMN public.form_sessions.school_name IS 'Name of student school';
COMMENT ON COLUMN public.form_sessions.grade_format IS 'Format of academic grade (gpa, percentage)';
COMMENT ON COLUMN public.form_sessions.gpa_value IS 'GPA value if gpa format selected';
COMMENT ON COLUMN public.form_sessions.percentage_value IS 'Percentage value if percentage format selected';
COMMENT ON COLUMN public.form_sessions.scholarship_requirement IS 'Level of scholarship needed (scholarship_optional, partial_scholarship, full_scholarship)';
COMMENT ON COLUMN public.form_sessions.target_geographies IS 'Selected target study destinations (US, UK, Rest of World, Need Guidance)';
COMMENT ON COLUMN public.form_sessions.phone_number IS 'Parent phone number for contact';
COMMENT ON COLUMN public.form_sessions.parent_name IS 'Parent full name from Page 2';
COMMENT ON COLUMN public.form_sessions.email IS 'Parent email address from Page 2';
COMMENT ON COLUMN public.form_sessions.counselling_slot_picked IS 'Whether a counseling slot was selected (Page 2A only)';
COMMENT ON COLUMN public.form_sessions.counselling_date IS 'Selected counseling date (Page 2A only)';
COMMENT ON COLUMN public.form_sessions.counselling_time IS 'Selected counseling time (Page 2A only)';
COMMENT ON COLUMN public.form_sessions.lead_category IS 'Determined lead category (bch, lum-l1, lum-l2, nurture, masters, drop)';
COMMENT ON COLUMN public.form_sessions.counselor_assigned IS 'Assigned counselor name (Viswanathan for BCH, Karthik for Luminaire)';
COMMENT ON COLUMN public.form_sessions.total_time_spent IS 'Total time spent on form in seconds';
COMMENT ON COLUMN public.form_sessions.page_completed IS 'Last page completed (1=initial capture, 2=final submission)';
COMMENT ON COLUMN public.form_sessions.funnel_stage IS 'Current stage in conversion funnel (initial_capture, counseling_booked, contact_submitted, abandoned)';
COMMENT ON COLUMN public.form_sessions.is_qualified_lead IS 'Quick flag for qualified leads (BCH, Luminaire L1, L2)';
COMMENT ON COLUMN public.form_sessions.form_version IS 'Form structure version for tracking changes';
COMMENT ON COLUMN public.form_sessions.triggered_events IS 'List of Meta Pixel events triggered during the session';

-- Add check constraints for data integrity
ALTER TABLE public.form_sessions
ADD CONSTRAINT chk_page_completed CHECK (page_completed >= 1 AND page_completed <= 2),
ADD CONSTRAINT chk_funnel_stage CHECK (funnel_stage IN (
  'initial_capture',
  'counseling_booked',
  'contact_submitted',
  'abandoned'
)),
ADD CONSTRAINT chk_lead_category CHECK (lead_category IN (
  'bch',
  'lum-l1', 
  'lum-l2',
  'nurture',
  'masters',
  'drop'
)),
ADD CONSTRAINT chk_form_filler_type CHECK (form_filler_type IN (
  'parent',
  'student'
)),
ADD CONSTRAINT chk_grade_format CHECK (grade_format IN (
  'gpa',
  'percentage'
)),
ADD CONSTRAINT chk_scholarship_requirement CHECK (scholarship_requirement IN (
  'scholarship_optional',
  'partial_scholarship', 
  'full_scholarship'
));

-- Enable Row Level Security
ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated access
CREATE POLICY "Enable read access for authenticated users"
  ON public.form_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON public.form_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for efficient analytics queries

-- Basic indexes
CREATE INDEX idx_form_sessions_session_id ON public.form_sessions(session_id);
CREATE INDEX idx_form_sessions_environment ON public.form_sessions(environment);
CREATE INDEX idx_form_sessions_created_at ON public.form_sessions(created_at);
CREATE INDEX idx_form_sessions_lead_category ON public.form_sessions(lead_category);
CREATE INDEX idx_form_sessions_form_filler_type ON public.form_sessions(form_filler_type);
CREATE INDEX idx_form_sessions_current_grade ON public.form_sessions(current_grade);
CREATE INDEX idx_form_sessions_scholarship_requirement ON public.form_sessions(scholarship_requirement);

-- New v8.0 specific indexes
CREATE INDEX idx_form_sessions_page_completed ON public.form_sessions(page_completed);
CREATE INDEX idx_form_sessions_funnel_stage ON public.form_sessions(funnel_stage);
CREATE INDEX idx_form_sessions_is_qualified ON public.form_sessions(is_qualified_lead);
CREATE INDEX idx_form_sessions_counselor ON public.form_sessions(counselor_assigned);
CREATE INDEX idx_form_sessions_form_version ON public.form_sessions(form_version);

-- JSON indexes
CREATE INDEX idx_form_sessions_target_geo ON public.form_sessions USING gin(target_geographies);
CREATE INDEX idx_form_sessions_triggered_events ON public.form_sessions USING gin(triggered_events);

-- Composite indexes for common analytics queries
CREATE INDEX idx_form_sessions_analytics ON public.form_sessions(
  environment,
  created_at,
  lead_category,
  funnel_stage
);

CREATE INDEX idx_form_sessions_conversion ON public.form_sessions(
  environment,
  form_filler_type,
  is_qualified_lead,
  page_completed
);

-- Index for funnel analysis
CREATE INDEX idx_form_sessions_funnel_analysis ON public.form_sessions(
  environment,
  created_at,
  page_completed,
  funnel_stage,
  total_time_spent
);

-- Index for lead category analysis
CREATE INDEX idx_form_sessions_category_analysis ON public.form_sessions(
  environment,
  created_at,
  lead_category,
  form_filler_type,
  is_qualified_lead
);