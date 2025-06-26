/**
 * FormContainer Component
 * 
 * Purpose: Main orchestrator for the multi-step form, handling form state management,
 * lead categorization, validation, and submission workflow.
 * 
 * Changes made:
 * - Added qualified lead event tracking for bch, lum-l1, and lum-l2 categories
 * - Event is triggered after lead qualification in both onSubmitStep2 and onSubmitExtendedNurture
 */

import React, { useEffect, useState, useRef } from 'react';
import { Progress } from '../ui/progress';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AcademicDetailsForm } from './AcademicDetailsForm';
import { MastersAcademicDetailsForm } from './MastersAcademicDetailsForm';
import { ExtendedNurtureForm } from './ExtendedNurtureForm';
import { CounsellingForm } from './CounsellingForm';
import { SequentialLoadingAnimation } from '../ui/SequentialLoadingAnimation';
import { useFormStore } from '@/store/formStore';
import { trackFormView, trackFormStepComplete, trackFormAbandonment, trackFormError } from '@/lib/analytics';
import { trackPixelEvent, PIXEL_EVENTS, getCommonEventProperties } from '@/lib/pixel';
import { submitFormData, validateForm, FormValidationError } from '@/lib/form';
import { determineLeadCategory } from '@/lib/leadCategorization';
import { toast } from '@/components/ui/toast';
import { ExtendedNurtureData } from './ExtendedNurtureForm';
import { trackStep } from '@/lib/formTracking';

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
  const [showNurtureAnimation, setShowNurtureAnimation] = useState(false);
  const [evaluatedLeadCategory, setEvaluatedLeadCategory] = useState<string | null>(null);
  const [compactForm, setCompactForm] = useState(false);

  const onSubmitStep1 = async (data: any) => {
    try {
      await validateForm(1, data);
      updateFormData(data);
      
      // Track step 1 completion
      const completeStep1Data = { ...formData, ...data, startTime };
      trackStep(sessionId, 1, 'personal_details', completeStep1Data);
      
      // Track new student lead event
      if (data.formFillerType === 'student') {
        trackPixelEvent({
          name: PIXEL_EVENTS.STUDENT_LEAD,
          options: getCommonEventProperties(data)
        });
      }
      
      // Track new masters lead event
      if (data.currentGrade === 'masters') {
        trackPixelEvent({
          name: PIXEL_EVENTS.MASTERS_LEAD,
          options: getCommonEventProperties(data)
        });
      }
      
      trackPixelEvent({
        name: PIXEL_EVENTS.FORM_PAGE1,
        options: { 
          grade: data.currentGrade,
          form_filler_type: data.formFillerType,
          // Add timing data
          time_spent: Math.floor((Date.now() - startTime) / 1000),
          time_of_day: new Date().getHours()
        }
      });
      trackFormStepComplete(1);
      
      // Track parent-specific event if form filler is parent
      if (data.formFillerType === 'parent') {
        trackPixelEvent({
          name: PIXEL_EVENTS.PARENT_FORM_PAGE1,
          options: { 
            grade: data.currentGrade,
            form_filler_type: data.formFillerType,
            time_spent: Math.floor((Date.now() - startTime) / 1000),
            time_of_day: new Date().getHours()
          }
        });
      }
      
      // If grade 7 or below, submit form immediately with DROP lead category
      if (data.currentGrade === '7_below') {
        setSubmitting(true);
        // Determine lead category as DROP for grade 7 or below
        const leadCategory = determineLeadCategory(
          data.currentGrade,
          data.formFillerType,
          'scholarship_optional', // Default value, not used for categorization in this case
          'Others' // Default value, not used for categorization in this case
        );
        // Update form data with lead category
        updateFormData({ lead_category: leadCategory });
        
        // Track direct submit for grade 7 below
        const finalData = { ...formData, ...data, lead_category: leadCategory, startTime };
        trackStep(sessionId, 1, 'direct_submit_grade7', finalData);
        
        // Submit form with lead category
        await submitFormData({...data, lead_category: leadCategory}, 1, startTime, true, triggeredEvents);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      window.scrollTo(0, 0);
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

  const onSubmitStep2 = async (data: any) => {
    try {
      // For masters applications, we have different form validation
      if (formData.currentGrade === 'masters') {
        // We don't need to validate here as the form components handle validation
      } else {
        await validateForm(2, data);
      }
      
      // Combine form data BEFORE lead categorization
      const combinedFormData = { ...formData, ...data };
      
      // CRITICAL: Track events IMMEDIATELY after finalData is available, before any early returns
      // Track spammy parent event (GPA=10 or Percentage=100)
      if (combinedFormData.formFillerType === 'parent' && (combinedFormData.gpaValue === "10" || combinedFormData.percentageValue === "100")) {
        trackPixelEvent({
          name: PIXEL_EVENTS.SPAMMY_PARENT,
          options: {
            ...getCommonEventProperties(combinedFormData),
            gpa_value: combinedFormData.gpaValue,
            percentage_value: combinedFormData.percentageValue
          }
        });
      }
      
      // Track stateboard parent event
      if (combinedFormData.formFillerType === 'parent' && combinedFormData.curriculumType === 'State_Boards') {
        trackPixelEvent({
          name: PIXEL_EVENTS.STATEBOARD_PARENT,
          options: getCommonEventProperties(combinedFormData)
        });
      }
      
      // Determine lead category
      const leadCategory = formData.currentGrade === 'masters' 
        ? determineLeadCategory(
            combinedFormData.currentGrade,
            combinedFormData.formFillerType,
            combinedFormData.scholarshipRequirement,
            combinedFormData.curriculumType,
            undefined, // targetUniversityRank not used for masters
            combinedFormData.gpaValue,
            combinedFormData.percentageValue,
            combinedFormData.intake,
            combinedFormData.applicationPreparation,
            combinedFormData.targetUniversities,
            combinedFormData.supportLevel
          )
        : determineLeadCategory(
            combinedFormData.currentGrade,
            combinedFormData.formFillerType,
            combinedFormData.scholarshipRequirement,
            combinedFormData.curriculumType,
            combinedFormData.targetUniversityRank,
            combinedFormData.gpaValue,
            combinedFormData.percentageValue
          );
      
      // Save lead category to state
      setEvaluatedLeadCategory(leadCategory);
      
      // Update form store with lead category and new data
      updateFormData({ 
        ...data,
        lead_category: leadCategory 
      });
      
      // Create final data object with the determined lead category for all subsequent operations
      const finalData = { 
        ...combinedFormData, 
        lead_category: leadCategory 
      };
      
      // Track qualified lead event for bch, lum-l1, or lum-l2 categories
      if (['bch', 'lum-l1', 'lum-l2'].includes(leadCategory)) {
        trackPixelEvent({
          name: PIXEL_EVENTS.QUALIFIED_LEAD_RECEIVED,
          options: {
            lead_category: leadCategory,
            total_time_spent: Math.floor((Date.now() - startTime) / 1000),
            ...getCommonEventProperties(finalData)
          }
        });
      }
      
      // Track the appropriate event based on form type
      if (formData.currentGrade === 'masters') {
        trackPixelEvent({
          name: PIXEL_EVENTS.FORM_PAGE2_NEXT_MASTERS,
          options: { 
            lead_category: leadCategory,
            time_spent: Math.floor((Date.now() - startTime) / 1000),
            ...getCommonEventProperties(finalData)
          }
        });
      } else {
        trackPixelEvent({
          name: PIXEL_EVENTS.FORM_PAGE2_NEXT_REGULAR,
          options: { 
            lead_category: leadCategory,
            time_spent: Math.floor((Date.now() - startTime) / 1000),
            ...getCommonEventProperties(finalData)
          }
        });
      }
      
      // NEW: If form is filled by student, submit immediately regardless of other conditions
      if (finalData.formFillerType === 'student') {
        setSubmitting(true);
        
        // Track student direct submit
        trackStep(sessionId, 2, 'student_direct_submit', finalData);
        
        await submitFormData(finalData, 2, startTime, true, triggeredEvents);
        setSubmitting(false);
        setSubmitted(true);
        return;
      }
      
      // Track step 2 completion for parent-filled forms
      trackStep(sessionId, 2, formData.currentGrade === 'masters' ? 'academic_masters' : 'academic_regular', finalData);

      // Different flows based on lead category and grade
      if (leadCategory === 'nurture') {
        // CHANGE: Only show extended nurture form for grades 11 and 12 AND parent form fillers
        // Check for spam leads and submit directly
        if (finalData.gpaValue === "10" || finalData.percentageValue === "100") {
          // Spam lead - submit directly
          setSubmitting(true);
          
          // Track spam lead direct submit with correct lead category
          trackStep(sessionId, 2, 'spam_direct_submit', finalData);
          
          await submitFormData(finalData, 2, startTime, true, triggeredEvents);
          setSubmitting(false);
          setSubmitted(true);
        } else if (['11', '12'].includes(formData.currentGrade || '') && finalData.formFillerType === 'parent') {
          // For grade 11 or 12 NURTURE leads with parent form fillers, show extended form
          window.scrollTo(0, 0);
          // Show nurture-specific evaluation animation
          setSubmitting(true);
          setShowNurtureAnimation(true);
          
          setTimeout(() => {
            setShowNurtureAnimation(false);
            setSubmitting(false);
            // Go to the extended nurture form (Step 2.5)
            setStep(2.5);
          }, 10000); // 10 seconds for evaluation animation
        } else {
          // For all other grades (8, 9, 10, masters) with nurture category, submit directly
          setSubmitting(true);
          
          // Track direct submit for nurture leads
          trackStep(sessionId, 2, 'nurture_direct_submit', finalData);
          
          await submitFormData(finalData, 2, startTime, true, triggeredEvents);
          setSubmitting(false);
          setSubmitted(true);
        }
      } else {
        // For non-NURTURE leads, show the standard evaluation animation
        window.scrollTo(0, 0);
        setSubmitting(true);
        setShowEvaluationAnimation(true);
        setTimeout(() => {
          handleEvaluationComplete();
        }, 10000); // 10 seconds for evaluation animation
      }
    } catch (error) {
      if (error instanceof FormValidationError) {
        Object.values(error.errors).forEach(messages => {
          messages.forEach(message => toast.error(message));
        });
      } else {
        console.error('Error submitting form:', error);
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
        trackFormError(2, 'submission_error');
      }
      setSubmitting(false);
    }
  };

  const onSubmitExtendedNurture = async (data: ExtendedNurtureData) => {
    try {
      window.scrollTo(0, 0);
      
      // Combine current form data with extended nurture data BEFORE re-categorization
      const combinedFormData = { ...formData };
      
      // Re-categorize the lead based on extended nurture form responses
      const recategorizedLeadCategory = determineLeadCategory(
        combinedFormData.currentGrade!,
        combinedFormData.formFillerType!,
        combinedFormData.scholarshipRequirement!,
        combinedFormData.curriculumType!,
        combinedFormData.targetUniversityRank,
        combinedFormData.gpaValue,
        combinedFormData.percentageValue,
        undefined, // intake
        undefined, // applicationPreparation
        undefined, // targetUniversities
        undefined, // supportLevel
        data // Pass the extended nurture data for re-categorization
      );
      
      // Update form data with extended nurture responses and new lead category
      updateFormData({ 
        lead_category: recategorizedLeadCategory,
        extendedNurture: {
          ...data
        }
      });
      
      // Create final data object with the re-categorized lead category for all subsequent operations
      const finalExtendedNurtureData = {
        ...combinedFormData,
        lead_category: recategorizedLeadCategory,
        extendedNurture: { ...data }
      };
      
      // Track extended nurture form completion
      trackStep(sessionId, 2.5, 'extended_nurture', finalExtendedNurtureData);
      
      // Track qualified lead event for bch, lum-l1, or lum-l2 categories after re-categorization
      if (['bch', 'lum-l1', 'lum-l2'].includes(recategorizedLeadCategory)) {
        trackPixelEvent({
          name: PIXEL_EVENTS.QUALIFIED_LEAD_RECEIVED,
          options: {
            lead_category: recategorizedLeadCategory,
            total_time_spent: Math.floor((Date.now() - startTime) / 1000),
            ...getCommonEventProperties(finalExtendedNurtureData)
          }
        });
      }
      
      // If re-categorized as "nurture", don't show counselling form
      if (recategorizedLeadCategory === 'nurture') {
        // Submit the form directly
        setSubmitting(true);
        
        // Track nurture re-categorization direct submit with correct lead category
        trackStep(sessionId, 2.5, 'nurture_recategorized_submit', finalExtendedNurtureData);
        
        await submitFormData(finalExtendedNurtureData, 2.5, startTime, true, triggeredEvents);
        setSubmitting(false);
        setSubmitted(true);
      } else {
        // For other categories (bch, lum-l1, lum-l2), proceed to counselling form
        setStep(3);
      }
    } catch (error) {
      console.error('Error submitting extended nurture form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    }
  };

  const onSubmitStep3 = async (data: any) => {
    try {
      setSubmitting(true);
      
      // Prepare final data for submission
      const finalSubmissionData = {
        ...formData,
        counselling: {
          selectedDate: data.selectedDate,
          selectedSlot: data.selectedSlot
        }
      };
      
      // Track final submission
      trackStep(sessionId, 3, 'final_submit', finalSubmissionData);
      
      // Track page3 submit event with lead category
      trackPixelEvent({
        name: PIXEL_EVENTS.getPage3SubmitEvent(formData.lead_category || 'unknown'),
        options: {
          counselling_slot_picked: Boolean(data.selectedDate && data.selectedSlot),
          total_time_spent: Math.floor((Date.now() - startTime) / 1000),
          counsellor_name: formData.lead_category === 'bch' ? 'Viswanathan' : 'Karthik Lakshman',
          lead_category: formData.lead_category
        }
      });
      
      // Track form completion
      trackPixelEvent({
        name: PIXEL_EVENTS.FORM_COMPLETE,
        options: { 
          lead_category: formData.lead_category,
          counselling_booked: Boolean(data.selectedDate && data.selectedSlot),
          is_masters: formData.currentGrade === 'masters',
          extended_form_completed: formData.lead_category === 'nurture',
          total_time_spent: Math.floor((Date.now() - startTime) / 1000)
        }
      });
      
      // Track specific flow completion events based on lead category
      const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
      const counsellingBooked = Boolean(data.selectedDate && data.selectedSlot);
      
      if (formData.lead_category === 'bch') {
        trackPixelEvent({
          name: PIXEL_EVENTS.FLOW_COMPLETE_BCH,
          options: {
            total_time_spent: totalTimeSpent,
            counselling_booked: counsellingBooked,
            current_grade: formData.currentGrade,
            form_filler_type: formData.formFillerType,
            curriculum_type: formData.curriculumType
          }
        });
      } else if (formData.lead_category && formData.lead_category.startsWith('lum')) {
        trackPixelEvent({
          name: PIXEL_EVENTS.FLOW_COMPLETE_LUMINAIRE,
          options: {
            luminaire_level: formData.lead_category.replace('lum-', ''),
            total_time_spent: totalTimeSpent,
            counselling_booked: counsellingBooked,
            current_grade: formData.currentGrade,
            form_filler_type: formData.formFillerType
          }
        });
      } else if (formData.lead_category && formData.lead_category.startsWith('masters')) {
        trackPixelEvent({
          name: PIXEL_EVENTS.FLOW_COMPLETE_MASTERS,
          options: {
            masters_level: formData.lead_category.replace('masters-', ''),
            total_time_spent: totalTimeSpent,
            counselling_booked: counsellingBooked,
            application_preparation: formData.applicationPreparation
          }
        });
      }
      
      // Submit all form data including counselling details
      await submitFormData(finalSubmissionData, 3, startTime, true, triggeredEvents);
      
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
      trackFormError(3, 'submission_error');
      setSubmitting(false);
    }
  };

  // Handle completion of evaluation animation
  const handleEvaluationComplete = () => {
    setShowEvaluationAnimation(false);
    setCompactForm(false);
    setSubmitting(false);
    setStep(3);
    trackFormStepComplete(2);
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 1: return 25;
      case 2: return 50;
      case 2.5: return 75; // Extended nurture form
      case 3: return 100;
      default: return 0;
    }
  };
  
  useEffect(() => {
    // Track page view when component mounts or step changes
    trackPixelEvent({
      name: PIXEL_EVENTS.FORM_PAGE_VIEW,
      options: { 
        step: currentStep,
        current_grade: formData.currentGrade,
        form_filler_type: formData.formFillerType
      }
    });
    
    trackFormView();
  }, [currentStep, formData]);

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

  // Evaluation steps for NURTURE extended form animation
  const nurtureEvaluationSteps = [
    {
      message: "Analyzing your profile and target university fitment",
      duration: 3500
    },
    {
      message: "Evaluating scholarship and funding opportunities",
      duration: 3500
    },
    {
      message: "Building your optimal admissions pathway",
      duration: 3500
    }
  ];

  // Determine if we're handling a masters application
  const isMastersApplication = formData.currentGrade === 'masters';

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
          ) : formData.lead_category === 'nurture' ? (
            <p>Thank you for providing more details about your situation. Our admissions team will review your profile and reach out within 48 hours to discuss potential pathways that match your specific needs and requirements.</p>
          ) : (formData.counselling?.selectedDate && formData.counselling?.selectedSlot) ? (
            <p>We've scheduled your counselling session for {formData.counselling.selectedDate} at {formData.counselling.selectedSlot}. Our team will contact you soon to confirm.</p>
          ) : (
            <p>We appreciate you taking the time to share your profile with us. Our admissions team will reach out to you within the next 24 hours.</p>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitting && !showEvaluationAnimation && !showNurtureAnimation) {
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
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">
          {isMastersApplication ? "Transform Your Masters Journey" : "Transform Your Journey to Elite Universities"}
        </h2>
        <Progress value={getStepProgress()} className="mb-4" />
      </div>

      {/* Loading animation - Regular */}
      {showEvaluationAnimation && (
        <SequentialLoadingAnimation
          steps={evaluationSteps}
          onComplete={handleEvaluationComplete}
        />
      )}

      {/* Loading animation - Nurture specific */}
      {showNurtureAnimation && (
        <SequentialLoadingAnimation
          steps={nurtureEvaluationSteps}
          onComplete={() => {
            setShowNurtureAnimation(false);
            setSubmitting(false);
            setStep(2.5);
          }}
        />
      )}
      
      {!showEvaluationAnimation && !showNurtureAnimation && (
        <div 
          ref={containerRef}
          className={`relative space-y-8 transition-all duration-300 ease-in-out mx-auto px-4 sm:px-8 md:px-12 ${currentStep === 3 ? 'max-w-full' : 'max-w-full md:max-w-4xl'}`}
        >
          {currentStep === 1 && (
            <PersonalDetailsForm
              onSubmit={onSubmitStep1}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && isMastersApplication && (
            <MastersAcademicDetailsForm
              onSubmit={onSubmitStep2}
              onBack={() => setStep(1)}
              defaultValues={formData}
            />
          )}

          {currentStep === 2 && !isMastersApplication && (
            <AcademicDetailsForm
              onSubmit={onSubmitStep2}
              onBack={() => setStep(1)}
              defaultValues={formData}
            />
          )}

          {currentStep === 2.5 && ['11', '12'].includes(formData.currentGrade || '') && (
            <ExtendedNurtureForm
              onSubmit={onSubmitExtendedNurture}
              onBack={() => setStep(2)}
              defaultValues={formData.extendedNurture}
              currentGrade={formData.currentGrade}
              formFillerType={formData.formFillerType}
            />
          )}

          {currentStep === 3 && (
            <CounsellingForm
              onSubmit={onSubmitStep3}
              leadCategory={formData.lead_category}
            />
          )}
        </div>
      )}
    </div>
  );
}