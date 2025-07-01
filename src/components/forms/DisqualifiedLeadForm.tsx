/**
 * Disqualified Lead Form Component (Page 2B)
 * 
 * Purpose: Simple contact form for disqualified leads (Nurture, Drop, Masters).
 * Collects basic parent contact information without counseling booking.
 * 
 * Changes made:
 * - Created new simplified form for disqualified leads
 * - Minimal fields to reduce friction
 * - Clear messaging about next steps
 */

/**
 * Disqualified Lead Form Component (Page 2B) - Optimized for Mobile
 * 
 * Purpose: Simple contact form for disqualified leads with optimized UX.
 * Features sticky submit button and mobile-first design.
 * 
 * Changes made:
 * - Added sticky submit button at bottom of screen
 * - Moved back button to top as arrow
 * - Optimized for mobile real estate
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronRight, ArrowLeft, User, Mail, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { disqualifiedLeadSchema } from '@/schemas/form';
import { DisqualifiedLeadData, LeadCategory } from '@/types/form';
import { trackFormSection } from '@/lib/formTracking';
import { useFormStore } from '@/store/formStore';

interface DisqualifiedLeadFormProps {
  onSubmit: (data: DisqualifiedLeadData) => void;
  onBack: () => void;
  leadCategory: LeadCategory;
  defaultValues?: Partial<DisqualifiedLeadData>;
}

export function DisqualifiedLeadForm({ onSubmit, onBack, leadCategory, defaultValues }: DisqualifiedLeadFormProps) {
  const { sessionId } = useFormStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<DisqualifiedLeadData>({
    resolver: zodResolver(disqualifiedLeadSchema),
    defaultValues
  });

  const parentName = watch('parentName');
  const email = watch('email');
  
  // Track form sections as user completes them
  const trackSectionCompletion = async (sectionName: string, sectionData: any) => {
    try {
      await trackFormSection(sessionId, sectionName, sectionData, 2);
    } catch (error) {
      console.error('Section tracking error:', error);
    }
  };

  // Track parent details completion
  React.useEffect(() => {
    if (parentName && email) {
      trackSectionCompletion('contact_details_complete', {
        parentName,
        email,
        leadCategory,
        sessionId
      });
    }
  }, [parentName, email, leadCategory, sessionId]);

  // Check if form is ready for submission
  const isFormReady = parentName && email;

  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleFormSubmit = (data: DisqualifiedLeadData) => {
    window.scrollTo(0, 0);
    onSubmit(data);
  };

  // Get appropriate messaging based on lead category
  const getMessaging = () => {
    switch (leadCategory) {
      case 'masters-l1':
      case 'masters-l2':
        return {
          title: "Masters Program Guidance",
          description: "Thank you for your interest in our Masters program guidance. Our team will review your profile and reach out with personalized recommendations for your graduate school journey.",
          nextSteps: "Our Masters specialists will contact you within 48 hours to discuss your specific goals and create a customized application strategy."
        };
      case 'drop':
        return {
          title: "Early Academic Planning",
          description: "We appreciate your early interest in university planning. While our primary focus is on students in grades 8 and above, we'd be happy to provide guidance on academic preparation.",
          nextSteps: "Our team will reach out to discuss how we can support your academic journey and prepare for future university applications."
        };
      default: // nurture
        return {
          title: "Personalized University Guidance",
          description: "Thank you for sharing your academic profile with us. Based on your information, our team will create a customized plan to help you achieve your university goals.",
          nextSteps: "Our admissions counsellors shall get back to you to discuss your specific needs and create a personalized roadmap for your university applications."
        };
    }
  };

  const messaging = getMessaging();

  return (
    <div className="relative">
      {/* Back Button - Top Left */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-primary">{messaging.title}</h3>
          
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-gray-700 leading-relaxed text-sm md:text-base">
              {messaging.description}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm leading-relaxed font-medium">
                <strong>What happens next:</strong> {messaging.nextSteps}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Contact Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h4 className="text-lg font-medium text-primary">Contact Information</h4>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent's Name</Label>
                <Input
                  placeholder="Enter parent's full name"
                  id="parentName"
                  {...register('parentName')}
                  className={cn(
                    "h-12 bg-white",
                    errors.parentName ? 'border-red-500 focus:border-red-500' : ''
                  )}
                />
                {errors.parentName && (
                  <p className="text-sm text-red-500 italic">Please answer this question</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Parent's Email</Label>
                <Input
                  placeholder="Enter parent's email address"
                  id="email"
                  type="email"
                  {...register('email')}
                  className={cn(
                    "h-12 bg-white",
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 italic">Please enter a valid email address</p>
                )}
              </div>
            </div>
            
            {/* Desktop Submit Button - Standard Size */}
            <div className="hidden md:flex justify-center mt-6">
              <button
                onClick={handleSubmit(handleFormSubmit)}
                disabled={!isFormReady || isSubmitting}
                className={cn(
                  "px-8 py-3 rounded-lg text-base font-semibold transition-all duration-300 shadow-md flex items-center space-x-2",
                  isFormReady 
                    ? "bg-accent text-primary hover:bg-accent-light hover:shadow-lg" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                <span>
                  {!isFormReady 
                    ? "Enter your details" 
                    : isSubmitting 
                      ? "Submitting..." 
                      : "Submit Application"
                  }
                </span>
                {isFormReady && !isSubmitting && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Additional Information - Compact */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6">
            <h4 className="text-lg font-medium text-primary mb-4">What Happens Next?</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">Profile Review</p>
                  <p className="text-sm text-gray-600">Our team will carefully review your academic profile and goals</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">Personalized Outreach</p>
                  <p className="text-sm text-gray-600">We'll contact you with customized recommendations and next steps</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">Strategic Planning</p>
                  <p className="text-sm text-gray-600">Together, we'll create a roadmap to achieve your university goals</p>
                </div>
              </div>
            </div>
          </div>

        </form>
        
        {/* Mobile Sticky Submit Button Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!isFormReady || isSubmitting}
              className={cn(
                "w-full py-4 rounded-lg text-base font-bold transition-all duration-300 shadow-md flex items-center justify-center space-x-2",
                isFormReady 
                  ? "bg-accent text-primary hover:bg-accent-light hover:shadow-lg" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <span>
                {!isFormReady 
                  ? "Enter your details to continue" 
                  : isSubmitting 
                    ? "Submitting..." 
                    : "Submit Application"
                }
              </span>
              {isFormReady && !isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}