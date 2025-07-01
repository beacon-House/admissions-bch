/*
  # Create Form Sessions Table - Clean Implementation
  
  1. New Tables
    - `form_sessions`
      - Core session tracking
      - Page 1: Student and academic information
      - Page 2: Parent contact and counseling details
      - System fields for lead categorization and funnel tracking
      
  2. Security
    - Enable RLS on `form_sessions` table
    - Add policies for public access (form submissions)
*/

-- Create the form_sessions table with consistent naming
CREATE TABLE IF NOT EXISTS form_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  environment text DEFAULT 'staging',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Page 1: Student Information
  form_filler_type text, -- parent, student
  student_first_name text,
  student_last_name text,
  current_grade text, -- 7_below, 8, 9, 10, 11, 12, masters
  phone_number text,
  
  -- Page 1: Academic Information  
  curriculum_type text, -- IB, IGCSE, CBSE, ICSE, State_Boards, Others
  grade_format text, -- gpa, percentage
  gpa_value text,
  percentage_value text,
  school_name text,
  
  -- Page 1: Study Preferences
  scholarship_requirement text, -- scholarship_optional, partial_scholarship, full_scholarship
  target_geographies jsonb, -- ["US", "UK", "Rest of World", "Need Guidance"]
  
  -- Page 2: Parent Contact Information
  parent_name text,
  parent_email text,
  
  -- Page 2A: Counseling Information (Qualified Leads Only)
  selected_date text,
  selected_slot text,
  
  -- System Fields
  lead_category text, -- bch, lum-l1, lum-l2, nurture, masters, drop
  is_counselling_booked boolean DEFAULT false,
  funnel_stage text DEFAULT 'initial_capture', -- initial_capture, contact_submitted, counseling_booked, completed
  is_qualified_lead boolean DEFAULT false,
  
  -- Form Progress Tracking
  page_completed integer DEFAULT 1, -- 1 or 2
  triggered_events jsonb DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE form_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for form submissions
CREATE POLICY "Allow public form submissions" ON form_sessions
  FOR ALL TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_form_sessions_session_id ON form_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_form_sessions_created_at ON form_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_sessions_lead_category ON form_sessions(lead_category);
CREATE INDEX IF NOT EXISTS idx_form_sessions_funnel_stage ON form_sessions(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_form_sessions_environment ON form_sessions(environment);

-- Create a simple upsert function
CREATE OR REPLACE FUNCTION upsert_form_session(form_data jsonb)
RETURNS jsonb AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO form_sessions (
    session_id,
    environment,
    form_filler_type,
    student_first_name,
    student_last_name,
    current_grade,
    phone_number,
    curriculum_type,
    grade_format,
    gpa_value,
    percentage_value,
    school_name,
    scholarship_requirement,
    target_geographies,
    parent_name,
    parent_email,
    selected_date,
    selected_slot,
    lead_category,
    is_counselling_booked,
    funnel_stage,
    is_qualified_lead,
    page_completed,
    triggered_events,
    created_at,
    updated_at
  ) VALUES (
    form_data->>'session_id',
    COALESCE(form_data->>'environment', 'staging'),
    form_data->>'form_filler_type',
    form_data->>'student_first_name',
    form_data->>'student_last_name',
    form_data->>'current_grade',
    form_data->>'phone_number',
    form_data->>'curriculum_type',
    form_data->>'grade_format',
    form_data->>'gpa_value',
    form_data->>'percentage_value',
    form_data->>'school_name',
    form_data->>'scholarship_requirement',
    form_data->'target_geographies',
    form_data->>'parent_name',
    form_data->>'parent_email',
    form_data->>'selected_date',
    form_data->>'selected_slot',
    form_data->>'lead_category',
    COALESCE((form_data->>'is_counselling_booked')::boolean, false),
    COALESCE(form_data->>'funnel_stage', 'initial_capture'),
    COALESCE((form_data->>'is_qualified_lead')::boolean, false),
    COALESCE((form_data->>'page_completed')::integer, 1),
    COALESCE(form_data->'triggered_events', '[]'::jsonb),
    COALESCE((form_data->>'created_at')::timestamptz, now()),
    now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    environment = EXCLUDED.environment,
    form_filler_type = COALESCE(EXCLUDED.form_filler_type, form_sessions.form_filler_type),
    student_first_name = COALESCE(EXCLUDED.student_first_name, form_sessions.student_first_name),
    student_last_name = COALESCE(EXCLUDED.student_last_name, form_sessions.student_last_name),
    current_grade = COALESCE(EXCLUDED.current_grade, form_sessions.current_grade),
    phone_number = COALESCE(EXCLUDED.phone_number, form_sessions.phone_number),
    curriculum_type = COALESCE(EXCLUDED.curriculum_type, form_sessions.curriculum_type),
    grade_format = COALESCE(EXCLUDED.grade_format, form_sessions.grade_format),
    gpa_value = COALESCE(EXCLUDED.gpa_value, form_sessions.gpa_value),
    percentage_value = COALESCE(EXCLUDED.percentage_value, form_sessions.percentage_value),
    school_name = COALESCE(EXCLUDED.school_name, form_sessions.school_name),
    scholarship_requirement = COALESCE(EXCLUDED.scholarship_requirement, form_sessions.scholarship_requirement),
    target_geographies = COALESCE(EXCLUDED.target_geographies, form_sessions.target_geographies),
    parent_name = COALESCE(EXCLUDED.parent_name, form_sessions.parent_name),
    parent_email = COALESCE(EXCLUDED.parent_email, form_sessions.parent_email),
    selected_date = COALESCE(EXCLUDED.selected_date, form_sessions.selected_date),
    selected_slot = COALESCE(EXCLUDED.selected_slot, form_sessions.selected_slot),
    lead_category = COALESCE(EXCLUDED.lead_category, form_sessions.lead_category),
    is_counselling_booked = COALESCE(EXCLUDED.is_counselling_booked, form_sessions.is_counselling_booked),
    funnel_stage = EXCLUDED.funnel_stage,
    is_qualified_lead = COALESCE(EXCLUDED.is_qualified_lead, form_sessions.is_qualified_lead),
    page_completed = GREATEST(EXCLUDED.page_completed, form_sessions.page_completed),
    triggered_events = COALESCE(EXCLUDED.triggered_events, form_sessions.triggered_events),
    updated_at = now()
  RETURNING id INTO result_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', result_id,
    'session_id', form_data->>'session_id'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upsert_form_session(jsonb) TO public;