import { LeadCategory, CompleteFormData } from '@/types/form';
import { personalDetailsSchema, academicDetailsSchema, commitmentSchema } from '@/schemas/form';
import { ZodError } from 'zod';

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
  stepStartTimes: Record<number, number>,
  isComplete: boolean = false
): Promise<Response> => {
  const webhookUrl = import.meta.env.VITE_REGISTRATION_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    throw new Error('Form submission URL not configured. Please check environment variables.');
  }

  const currentTime = Math.floor((Date.now() - startTime) / 1000);
  const now = Date.now();
  const timestamp = new Date().toISOString();

  // Format source with current month and year
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const source = `website_${month}${year}`;

  const basePayload = {
    ...data,
    source,
    timestamp,
    counselingSlot: data.consultationSlot?.toISOString(),
    completion_status: isComplete ? 'complete' : 'partial',
    current_step: step,
    total_time_spent: currentTime,
  };

  // Add step-specific completion times
  const timePayload = {
    ...(step >= 1 && { step1_completion_time: Math.floor((stepStartTimes[2] || stepStartTimes[3] || now - stepStartTimes[1]) / 1000) }),
    ...(step >= 2 && { step2_completion_time: Math.floor((stepStartTimes[3] || now - stepStartTimes[2]) / 1000) }),
    ...(step === 3 && { step3_completion_time: Math.floor((now - stepStartTimes[3]) / 1000) }),
  };

  // Ensure all data is properly formatted
  const formattedPayload = {
    ...basePayload,
    ...timePayload,
    consultation_requested: !!data.consultationSlot,
    created_at: new Date().toISOString(),
  };

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
      case 3:
        await commitmentSchema.parseAsync(data);
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
      case 3:
        return commitmentSchema.safeParse(data).success;
      default:
        return false;
    }
  } catch {
    return false;
  }
};