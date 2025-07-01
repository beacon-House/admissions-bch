/**
 * Form Store v8.0
 * 
 * Purpose: Zustand store for managing simplified 2-page form state.
 * Handles form data, step navigation, and submission status.
 * 
 * Changes made:
 * - Updated for simplified form structure
 * - Added sessionId tracking
 * - Simplified validation logic
 * - Updated form data types
 */

import { create } from 'zustand';
import { CompleteFormData } from '@/types/form';
import { validateFormStep } from '@/lib/form';
import { generateSessionId } from '@/lib/formTracking';

interface FormState {
  currentStep: number;
  formData: Partial<CompleteFormData>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  startTime: number;
  triggeredEvents: string[];
  sessionId: string;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<CompleteFormData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitted: (isSubmitted: boolean) => void;
  addTriggeredEvent: (eventName: string) => void;
  resetForm: () => void;
  canProceed: (step: number) => boolean;
}

export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  startTime: Date.now(),
  triggeredEvents: [],
  sessionId: generateSessionId(),
  
  setStep: (step) => {
    set({ currentStep: step });
    // Scroll to top of the form when changing steps
    window.scrollTo(0, 0);
  },
  
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitted: (isSubmitted) => set({ isSubmitted }),
  
  addTriggeredEvent: (eventName) => set((state) => ({
    triggeredEvents: [...state.triggeredEvents, eventName]
  })),
  
  resetForm: () => set({
    currentStep: 1,
    formData: {},
    isSubmitting: false,
    isSubmitted: false,
    startTime: Date.now(),
    triggeredEvents: [],
    sessionId: generateSessionId()
  }),
  
  canProceed: (step) => {
    try {
      return validateFormStep(step, get().formData);
    } catch {
      return false;
    }
  }
}));