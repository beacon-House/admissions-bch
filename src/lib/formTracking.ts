/**
 * Form Funnel Tracking Utility v8.1
 * 
 * Purpose: Provides incremental form tracking for progressive data saving.
 * Saves form data after each section completion to ensure no data loss.
 * 
 * Changes made:
 * - Implemented incremental data saving using upsert function
 * - Added session-based tracking with proper data persistence
 * - Maintains session ID consistency across all interactions
 * - Progressive form data building with each step
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

// Funnel stages
export type FunnelStage = 'initial_capture' | 'counseling_booked' | 'contact_submitted' | 'abandoned';

/**
 * Save form data incrementally using the upsert function
 * This ensures data is preserved at each step of the form
 */
export const saveFormDataIncremental = async (
  sessionId: string,
  stepNumber: number,
  stepType: string,
  formData: any
): Promise<void> => {
  try {
    // Validate and sanitize lead category if present
    const originalCategory = formData.lead_category;
    let sanitizedCategory = originalCategory;
    
    if (originalCategory) {
      sanitizedCategory = sanitizeLeadCategory(originalCategory);
      
      if (originalCategory && !sanitizedCategory) {
        logLeadCategoryError(
          'Incremental Save - Invalid Category',
          originalCategory,
          sessionId,
          { stepNumber, stepType }
        );
      }
    }

    // Prepare form data for database storage
    const dbFormData = {
      ...formData,
      lead_category: sanitizedCategory,
      sessionId: sessionId,
      total_time_spent: Math.floor((Date.now() - (formData.startTime || Date.now())) / 1000),
      triggeredEvents: formData.triggeredEvents || []
    };

    // Use the upsert function to save/update data
    const { data, error } = await supabase.rpc('upsert_form_session', {
      p_session_id: sessionId,
      p_step_number: stepNumber,
      p_step_type: stepType,
      p_environment: getEnvironment(),
      p_user_agent: navigator.userAgent,
      p_form_data: dbFormData
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Form data saved incrementally: Step ${stepNumber} (${stepType}) for session ${sessionId}`);
    
  } catch (error) {
    console.error('❌ Incremental form save error:', error);
    // Don't throw - form should continue working even if tracking fails
  }
};

/**
 * Track form section completion with incremental saving
 * This replaces the old trackStep function with proper data persistence
 */
export const trackFormSection = async (
  sessionId: string,
  sectionName: string,
  sectionData: any,
  currentStep: number
): Promise<void> => {
  try {
    console.log(`📝 Tracking form section: ${sectionName} for session ${sessionId}`);
    
    // Save the data incrementally
    await saveFormDataIncremental(
      sessionId,
      currentStep,
      sectionName,
      sectionData
    );
    
  } catch (error) {
    console.error('Form section tracking error:', error);
    // Silent error - don't break form flow
  }
};

/**
 * Track form page completion
 */
export const trackPageCompletion = async (
  sessionId: string,
  pageNumber: number,
  pageType: string,
  formData: any
): Promise<void> => {
  try {
    console.log(`📄 Tracking page completion: Page ${pageNumber} (${pageType}) for session ${sessionId}`);
    
    // Save complete page data
    await saveFormDataIncremental(
      sessionId,
      pageNumber,
      pageType,
      formData
    );
    
  } catch (error) {
    console.error('Page completion tracking error:', error);
  }
};

/**
 * Track final form submission
 */
export const trackFormSubmission = async (
  sessionId: string,
  formData: any,
  isComplete: boolean = true
): Promise<void> => {
  try {
    console.log(`🎯 Tracking form submission for session ${sessionId}`);
    
    // Mark as final submission
    const finalData = {
      ...formData,
      is_final_submission: isComplete,
      submission_timestamp: new Date().toISOString()
    };
    
    await saveFormDataIncremental(
      sessionId,
      formData.currentStep || 2,
      'final_submission',
      finalData
    );
    
  } catch (error) {
    console.error('Form submission tracking error:', error);
  }
};

/**
 * Get form data for a session (for recovery purposes)
 */
export const getSessionData = async (sessionId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('form_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Failed to get session data:', error);
    return null;
  }
};

/**
 * Track funnel abandonment
 */
export const trackFunnelAbandonment = async (
  sessionId: string,
  currentPage: number,
  timeSpent: number
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('form_sessions')
      .update({
        funnel_stage: 'abandoned',
        total_time_spent: timeSpent,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      throw error;
    }
    
    console.log(`Funnel abandonment tracked for session ${sessionId} at page ${currentPage}`);
    
  } catch (error) {
    console.error('Abandonment tracking error:', error);
  }
};

/**
 * Legacy function for backward compatibility
 */
export const trackStep = (
  sessionId: string,
  stepNumber: number,
  stepType: string,
  formData: any
): void => {
  // Fire and forget - don't await
  saveFormDataIncremental(sessionId, stepNumber, stepType, formData);
};

/**
 * Get funnel analytics data
 */
export const getFunnelAnalytics = async (
  timeRange: 'day' | 'week' | 'month' = 'week'
): Promise<any> => {
  try {
    const now = new Date();
    const timeRangeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(now.getTime() - timeRangeMs[timeRange]);

    // Get funnel stage distribution
    const { data: funnelData, error: funnelError } = await supabase
      .from('form_sessions')
      .select('funnel_stage, lead_category, is_qualified_lead, page_completed')
      .gte('created_at', startTime.toISOString())
      .eq('environment', getEnvironment());

    if (funnelError) {
      throw funnelError;
    }

    // Calculate conversion rates
    const totalSessions = funnelData?.length || 0;
    const page1Completions = funnelData?.filter(d => d.page_completed >= 1).length || 0;
    const page2Completions = funnelData?.filter(d => d.page_completed >= 2).length || 0;
    const qualifiedLeads = funnelData?.filter(d => d.is_qualified_lead).length || 0;
    const counselingBooked = funnelData?.filter(d => d.funnel_stage === 'counseling_booked').length || 0;

    return {
      totalSessions,
      conversionRates: {
        page1ToPage2: totalSessions > 0 ? (page2Completions / totalSessions) * 100 : 0,
        overallCompletion: totalSessions > 0 ? (page2Completions / totalSessions) * 100 : 0,
        qualificationRate: totalSessions > 0 ? (qualifiedLeads / totalSessions) * 100 : 0,
        counselingBookingRate: qualifiedLeads > 0 ? (counselingBooked / qualifiedLeads) * 100 : 0
      },
      timeRange,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Failed to get funnel analytics:', error);
    return null;
  }
};