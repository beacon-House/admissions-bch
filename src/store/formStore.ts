import { create } from 'zustand';
import { CompleteFormData } from '@/types/form';
import { validateFormStep } from '@/lib/form';

interface FormState {
  currentStep: number;
  formData: Partial<CompleteFormData>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  startTime: number;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<CompleteFormData>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitted: (isSubmitted: boolean) => void;
  resetForm: () => void;
  canProceed: (step: number) => boolean;
}

export const useFormStore = create<FormState>((set, get) => ({
  currentStep: 1,
  formData: {},
  isSubmitting: false,
  isSubmitted: false,
  startTime: Date.now(),
  
  setStep: (step) => set({ currentStep: step }),
  
  updateFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitted: (isSubmitted) => set({ isSubmitted }),
  
  resetForm: () => set({
    currentStep: 1,
    formData: {},
    isSubmitting: false,
    isSubmitted: false,
    startTime: Date.now()
  }),
  
  canProceed: (step) => validateFormStep(step, get().formData)
}));