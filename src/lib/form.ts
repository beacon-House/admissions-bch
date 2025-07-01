/**
 * Form Submission and Validation Library v8.0
 * 
 * Purpose: Handles form submission with the new simplified webhook payload structure.
 * Supports both qualified and disqualified lead flows.
 * 
 * Changes made:
 * - Updated webhook payload for simplified form structure
 * - Added counselor assignment logic
 * - Simplified payload structure for 2-page form
 */

import { LeadCategory, CompleteFormData } from '@/types/form';
import { initialLeadCaptureSchema, qualifiedLeadSchema, disqualifiedLeadSchema } from '@/schemas/form';
import { ZodError } from 'zod';
import { 
  validateLeadCategory, 
  sanitizeLeadCategory, 
  logLeadCategoryError,
  validateFormDataConsistency 
} from './dataValidation';

export class FormValidationError extends Error {
  constructor(public errors: { [key: string]: string[] }) {
    super('Form validation failed');
    this.name = 'FormValidationError';
  }
}

// Form submission helper
export const submitFormData = async (
  data: Partial<CompleteFormData>,
  step: number,
  startTime: number,
  isComplete: boolean = false,
  triggeredEvents: string[] = []
): Promise<Response> => {
  const webhookUrl = import.meta.env.VITE_REGISTRATION_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error('Form submission URL not configured. Please check environment variables.');
  }
  
  // Validate and sanitize lead category before webhook submission
  const originalCategory = data.lead_category;
  const sanitizedCategory = sanitizeLeadCategory(originalCategory);
  
  if (originalCategory && !sanitizedCategory) {
    logLeadCategoryError(
      'Webhook Submission - Invalid Category',
      originalCategory,
      undefined,
      { step, isComplete }
    );
  }
  
  // Validate complete form data consistency
  const consistencyCheck = validateFormDataConsistency({
    ...data,
    lead_category: sanitizedCategory
  });
  
  if (!consistencyCheck.isValid) {
    logLeadCategoryError(
      'Webhook Submission - Data Consistency',
      sanitizedCategory,
      undefined,
      { 
        errors: consistencyCheck.errors,
        warnings: consistencyCheck.warnings,
        step,
        isComplete 
      }
    );
  }

  const currentTime = Math.floor((Date.now() - startTime) / 1000);
  
  // Determine if this is a qualified lead
  const isQualifiedLead = ['bch', 'lum-l1', 'lum-l2'].includes(sanitizedCategory || '');
  
  // Parse counselling data for webhook
  const counsellingSlotPicked = Boolean(
    data.selectedDate && data.selectedSlot
  );
  
  // Determine counselor assignment
  let counselorAssigned = null;
  if (isQualifiedLead) {
    counselorAssigned = sanitizedCategory === 'bch' ? 'Viswanathan' : 'Karthik Lakshman';
  }

  // Create the webhook payload
  const webhookPayload: Record<string, any> = {
    // Page 1: Initial Lead Capture Data (always present)
    formFillerType: data.formFillerType,
    studentFirstName: data.studentFirstName,
    studentLastName: data.studentLastName,
    currentGrade: data.currentGrade,
    curriculumType: data.curriculumType,
    gradeFormat: data.gradeFormat,
    gpaValue: data.gpaValue || null,
    percentageValue: data.percentageValue || null,
    schoolName: data.schoolName,
    scholarshipRequirement: data.scholarshipRequirement,
    targetGeographies: Array.isArray(data.targetGeographies) ? data.targetGeographies : [],
    phoneNumber: data.phoneNumber,
    
    // Page 2: Contact Information (present for step 2)
    parentName: data.parentName || null,
    email: data.email || null,
    
    // Page 2A: Counseling Data (only for qualified leads)
    counsellingDate: isQualifiedLead ? (data.selectedDate || null) : null,
    counsellingTime: isQualifiedLead ? (data.selectedSlot || null) : null,
    counsellingSlotPicked: isQualifiedLead ? counsellingSlotPicked : false,
    counselor_assigned: counselorAssigned,
    
    // System Generated Data
    lead_category: sanitizedCategory,
    session_id: data.sessionId || crypto.randomUUID(),
    environment: import.meta.env.VITE_ENVIRONMENT?.trim() || 'staging',
    total_time_spent: currentTime,
    created_at: new Date().toISOString(),
    step_completed: step,
    
    // Analytics Data
    triggeredEvents: triggeredEvents.length > 0 ? triggeredEvents : null,
    
    // Form Metadata
    form_version: 'v8.0',
    is_qualified_lead: isQualifiedLead,
    page_completed: step,
    funnel_stage: step === 1 ? 'initial_capture' : 
                  (isQualifiedLead ? 'counseling_booked' : 'contact_submitted')
  };

  console.log('Sending webhook data:', webhookPayload);
  
  // Log the lead category being sent to webhook for tracking
  if (sanitizedCategory) {
    console.log(`Webhook submission: Lead category "${sanitizedCategory}" for step ${step}`);
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(webhookPayload),
  });

  // Enhanced error handling with response details
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error details available');
    console.error('Form submission failed:', {
      status: response.status,
      statusText: response.statusText,
      errorText
    });
    throw new Error(`Form submission failed: ${response.status} ${response.statusText}`);
  }
  
  // Log successful webhook submission with category
  if (sanitizedCategory) {
    console.log(`Webhook success: Lead category "${sanitizedCategory}" submitted successfully`);
  }

  return response;
};

// Enhanced form validation helper
export const validateForm = async (
  step: number,
  data: Partial<CompleteFormData>
): Promise<void> => {
  try {
    switch (step) {
      case 1:
        await initialLeadCaptureSchema.parseAsync(data);
        break;
      case 2:
        // Validate based on lead category
        const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(data.lead_category || '');
        if (isQualified) {
          await qualifiedLeadSchema.parseAsync(data);
        } else {
          await disqualifiedLeadSchema.parseAsync(data);
        }
        break;
      default:
        throw new Error('Invalid form step');
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors: { [key: string]: string[] } = {};
      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      throw new FormValidationError(formattedErrors);
    }
    throw error;
  }
};

// Form validation helper
export const validateFormStep = (
  step: number,
  data: Partial<CompleteFormData>
): boolean => {
  try {
    switch (step) {
      case 1:
        return initialLeadCaptureSchema.safeParse(data).success;
      case 2:
        const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(data.lead_category || '');
        if (isQualified) {
          return qualifiedLeadSchema.safeParse(data).success;
        } else {
          return disqualifiedLeadSchema.safeParse(data).success;
        }
      default:
        return false;
    }
  } catch {
    return false;
  }
};

// Get counselor assignment based on lead category
export const getCounselorAssignment = (leadCategory: LeadCategory): string | null => {
  switch (leadCategory) {
    case 'bch':
      return 'Viswanathan';
    case 'lum-l1':
    case 'lum-l2':
      return 'Karthik Lakshman';
    default:
      return null;
  }
};

// Check if lead is qualified for counseling
export const isQualifiedLead = (leadCategory: LeadCategory): boolean => {
  return ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
};