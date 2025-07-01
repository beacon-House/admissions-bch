/**
 * Meta Pixel Event Tracking Library v8.0
 * 
 * Purpose: Complete implementation of Beacon House Meta Ads Events Framework.
 * Includes all 35+ events with precise firing logic and qualification detection.
 * 
 * Changes made:
 * - Implemented complete event framework as specified
 * - Added all primary lead classification events
 * - Added general funnel events
 * - Added category-specific events (BCH, Luminaire L1/L2, Qualified Parent/Student)
 * - Added spam detection and qualification logic
 */

import { trackEvent } from './analytics';
import { useFormStore } from '@/store/formStore';

// Types
type PixelEvent = {
  name: string;
  options?: Record<string, any>;
};

// Get environment-specific event name
export const getEventName = (eventPrefix: string): string => {
  const environment = import.meta.env.VITE_ENVIRONMENT?.trim() || 'dev';
  return `${eventPrefix}_${environment}`;
};

// Initialize Meta Pixel
export const initializePixel = (): void => {
  try {
    const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim();
    if (!pixelId) {
      console.error('Meta Pixel ID not found in environment variables');
      return;
    }

    if (!window.fbq) {
      console.warn('Meta Pixel not loaded');
      return;
    }

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  } catch (error) {
    console.error('Failed to initialize Meta Pixel:', error);
  }
};

// Track custom event
export const trackPixelEvent = (event: PixelEvent): void => {
  try {
    if (!window.fbq) {
      console.warn('Meta Pixel not loaded, event not tracked:', event.name);
      return;
    }

    window.fbq('track', event.name, event.options);
    
    // Add the triggered event to the form store
    try {
      const { addTriggeredEvent } = useFormStore.getState();
      addTriggeredEvent(event.name);
    } catch (error) {
      console.debug('Form store not available for event tracking:', event.name);
    }
    
    // Also track in Google Analytics for consistency
    trackEvent(event.name, event.options);
  } catch (error) {
    console.error('Failed to track pixel event:', error);
  }
};

// Helper function to determine if student would qualify if parent filled form
export const wouldStudentQualifyAsParent = (formData: any): boolean => {
  // Simulate parent qualification logic for student profiles
  const currentGrade = formData.currentGrade;
  const scholarshipRequirement = formData.scholarshipRequirement;
  const targetGeographies = formData.targetGeographies || [];
  
  // Check if student would meet BCH criteria as parent
  if (['8', '9', '10'].includes(currentGrade) && 
      ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement)) {
    return true;
  }
  
  // Grade 11 + scholarship optional/partial + target geography US
  if (currentGrade === '11' && 
      ['scholarship_optional', 'partial_scholarship'].includes(scholarshipRequirement) &&
      targetGeographies.includes('US')) {
    return true;
  }
  
  // Luminaire L1 criteria
  if (currentGrade === '11' && 
      scholarshipRequirement === 'scholarship_optional' &&
      targetGeographies.some((geo: string) => ['UK', 'Rest of World', 'Need Guidance'].includes(geo))) {
    return true;
  }
  
  if (currentGrade === '12' && 
      scholarshipRequirement === 'scholarship_optional') {
    return true;
  }
  
  // Luminaire L2 criteria
  if (currentGrade === '11' && 
      scholarshipRequirement === 'partial_scholarship' &&
      targetGeographies.some((geo: string) => ['UK', 'Rest of World', 'Need Guidance'].includes(geo))) {
    return true;
  }
  
  if (currentGrade === '12' && 
      scholarshipRequirement === 'partial_scholarship') {
    return true;
  }
  
  return false;
};

// Helper function to check if form data indicates spam
export const isSpamLead = (formData: any): boolean => {
  return formData.gpaValue === "10" || formData.percentageValue === "100";
};

// Helper function to check if lead is qualified (BCH, LUM-L1, LUM-L2)
export const isQualifiedLead = (leadCategory: string): boolean => {
  return ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
};

