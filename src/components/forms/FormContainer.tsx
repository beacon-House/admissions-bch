import React, { useEffect } from 'react';
import { Progress } from '../ui/progress';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AcademicDetailsForm } from './AcademicDetailsForm';
import { CommitmentForm } from './CommitmentForm';
import { useFormStore } from '@/store/formStore';
import { trackFormView, trackFormStepComplete, trackFormAbandonment, trackFormError } from '@/lib/analytics';
import { trackPixelEvent, PIXEL_EVENTS } from '@/lib/pixel';
import { submitFormData, validateForm, FormValidationError } from '@/lib/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { toast } from '@/components/ui/toast';

export default function FormContainer() {
  const {
    currentStep,
    formData,
    isSubmitting,
    isSubmitted,
    startTime,
    stepStartTimes,
    setStep,
    updateFormData,
    setSubmitting,
    setSubmitted
  } = useFormStore();

  const onSubmitStep1 = async (data: CompleteFormData) => {
    try {
      await validateForm(1, data);
      updateFormData(data);
      
      trackPixelEvent({
        name: PIXEL_EVENTS.FORM_PAGE1,
        options: { grade: data.currentGrade }
      });
      trackFormStepComplete(1);
      
      // If user is applying for masters or grade 7 below, submit form immediately
      if (data.currentGrade === 'masters' || data.currentGrade === '7_below') {
        setSubmitting(true);
        await submitFormData(data, 1, startTime, stepStartTimes);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      setStep(2);
    } catch (error) {
      if (error instanceof FormValidationError) {
        Object.values(error.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else {
        console.error('Error submitting form:', error);
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
        trackFormError(1, 'submission_error');
      }
      setSubmitting(false);
    }
  };

  const onSubmitStep2 = async (data: CompleteFormData) => {
    try {
      await validateForm(2, data);
      updateFormData(data);
      
      trackPixelEvent({
        name: PIXEL_EVENTS.FORM_PAGE2,
        options: { curriculum: data.curriculumType }
      });
      trackFormStepComplete(2);
      setStep(3);
    } catch (error) {
      if (error instanceof FormValidationError) {
        Object.values(error.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else {
        console.error('Error validating form:', error);
        toast.error('An unexpected error occurred. Please try again.');
        trackFormError(2, 'validation_error');
      }
    }
  };

  const onSubmitStep3 = async (data: CompleteFormData) => {
    try {
      await validateForm(3, data);
      setSubmitting(true);
      
      trackPixelEvent({
        name: PIXEL_EVENTS.FORM_PAGE3,
        options: { timeline: data.timelineCommitment }
      });
      
      const finalData = { ...formData, ...data };
      // Add lead category to the final data
      const leadCategory = determineLeadCategory(
        finalData.currentGrade,
        finalData.studyAbroadPriority,
        finalData.scholarshipRequirement,
        finalData.curriculumType
      );
      const enrichedData = { ...finalData, lead_category: leadCategory };
      await submitFormData(enrichedData, 3, startTime, stepStartTimes, true);
      setSubmitting(false);      
      setSubmitted(true);
    } catch (error) {
      if (error instanceof FormValidationError) {
        Object.values(error.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else {
        console.error('Error submitting form:', error);
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
        trackFormError(3, 'submission_error');
      }
      setSubmitting(false);
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      default: return 0;
    }
  };
  
  useEffect(() => {
    trackFormView();
    return () => {
      if (!isSubmitted) {
        trackFormAbandonment(currentStep, startTime);
      }
    };
  }, [currentStep, isSubmitted]);

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-primary mb-4">
          Thank You for Your Interest
        </h3>
        <div className="max-w-lg text-gray-600">
          <p>{(formData.currentGrade === 'masters' || formData.currentGrade === '7_below')
            ? "We appreciate you taking the time to share your profile with us. Our admissions team shall get in touch."
            : "We appreciate you taking the time to share your profile with us. Our admissions team will reach out to you within the next 24 hours."
          }</p>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-pulse text-2xl font-semibold mb-4 text-primary">
          Processing Your Application
        </div>
        <p className="text-center text-gray-600 max-w-md">
          Please wait while we securely submit your application...
        </p>
      </div>
    );
  }

  return (
    <div id="qualification-form" className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Transform Your Journey to Elite Universities
        </h2>
        <Progress value={getStepProgress()} className="mb-4" />
      </div>

      <div className="space-y-8 bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        {currentStep === 1 && (
          <PersonalDetailsForm
            onSubmit={onSubmitStep1}
            defaultValues={formData}
          />
        )}

        {currentStep === 2 && (
          <AcademicDetailsForm
            onSubmit={onSubmitStep2}
            onBack={() => setStep(1)}
            defaultValues={formData}
          />
        )}

        {currentStep === 3 && (
          <CommitmentForm
            onSubmit={onSubmitStep3}
            onBack={() => setStep(2)}
            defaultValues={formData}
          />
        )}
      </div>
    </div>
  );
}