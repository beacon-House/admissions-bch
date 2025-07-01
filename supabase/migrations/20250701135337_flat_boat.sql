/*
  # Fix Counselling Data Capture

  This migration updates the form data handling to properly capture counselling slot information:
  1. Updates field names to match webhook payload (counsellingDate, counsellingTime, counsellingSlotPicked)
  2. Fixes boolean casting for counselling_slot_picked field
  3. Ensures consistent data flow from form to database

  ## Changes Made
  - Updated upsert_form_session function to use correct field names
  - Fixed boolean type casting for counselling_slot_picked
  - Improved data consistency for counselling appointments
*/

-- Update the upsert_form_session function to handle counselling data correctly
CREATE OR REPLACE FUNCTION upsert_form_session(p_form_data jsonb)
RETURNS jsonb AS $$
DECLARE
  v_session_id text;
  v_result jsonb;
BEGIN
  -- Extract session_id from the form data
  v_session_id := (p_form_data->>'session_id')::text;
  
  -- If no session_id provided, generate one
  IF v_session_id IS NULL THEN
    v_session_id := gen_random_uuid()::text;
  END IF;

  -- Upsert the form session data
  INSERT INTO form_sessions (
    session_id,
    environment,
    user_agent,
    student_first_name,
    student_last_name,
    current_grade,
    form_filler_type,
    curriculum_type,
    school_name,
    grade_format,
    gpa_value,
    percentage_value,
    scholarship_requirement,
    target_geographies,
    phone_number,
    parent_name,
    email,
    area_of_residence,
    whatsapp_consent,
    counselling_date,
    counselling_time,
    counselling_slot_picked,
    lead_category,
    counselor_assigned,
    total_time_spent,
    page_completed,
    funnel_stage,
    is_qualified_lead,
    form_version,
    triggered_events,
    step_number,
    step_type,
    step_completed,
    created_at,
    updated_at
  ) VALUES (
    v_session_id,
    COALESCE((p_form_data->>'environment')::text, 'staging'),
    (p_form_data->>'user_agent')::text,
    (p_form_data->>'studentFirstName')::text,
    (p_form_data->>'studentLastName')::text,
    (p_form_data->>'currentGrade')::text,
    (p_form_data->>'formFillerType')::text,
    (p_form_data->>'curriculumType')::text,
    (p_form_data->>'schoolName')::text,
    (p_form_data->>'gradeFormat')::text,
    (p_form_data->>'gpaValue')::text,
    (p_form_data->>'percentageValue')::text,
    (p_form_data->>'scholarshipRequirement')::text,
    (p_form_data->>'preferredCountries')::jsonb,
    (p_form_data->>'phoneNumber')::text,
    (p_form_data->>'parentName')::text,
    (p_form_data->>'email')::text,
    (p_form_data->>'areaOfResidence')::text,
    COALESCE((p_form_data->>'whatsappConsent')::boolean, true),
    (p_form_data->>'counsellingDate')::text,
    (p_form_data->>'counsellingTime')::text,
    COALESCE((p_form_data->>'counsellingSlotPicked')::boolean, false),
    (p_form_data->>'lead_category')::text,
    (p_form_data->>'counselor_assigned')::text,
    COALESCE((p_form_data->>'total_time_spent')::integer, 0),
    COALESCE((p_form_data->>'step_completed')::integer, 1),
    COALESCE((p_form_data->>'funnel_stage')::text, 'initial_capture'),
    COALESCE((p_form_data->>'is_qualified_lead')::boolean, false),
    COALESCE((p_form_data->>'form_version')::text, 'v8.0'),
    (p_form_data->>'triggered_events')::jsonb,
    COALESCE((p_form_data->>'step_number')::numeric, 1.0),
    COALESCE((p_form_data->>'step_type')::text, 'initial_capture'),
    COALESCE((p_form_data->>'step_completed')::integer, 1),
    COALESCE((p_form_data->>'created_at')::timestamptz, now()),
    now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    environment = COALESCE((p_form_data->>'environment')::text, form_sessions.environment),
    user_agent = COALESCE((p_form_data->>'user_agent')::text, form_sessions.user_agent),
    student_first_name = COALESCE((p_form_data->>'studentFirstName')::text, form_sessions.student_first_name),
    student_last_name = COALESCE((p_form_data->>'studentLastName')::text, form_sessions.student_last_name),
    current_grade = COALESCE((p_form_data->>'currentGrade')::text, form_sessions.current_grade),
    form_filler_type = COALESCE((p_form_data->>'formFillerType')::text, form_sessions.form_filler_type),
    curriculum_type = COALESCE((p_form_data->>'curriculumType')::text, form_sessions.curriculum_type),
    school_name = COALESCE((p_form_data->>'schoolName')::text, form_sessions.school_name),
    grade_format = COALESCE((p_form_data->>'gradeFormat')::text, form_sessions.grade_format),
    gpa_value = COALESCE((p_form_data->>'gpaValue')::text, form_sessions.gpa_value),
    percentage_value = COALESCE((p_form_data->>'percentageValue')::text, form_sessions.percentage_value),
    scholarship_requirement = COALESCE((p_form_data->>'scholarshipRequirement')::text, form_sessions.scholarship_requirement),
    target_geographies = COALESCE((p_form_data->>'preferredCountries')::jsonb, form_sessions.target_geographies),
    phone_number = COALESCE((p_form_data->>'phoneNumber')::text, form_sessions.phone_number),
    parent_name = COALESCE((p_form_data->>'parentName')::text, form_sessions.parent_name),
    email = COALESCE((p_form_data->>'email')::text, form_sessions.email),
    area_of_residence = COALESCE((p_form_data->>'areaOfResidence')::text, form_sessions.area_of_residence),
    whatsapp_consent = COALESCE((p_form_data->>'whatsappConsent')::boolean, form_sessions.whatsapp_consent),
    counselling_date = COALESCE((p_form_data->>'counsellingDate')::text, form_sessions.counselling_date),
    counselling_time = COALESCE((p_form_data->>'counsellingTime')::text, form_sessions.counselling_time),
    counselling_slot_picked = COALESCE((p_form_data->>'counsellingSlotPicked')::boolean, form_sessions.counselling_slot_picked),
    lead_category = COALESCE((p_form_data->>'lead_category')::text, form_sessions.lead_category),
    counselor_assigned = COALESCE((p_form_data->>'counselor_assigned')::text, form_sessions.counselor_assigned),
    total_time_spent = COALESCE((p_form_data->>'total_time_spent')::integer, form_sessions.total_time_spent),
    page_completed = COALESCE((p_form_data->>'step_completed')::integer, form_sessions.page_completed),
    funnel_stage = COALESCE((p_form_data->>'funnel_stage')::text, form_sessions.funnel_stage),
    is_qualified_lead = COALESCE((p_form_data->>'is_qualified_lead')::boolean, form_sessions.is_qualified_lead),
    form_version = COALESCE((p_form_data->>'form_version')::text, form_sessions.form_version),
    triggered_events = COALESCE((p_form_data->>'triggered_events')::jsonb, form_sessions.triggered_events),
    step_number = COALESCE((p_form_data->>'step_number')::numeric, form_sessions.step_number),
    step_type = COALESCE((p_form_data->>'step_type')::text, form_sessions.step_type),
    step_completed = COALESCE((p_form_data->>'step_completed')::integer, form_sessions.step_completed),
    updated_at = now()
  RETURNING *;

  -- Return success response with session_id
  SELECT jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'message', 'Form session upserted successfully'
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error response
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'session_id', v_session_id
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION upsert_form_session(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_form_session(jsonb) TO anon;