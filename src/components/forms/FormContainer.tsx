/**
 * FormContainer Component v8.0
 * 
 * Purpose: Main orchestrator for the simplified 2-page form with complete Meta Pixel event tracking.
 * Implements the full Beacon House Meta Ads Events Framework.
 * 
 * Changes made:
 * - Implemented complete Meta Pixel event framework
 * - Added precise event firing logic based on lead qualification
 * - Added spam detection and student qualification logic
 * - All events fire after Page 1 completion as specified
 */

import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '../ui/progress';
import { InitialLeadCaptureForm } from './InitialLeadCaptureForm';
import { QualifiedLeadForm } from './QualifiedLeadForm';
import { DisqualifiedLeadForm } from './DisqualifiedLeadForm';
import { SequentialLoadingAnimation } from '../ui/SequentialLoadingAnimation';
import { useFormStore } from '@/store/formStore';
import { trackFormView, trackFormStepComplete, trackFormAbandonment, trackFormError } from '@/lib/analytics';
import { submitFormData, validateForm, FormValidationError } from '@/lib/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { toast } from '@/components/ui/toast';
import { trackStep } from '@/lib/formTracking';
import { 
  trackFormSection, 
  trackPageCompletion, 
  trackFormSubmission,
  saveFormDataIncremental 
} from '@/lib/formTracking';
import { 
  firePageOneCompleteEvents,
  firePageTwoViewEvents, 
  firePageTwoSubmitEvents,
  fireFormCompleteEvents,
  firePageViewEvents,
  getCommonEventProperties
} from '@/lib/pixel';
import { InitialLeadCaptureData, QualifiedLeadData, DisqualifiedLeadData } from '@/types/form';

