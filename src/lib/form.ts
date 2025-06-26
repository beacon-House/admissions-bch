import { LeadCategory, CompleteFormData } from '@/types/form';
import { personalDetailsSchema, academicDetailsSchema } from '@/schemas/form';
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

// Function to map new scholarship requirements to old format for backwards compatibility
const mapScholarshipRequirement = (value: string): string => {
  if (value === 'full_scholarship') {
    return 'must_have';
  } else {
    // Both 'partial_scholarship' and 'scholarship_optional' map to 'good_to_have'
    return 'good_to_have';
  }
};

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
      undefined, // No session ID available here
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

  // Parse counselling data for webhook
  const counsellingSlotPicked = Boolean(
    data.counselling?.selectedDate && data.counselling?.selectedSlot
  );
  
  // Get preferred communication methods
  const preferredContactMethods = [];
  const contactDetails = {};
  
  if (data.contactMethods) {
    if (data.contactMethods.call) {
      preferredContactMethods.push('call');
      contactDetails.callNumber = data.contactMethods.callNumber || data.phoneNumber;
    }
    
    if (data.contactMethods.whatsapp) {
      preferredContactMethods.push('whatsapp');
      contactDetails.whatsappNumber = data.contactMethods.whatsappNumber || data.phoneNumber;
    }
    
    if (data.contactMethods.email) {
      preferredContactMethods.push('email');
      contactDetails.emailAddress = data.contactMethods.emailAddress || data.email;
    }
  }

  // Store the original scholarship requirement value for webhook
  const originalScholarshipRequirement = data.scholarshipRequirement;
  
  // Map the scholarship requirement for internal lead categorization only
  let mappedScholarshipRequirement = null;
  if (originalScholarshipRequirement) {
    mappedScholarshipRequirement = mapScholarshipRequirement(originalScholarshipRequirement);
  }

  // Create a clean payload with just the data we need
  const formattedPayload: Record<string, any> = {
    // User-submitted data
    studentFirstName: data.studentFirstName,
    studentLastName: data.studentLastName,
    parentName: data.parentName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    areaOfResidence: data.areaOfResidence,
    whatsappConsent: data.whatsappConsent,
    currentGrade: data.currentGrade,
    formFillerType: data.formFillerType,
    curriculumType: data.curriculumType,
    
    // Additional form fields if available
    schoolName: data.schoolName,
    targetUniversityRank: data.targetUniversityRank,
    preferredCountries: data.preferredCountries,
    
    // Add grade format data for ALL flows (masters and non-masters)
    gradeFormat: data.gradeFormat,
    gpaValue: data.gpaValue,
    percentageValue: data.percentageValue,
    
    // Send original scholarship requirement value to webhook (not mapped)
    scholarshipRequirement: originalScholarshipRequirement,
    
    // Store mapped value for internal reference only
    mappedScholarshipRequirement: mappedScholarshipRequirement,
    
    // Masters-specific fields
    ...(data.currentGrade === 'masters' && {
      intake: data.intake,
      intakeOther: data.intakeOther,
      graduationStatus: data.graduationStatus,
      graduationYear: data.graduationYear,
      workExperience: data.workExperience,
      fieldOfStudy: data.fieldOfStudy,
      entranceExam: data.entranceExam,
      examScore: data.examScore,
      applicationPreparation: data.applicationPreparation,
      targetUniversities: data.targetUniversities,
      supportLevel: data.supportLevel
    }),
    
    // Extended nurture form data
    ...(data.extendedNurture && {
      // Student-specific fields
      parentalSupport: data.extendedNurture.parentalSupport,
      
      // Unified for both student and parent
      partialFundingApproach: data.extendedNurture.partialFundingApproach,
      
      // Renamed from gradeSpecificQuestion to strongProfileIntent
      strongProfileIntent: data.extendedNurture.strongProfileIntent,
      
      extendedFormCompleted: true
    }),
    
    // Lead categorization
    lead_category: sanitizedCategory,
    
    // Counselling data
    counsellingSlotPicked: counsellingSlotPicked,
    counsellingDate: data.counselling?.selectedDate || null,
    counsellingTime: data.counselling?.selectedSlot || null,
    preferredContactMethods: preferredContactMethods.length > 0 ? preferredContactMethods : null,
    ...contactDetails,
    
    // Triggered events tracking
    triggeredEvents: triggeredEvents.length > 0 ? triggeredEvents : null,
    
    // Metadata
    total_time_spent: currentTime,
    created_at: new Date().toISOString(),
    step_completed: step
  };

  console.log('Sending webhook data:', formattedPayload);
  
  // Log the lead category being sent to webhook for tracking
  if (sanitizedCategory) {
    console.log(`Webhook submission: Lead category "${sanitizedCategory}" for step ${step}`);
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedPayload),
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
        await personalDetailsSchema.parseAsync(data);
        break;
      case 2:
        await academicDetailsSchema.parseAsync(data);
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
        return personalDetailsSchema.safeParse(data).success;
      case 2:
        return academicDetailsSchema.safeParse(data).success;
      default:
        return false;
    }
  } catch {
    return false;
  }
};