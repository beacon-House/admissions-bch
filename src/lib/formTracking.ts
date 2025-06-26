/**
 * Form Funnel Tracking Utility
 * 
 * Purpose: Provides background form funnel tracking functionality to capture user journey
 * through the multi-step form. Tracks each step completion and form data without affecting
 * user experience or form functionality.
 * 
 * Changes made:
 * - Updated to use Supabase instead of Neon
 * - Maintained all existing tracking logic and data structure
 * - Updated database insertion method for Supabase
 */

import { supabase } from './database';
import { 
  validateLeadCategory, 
  sanitizeLeadCategory, 
  logLeadCategoryError,
  validateFormDataConsistency 
} from './dataValidation';

// Generate unique session ID for tracking
export const generateSessionId = (): string => {
  return crypto.randomUUID();
};

// Get environment for tracking
const getEnvironment = (): string => {
  return import.meta.env.VITE_ENVIRONMENT?.trim() || 'staging';
};

// Interface for tracking data
interface FormTrackingData {
  session_id: string;
  step_number: number;
  step_type: string;
  environment: string;
  user_agent: string;
  
  // Personal details
  student_first_name?: string;
  student_last_name?: string;
  parent_name?: string;
  area_of_residence?: string;
  email?: string;
  phone_number?: string;
  whatsapp_consent?: boolean;
  current_grade?: string;
  form_filler_type?: string;
  
  // Academic details (regular)
  curriculum_type?: string;
  school_name?: string;
  grade_format?: string;
  gpa_value?: string;
  percentage_value?: string;
  target_university_rank?: string;
  preferred_countries?: string; // JSON string
  scholarship_requirement?: string;
  
  // Masters details
  graduation_status?: string;
  intake?: string;
  intake_other?: string;
  work_experience?: string;
  field_of_study?: string;
  entrance_exam?: string;
  exam_score?: string;
  application_preparation?: string;
  target_universities?: string;
  support_level?: string;
  
  // Extended nurture
  partial_funding_approach?: string;
  strong_profile_intent?: string;
  
  // Contact methods
  preferred_contact_methods?: string; // JSON string
  call_number?: string;
  whatsapp_number?: string;
  email_address?: string;
  
  // Counselling
  counselling_slot_picked?: boolean;
  counselling_date?: string;
  counselling_time?: string;
  
  // Metadata
  lead_category?: string;
  total_time_spent?: number;
  step_completed: number;
  created_at?: string;
}

/**
 * Track form step completion
 * Fire-and-forget async function that logs errors but doesn't throw
 */
export const trackFormStep = async (
  sessionId: string,
  stepNumber: number,
  stepType: string,
  formData: any
): Promise<void> => {
  try {
    // Validate and sanitize lead category before processing
    const originalCategory = formData.lead_category;
    const sanitizedCategory = sanitizeLeadCategory(originalCategory);
    
    // Only perform lead category validation if category is not null
    // This prevents validation errors during early steps where category hasn't been determined yet
    if (sanitizedCategory !== null) {
      if (originalCategory && !sanitizedCategory) {
        logLeadCategoryError(
          'Form Tracking - Invalid Category',
          originalCategory,
          sessionId,
          { stepNumber, stepType }
        );
      }
      
      // Validate complete form data consistency only when category exists
      const consistencyCheck = validateFormDataConsistency({
        ...formData,
        lead_category: sanitizedCategory
      });
      
      if (!consistencyCheck.isValid) {
        logLeadCategoryError(
          'Form Tracking - Data Consistency',
          sanitizedCategory,
          sessionId,
          { 
            errors: consistencyCheck.errors,
            warnings: consistencyCheck.warnings,
            stepNumber,
            stepType 
          }
        );
      }
    }
    
    const trackingData: FormTrackingData = {
      session_id: sessionId,
      step_number: stepNumber,
      step_type: stepType,
      environment: getEnvironment(),
      user_agent: navigator.userAgent,
      
      // Personal details
      student_first_name: formData.studentFirstName,
      student_last_name: formData.studentLastName,
      parent_name: formData.parentName,
      area_of_residence: formData.areaOfResidence,
      email: formData.email,
      phone_number: formData.phoneNumber,
      whatsapp_consent: formData.whatsappConsent,
      current_grade: formData.currentGrade,
      form_filler_type: formData.formFillerType,
      
      // Academic details (regular)
      curriculum_type: formData.curriculumType,
      school_name: formData.schoolName,
      grade_format: formData.gradeFormat,
      gpa_value: formData.gpaValue,
      percentage_value: formData.percentageValue,
      target_university_rank: formData.targetUniversityRank,
      preferred_countries: formData.preferredCountries ? JSON.stringify(formData.preferredCountries) : null,
      scholarship_requirement: formData.scholarshipRequirement,
      
      // Masters details
      graduation_status: formData.graduationStatus,
      intake: formData.intake,
      intake_other: formData.intakeOther,
      work_experience: formData.workExperience,
      field_of_study: formData.fieldOfStudy,
      entrance_exam: formData.entranceExam,
      exam_score: formData.examScore,
      application_preparation: formData.applicationPreparation,
      target_universities: formData.targetUniversities,
      support_level: formData.supportLevel,
      
      // Extended nurture
      partial_funding_approach: formData.extendedNurture?.partialFundingApproach,
      strong_profile_intent: formData.extendedNurture?.strongProfileIntent,
      
      // Contact methods
      preferred_contact_methods: formData.contactMethods ? JSON.stringify({
        call: formData.contactMethods.call,
        whatsapp: formData.contactMethods.whatsapp,
        email: formData.contactMethods.email
      }) : null,
      call_number: formData.contactMethods?.callNumber,
      whatsapp_number: formData.contactMethods?.whatsappNumber,
      email_address: formData.contactMethods?.emailAddress,
      
      // Counselling
      counselling_slot_picked: formData.counselling?.selectedDate ? true : false,
      counselling_date: formData.counselling?.selectedDate,
      counselling_time: formData.counselling?.selectedSlot,
      
      // Metadata
      lead_category: sanitizedCategory,
      total_time_spent: formData.totalTimeSpent || Math.floor((Date.now() - (formData.startTime || Date.now())) / 1000),
      step_completed: stepNumber,
      created_at: new Date().toISOString()
    };

    // Insert tracking data into Supabase
    const { data, error } = await supabase
      .from('form_sessions')
      .insert([trackingData])
      .select();

    if (error) {
      throw error;
    }
    
    // Validate that the data was saved correctly
    if (data && data[0]) {
      const savedCategory = data[0].lead_category;
      if (sanitizedCategory && savedCategory !== sanitizedCategory) {
        logLeadCategoryError(
          'Form Tracking - Save Mismatch',
          { intended: sanitizedCategory, saved: savedCategory },
          sessionId,
          { stepNumber, stepType, trackingData }
        );
      }
    }

    console.log(`Form tracking: Step ${stepNumber} (${stepType}) tracked for session ${sessionId}`);
    
  } catch (error) {
    // Silent error handling - log but don't throw
    console.error('Form tracking error:', error);
    // Form must continue working even if tracking fails
  }
};

/**
 * Track form step with simplified interface
 * Used for direct calls from form components
 */
export const trackStep = (
  sessionId: string,
  stepNumber: number,
  stepType: string,
  formData: any
): void => {
  // Fire and forget - don't await
  trackFormStep(sessionId, stepNumber, stepType, formData);
};