export default function FormContainer() {
  const {
    currentStep,
    formData,
    isSubmitting,
    isSubmitted,
    startTime,
    triggeredEvents,
    sessionId,
    setStep,
    updateFormData,
    setSubmitting,
    setSubmitted
  } = useFormStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // State for the evaluation interstitial
  const [showEvaluationAnimation, setShowEvaluationAnimation] = useState(false);
  const [evaluatedLeadCategory, setEvaluatedLeadCategory] = useState<string | null>(null);

  const onSubmitPage1 = async (data: InitialLeadCaptureData) => {
    try {
      await validateForm(1, data);
      updateFormData(data);
      
      // Save data incrementally to database
      const completeStep1Data = { 
        ...formData, 
        ...data, 
        startTime,
        sessionId,
        currentStep: 1
      };
      
      // Track page 1 completion with incremental save
      await trackPageCompletion(sessionId, 1, 'initial_lead_capture', completeStep1Data);
      trackFormStepComplete(1);
      
      // If grade 7 or below, submit form immediately with DROP lead category
      if (data.currentGrade === '7_below') {
        setSubmitting(true);
        const leadCategory = 'drop';
        const finalData = { 
          ...formData, 
          ...data, 
          lead_category: leadCategory, 
          startTime,
          sessionId 
        };
        
        updateFormData({ lead_category: leadCategory });
        
        // Track final submission for grade 7 below
        await trackFormSubmission(sessionId, finalData, true);
        
        // FIRE META PIXEL EVENTS FOR PAGE 1 COMPLETION
        firePageOneCompleteEvents(finalData);
        
        // Submit form with lead category
        await submitFormData(finalData, 1, startTime, true, triggeredEvents);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      // Determine lead category using new logic
      const leadCategory = determineLeadCategory(
        data.currentGrade,
        data.formFillerType,
        data.scholarshipRequirement,
        data.curriculumType,
        undefined, // targetUniversityRank not used in new logic
        data.gpaValue,
        data.percentageValue,
        undefined, // intake not used in new logic
        undefined, // applicationPreparation not used in new logic
        undefined, // targetUniversities not used in new logic
        undefined, // supportLevel not used in new logic
        undefined, // extendedNurtureData not used in new logic
        data.targetGeographies
      );
      
      // Save lead category to state
      setEvaluatedLeadCategory(leadCategory);
      updateFormData({ lead_category: leadCategory });
      
      // Create final data object with the determined lead category
      const finalData = { 
        ...data, 
        lead_category: leadCategory,
        sessionId
      };
      
      // CRITICAL: FIRE ALL META PIXEL EVENTS FOR PAGE 1 COMPLETION
      // This is where all lead classification happens as per framework
      firePageOneCompleteEvents(finalData);
      
      // If form is filled by student, submit immediately regardless of other conditions
      if (data.formFillerType === 'student') {
        setSubmitting(true);
        
        // Track student direct submission
        await trackFormSubmission(sessionId, finalData, true);
        
        // Fire form completion events for student
        fireFormCompleteEvents(finalData);
        
        await submitFormData(finalData, 1, startTime, true, triggeredEvents);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      // Check if lead is qualified for counseling (BCH, Luminaire L1, Luminaire L2)
      const isQualified = ['bch', 'lum-l1', 'lum-l2'].includes(leadCategory);
      
      if (isQualified) {
        // Show evaluation animation before proceeding to counseling (Page 2A)
        window.scrollTo(0, 0);
        setSubmitting(true);
        setShowEvaluationAnimation(true);
        setTimeout(() => {
          handleEvaluationComplete();
        }, 10000); // 10 seconds for evaluation animation
      } else {
        // Disqualified leads go directly to Page 2B (contact info only)
        window.scrollTo(0, 0);
        setStep(2);
      }
      
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

  const onSubmitPage2A = async (data: QualifiedLeadData) => {
    try {
      await validateForm(2, { ...formData, ...data });
      setSubmitting(true);
      
      // Prepare final data for submission
      const finalSubmissionData = {
        ...formData,
        ...data,
        sessionId,
        currentStep: 2
      };
      
      // Track final submission to database
      await trackFormSubmission(sessionId, finalSubmissionData, true);
      
      // FIRE META PIXEL EVENTS FOR PAGE 2 SUBMISSION
      firePageTwoSubmitEvents(finalSubmissionData);
      
      // FIRE FORM COMPLETION EVENTS
      fireFormCompleteEvents(finalSubmissionData);
      
      // Submit all form data including counselling details
      await submitFormData(finalSubmissionData, 2, startTime, true, triggeredEvents);
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      trackFormError(2, 'submission_error');
      setSubmitting(false);
    }
  };

  const onSubmitPage2B = async (data: DisqualifiedLeadData) => {
    try {
      await validateForm(2, { ...formData, ...data });
      setSubmitting(true);
      
      // Prepare final data for submission
      const finalSubmissionData = {
        ...formData,
        ...data,
        sessionId,
        currentStep: 2
      };
      
      // Track final submission to database
      await trackFormSubmission(sessionId, finalSubmissionData, true);
      
      // FIRE META PIXEL EVENTS FOR PAGE 2 SUBMISSION
      firePageTwoSubmitEvents(finalSubmissionData);
      
      // FIRE FORM COMPLETION EVENTS
      fireFormCompleteEvents(finalSubmissionData);
      
      // Submit all form data
      await submitFormData(finalSubmissionData, 2, startTime, true, triggeredEvents);
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      trackFormError(2, 'submission_error');
      setSubmitting(false);
    }
  };

  // Handle completion of evaluation animation
  const handleEvaluationComplete = () => {
    setShowEvaluationAnimation(false);
    setSubmitting(false);
    setStep(2);
    trackFormStepComplete(1);
    // Scroll to top when moving to next step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 1: return 50;
      case 2: return 100;
      default: return 0;
    }
  };
  
  useEffect(() => {
    // Track page view when component mounts or step changes
    trackFormView();
    
    // FIRE PAGE VIEW EVENTS
    firePageViewEvents(formData);
  }, [currentStep, formData]);

  // Fire Page 2 view events when step 2 is reached
  useEffect(() => {
    if (currentStep === 2 && formData.lead_category) {
      // Save page 2 view data incrementally
      const page2Data = { 
        ...formData, 
        sessionId,
        currentStep: 2 
      };
      saveFormDataIncremental(sessionId, 2, 'page_2_view', page2Data);
      
      // FIRE META PIXEL EVENTS FOR PAGE 2 VIEW
      firePageTwoViewEvents(formData);
    }
    
    // Scroll to top when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, formData.lead_category]);

  // Evaluation steps for regular evaluation animation
  const evaluationSteps = [
    {
      message: `Analyzing your ${formData.currentGrade === 'masters' ? 'profile and program fit' : 'academic profile and curriculum fit'}`,
      duration: 3500
    },
    {
      message: `Processing ${formData.currentGrade === 'masters' ? 'graduate admission criteria' : 'admission criteria and program compatibility'}`,
      duration: 3500
    },
    {
      message: `Connecting you with our Beacon House admission experts`,
      duration: 3500
    }
  ];

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
          {formData.currentGrade === '7_below' ? (
            <p>We appreciate you taking the time to share your profile with us. Our admissions team shall get in touch.</p>
          ) : formData.lead_category === 'nurture' || formData.lead_category === 'masters' ? (
            <p>Thank you for providing your details. Our admissions team will review your profile and reach out within 48 hours to discuss potential pathways that match your specific needs and requirements.</p>
          ) : (formData.selectedDate && formData.selectedSlot) ? (
            <p>We've scheduled your counselling session for {formData.selectedDate} at {formData.selectedSlot}. Our team will contact you soon to confirm.</p>
          ) : (
            <p>We appreciate you taking the time to share your profile with us. Our admissions team will reach out to you within the next 24 hours.</p>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitting && !showEvaluationAnimation) {
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
      {/* Progress Bar */}
      <div className="text-center mb-6">
        <Progress value={getStepProgress()} className="mb-4" />
      </div>

      {/* Loading animation */}
      {showEvaluationAnimation && (
        <SequentialLoadingAnimation
          steps={evaluationSteps}
          onComplete={handleEvaluationComplete}
        />
      )}
      
      {!showEvaluationAnimation && (
        <div 
          ref={containerRef}
          className={`relative space-y-8 transition-all duration-300 ease-in-out mx-auto px-4 sm:px-8 md:px-8 ${currentStep === 2 ? 'max-w-full' : 'max-w-full md:max-w-5xl'} bg-white md:bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 md:p-6`}
        >
          {currentStep === 1 && (
            <InitialLeadCaptureForm
              onSubmit={onSubmitPage1}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && ['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '') && (
            <QualifiedLeadForm
              onSubmit={onSubmitPage2A}
              onBack={() => setStep(1)}
              leadCategory={formData.lead_category as any}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && !['bch', 'lum-l1', 'lum-l2'].includes(formData.lead_category || '') && (
            <DisqualifiedLeadForm
              onSubmit={onSubmitPage2B}
              onBack={() => setStep(1)}
              leadCategory={formData.lead_category as any}
              defaultValues={formData}
            />
          )}
        </div>
      )}
    </div>
  );
}