// Event name constants - all events with environment suffix
export const PIXEL_EVENTS = {
  // PRIMARY LEAD CLASSIFICATION EVENTS (8 events)
  PARENT_EVENT: getEventName('adm_prnt_event'),
  QUALIFIED_PARENT: getEventName('adm_qualfd_prnt'),
  DISQUALIFIED_PARENT: getEventName('adm_disqualfd_prnt'),
  SPAM_PARENT: getEventName('adm_spam_prnt'),
  SPAM_STUDENT: getEventName('adm_spam_stdnt'),
  STUDENT_EVENT: getEventName('adm_stdnt'),
  QUALIFIED_STUDENT: getEventName('adm_qualfd_stdnt'),
  DISQUALIFIED_STUDENT: getEventName('adm_disqualfd_stdnt'),
  
  // GENERAL FUNNEL EVENTS (7 events)
  PAGE_VIEW: getEventName('adm_page_view'),
  CTA_HERO: getEventName('adm_cta_hero'),
  CTA_HEADER: getEventName('adm_cta_header'),
  PAGE_1_CONTINUE: getEventName('adm_page_1_continue'),
  PAGE_2_VIEW: getEventName('adm_page_2_view'),
  PAGE_2_SUBMIT: getEventName('adm_page_2_submit'),
  FORM_COMPLETE: getEventName('adm_form_complete'),
  
  // BCH LEAD SPECIFIC EVENTS (4 events)
  BCH_PAGE_1_CONTINUE: getEventName('adm_bch_page_1_continue'),
  BCH_PAGE_2_VIEW: getEventName('adm_bch_page_2_view'),
  BCH_PAGE_2_SUBMIT: getEventName('adm_bch_page_2_submit'),
  BCH_FORM_COMPLETE: getEventName('adm_bch_form_complete'),
  
  // LUMINAIRE L1 LEAD SPECIFIC EVENTS (4 events)
  LUM_L1_PAGE_1_CONTINUE: getEventName('adm_lum_l1_page_1_continue'),
  LUM_L1_PAGE_2_VIEW: getEventName('adm_lum_l1_page_2_view'),
  LUM_L1_PAGE_2_SUBMIT: getEventName('adm_lum_l1_page_2_submit'),
  LUM_L1_FORM_COMPLETE: getEventName('adm_lum_l1_form_complete'),
  
  // LUMINAIRE L2 LEAD SPECIFIC EVENTS (4 events)
  LUM_L2_PAGE_1_CONTINUE: getEventName('adm_lum_l2_page_1_continue'),
  LUM_L2_PAGE_2_VIEW: getEventName('adm_lum_l2_page_2_view'),
  LUM_L2_PAGE_2_SUBMIT: getEventName('adm_lum_l2_page_2_submit'),
  LUM_L2_FORM_COMPLETE: getEventName('adm_lum_l2_form_complete'),
  
  // QUALIFIED PARENT SPECIFIC EVENTS (4 events)
  QUALIFIED_PARENT_PAGE_1_CONTINUE: getEventName('adm_qualfd_prnt_page_1_continue'),
  QUALIFIED_PARENT_PAGE_2_VIEW: getEventName('adm_qualfd_prnt_page_2_view'),
  QUALIFIED_PARENT_PAGE_2_SUBMIT: getEventName('adm_qualfd_prnt_page_2_submit'),
  QUALIFIED_PARENT_FORM_COMPLETE: getEventName('adm_qualfd_prnt_form_complete'),
  
  // QUALIFIED STUDENT SPECIFIC EVENTS (4 events)
  QUALIFIED_STUDENT_PAGE_1_CONTINUE: getEventName('adm_qualfd_stdnt_page_1_continue'),
  QUALIFIED_STUDENT_PAGE_2_VIEW: getEventName('adm_qualfd_stdnt_page_2_view'),
  QUALIFIED_STUDENT_PAGE_2_SUBMIT: getEventName('adm_qualfd_stdnt_page_2_submit'),
  QUALIFIED_STUDENT_FORM_COMPLETE: getEventName('adm_qualfd_stdnt_form_complete')
};

// Event firing functions

/**
 * Fire events when Page 1 is completed
 * CRITICAL: This is where all lead classification happens
 */
export const firePageOneCompleteEvents = (formData: any) => {
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const isSpam = isSpamLead(formData);
  const leadCategory = formData.lead_category;
  const isQualified = isQualifiedLead(leadCategory);
  
  // PRIMARY LEAD CLASSIFICATION EVENTS
  
  if (isParent) {
    if (isSpam) {
      // Spam parent
      trackPixelEvent({ name: PIXEL_EVENTS.SPAM_PARENT, options: formData });
    } else {
      // All parents minus spammy parents
      trackPixelEvent({ name: PIXEL_EVENTS.PARENT_EVENT, options: formData });
      
      if (isQualified) {
        // Qualified parent
        trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT, options: formData });
        trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT_PAGE_1_CONTINUE, options: formData });
      } else {
        // Disqualified parent
        trackPixelEvent({ name: PIXEL_EVENTS.DISQUALIFIED_PARENT, options: formData });
      }
    }
  }
  
  if (isStudent) {
    // Any student form submission
    trackPixelEvent({ name: PIXEL_EVENTS.STUDENT_EVENT, options: formData });
    
    if (isSpam) {
      // Spam student
      trackPixelEvent({ name: PIXEL_EVENTS.SPAM_STUDENT, options: formData });
      trackPixelEvent({ name: PIXEL_EVENTS.DISQUALIFIED_STUDENT, options: formData });
    } else {
      // Check if student would qualify if parent filled
      const wouldQualify = wouldStudentQualifyAsParent(formData);
      
      if (wouldQualify) {
        trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT, options: formData });
        trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT_PAGE_1_CONTINUE, options: formData });
      } else {
        trackPixelEvent({ name: PIXEL_EVENTS.DISQUALIFIED_STUDENT, options: formData });
      }
    }
  }
  
  // GENERAL FUNNEL EVENTS
  trackPixelEvent({ name: PIXEL_EVENTS.PAGE_1_CONTINUE, options: formData });
  
  // CATEGORY-SPECIFIC EVENTS
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_PAGE_1_CONTINUE, options: formData });
  } else if (leadCategory === 'lum-l1') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L1_PAGE_1_CONTINUE, options: formData });
  } else if (leadCategory === 'lum-l2') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L2_PAGE_1_CONTINUE, options: formData });
  }
};

/**
 * Fire events when Page 2 is viewed
 */
export const firePageTwoViewEvents = (formData: any) => {
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const leadCategory = formData.lead_category;
  const isQualified = isQualifiedLead(leadCategory);
  
  // GENERAL FUNNEL EVENTS
  trackPixelEvent({ name: PIXEL_EVENTS.PAGE_2_VIEW, options: formData });
  
  // CATEGORY-SPECIFIC EVENTS
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_PAGE_2_VIEW, options: formData });
  } else if (leadCategory === 'lum-l1') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L1_PAGE_2_VIEW, options: formData });
  } else if (leadCategory === 'lum-l2') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L2_PAGE_2_VIEW, options: formData });
  }
  
  // QUALIFIED PARENT/STUDENT SPECIFIC EVENTS
  if (isParent && isQualified) {
    trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT_PAGE_2_VIEW, options: formData });
  }
  
  if (isStudent) {
    const wouldQualify = wouldStudentQualifyAsParent(formData);
    if (wouldQualify) {
      trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT_PAGE_2_VIEW, options: formData });
    }
  }
};

/**
 * Fire events when Page 2 is submitted
 */
export const firePageTwoSubmitEvents = (formData: any) => {
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const leadCategory = formData.lead_category;
  const isQualified = isQualifiedLead(leadCategory);
  
  // GENERAL FUNNEL EVENTS
  trackPixelEvent({ name: PIXEL_EVENTS.PAGE_2_SUBMIT, options: formData });
  
  // CATEGORY-SPECIFIC EVENTS
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_PAGE_2_SUBMIT, options: formData });
  } else if (leadCategory === 'lum-l1') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L1_PAGE_2_SUBMIT, options: formData });
  } else if (leadCategory === 'lum-l2') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L2_PAGE_2_SUBMIT, options: formData });
  }
  
  // QUALIFIED PARENT/STUDENT SPECIFIC EVENTS
  if (isParent && isQualified) {
    trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT_PAGE_2_SUBMIT, options: formData });
  }
  
  if (isStudent) {
    const wouldQualify = wouldStudentQualifyAsParent(formData);
    if (wouldQualify) {
      trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT_PAGE_2_SUBMIT, options: formData });
    }
  }
};

/**
 * Fire events when entire form is completed
 */
export const fireFormCompleteEvents = (formData: any) => {
  const isParent = formData.formFillerType === 'parent';
  const isStudent = formData.formFillerType === 'student';
  const leadCategory = formData.lead_category;
  const isQualified = isQualifiedLead(leadCategory);
  
  // GENERAL FUNNEL EVENTS
  trackPixelEvent({ name: PIXEL_EVENTS.FORM_COMPLETE, options: formData });
  
  // CATEGORY-SPECIFIC EVENTS
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_FORM_COMPLETE, options: formData });
  } else if (leadCategory === 'lum-l1') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L1_FORM_COMPLETE, options: formData });
  } else if (leadCategory === 'lum-l2') {
    trackPixelEvent({ name: PIXEL_EVENTS.LUM_L2_FORM_COMPLETE, options: formData });
  }
  
  // QUALIFIED PARENT/STUDENT SPECIFIC EVENTS
  if (isParent && isQualified) {
    trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT_FORM_COMPLETE, options: formData });
  }
  
  if (isStudent) {
    const wouldQualify = wouldStudentQualifyAsParent(formData);
    if (wouldQualify) {
      trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT_FORM_COMPLETE, options: formData });
    }
  }
};

/**
 * Fire page view events
 */
export const firePageViewEvents = (formData: any) => {
  trackPixelEvent({ name: PIXEL_EVENTS.PAGE_VIEW, options: formData });
};

/**
 * Fire CTA events
 */
export const fireCTAEvents = (ctaType: 'hero' | 'header', options: any) => {
  if (ctaType === 'hero') {
    trackPixelEvent({ name: PIXEL_EVENTS.CTA_HERO, options });
  } else {
    trackPixelEvent({ name: PIXEL_EVENTS.CTA_HEADER, options });
  }
};

// Generate common event properties
export const getCommonEventProperties = (formData: any): Record<string, any> => {
  return {
    current_grade: formData?.currentGrade || null,
    form_filler_type: formData?.formFillerType || null,
    curriculum_type: formData?.curriculumType || null,
    scholarship_requirement: formData?.scholarshipRequirement || null,
    lead_category: formData?.lead_category || null,
    has_full_scholarship_requirement: formData?.scholarshipRequirement === 'full_scholarship',
    is_international_curriculum: ['IB', 'IGCSE'].includes(formData?.curriculumType),
    is_spam_lead: isSpamLead(formData),
    is_qualified_lead: isQualifiedLead(formData?.lead_category)
  };
};