/**
 * Qualified Lead Form Component (Page 2A) - Optimized for Mobile
 * 
 * Purpose: Handles counseling booking for qualified leads with optimized UX to reduce drop-offs.
 * Features sticky submit button, shortened messaging, and mobile-first design.
 * 
 * Changes made:
 * - Added sticky submit button at bottom of screen
 * - Shortened congratulations message for mobile
 * - Moved back button to top as arrow
 * - Reorganized layout to prioritize counselor and booking
 * - Optimized for mobile real estate
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, Award, ChevronRight, Clock, Linkedin, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';
import { qualifiedLeadSchema } from '@/schemas/form';
import { QualifiedLeadData, LeadCategory } from '@/types/form';
import { trackFormSection } from '@/lib/formTracking';
import { useFormStore } from '@/store/formStore';

interface QualifiedLeadFormProps {
  onSubmit: (data: QualifiedLeadData) => void;
  onBack: () => void;
  leadCategory: LeadCategory;
  defaultValues?: Partial<QualifiedLeadData>;
}

// Define a slot interface with availability
interface TimeSlot {
  time: string;
  available: boolean;
}

export function QualifiedLeadForm({ onSubmit, onBack, leadCategory, defaultValues }: QualifiedLeadFormProps) {
  const { sessionId } = useFormStore();

  // Determine which counselor to show based on lead category
  const isBCH = leadCategory === 'bch';
  const counselorName = isBCH ? "Viswanathan" : "Karthik Lakshman";
  const counselorImage = isBCH ? "/vishy.png" : "/karthik.png";
  const counselorTitle = "Managing Director";
  const linkedinUrl = isBCH 
    ? "https://www.linkedin.com/in/viswanathan-r-8504182/" 
    : "https://www.linkedin.com/in/karthiklakshman/";
  
  const counselorBio = isBCH 
    ? "IIT-BHU & IIM Kozhikode alumnus. Former Chief Product Officer at Byju's with extensive experience in education technology."
    : "Georgia Tech Masters graduate. Former McKinsey consultant and Byju's Test Prep division leader with international education expertise.";

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    watch
  } = useForm<QualifiedLeadData>({
    resolver: zodResolver(qualifiedLeadSchema),
    defaultValues
  });

  const selectedSlot = watch('selectedSlot');
  const parentName = watch('parentName');
  const email = watch('email');
  const formSelectedDate = watch('selectedDate');

  // Check if form is ready for submission
  const isFormReady = selectedSlot && parentName && email;

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate the 7-day calendar starting from today
  useEffect(() => {
    const today = new Date();
    const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date;
    });
    
    setCalendarDates(nextSevenDays);
    
    // Default to selecting today
    setSelectedDate(today);
  }, []);

  // Generate available time slots (10 AM to 8 PM, except 2 PM)
  const getTimeSlots = () => {
    const now = new Date();
    const today = new Date().setHours(0, 0, 0, 0);
    const selectedDay = selectedDate ? selectedDate.setHours(0, 0, 0, 0) : null;
    const isToday = today === selectedDay;
    
    const currentHour = now.getHours();
    const minHour = isToday ? currentHour + 2 : 10;
    
    const allSlots: TimeSlot[] = [];
    for (let hour = 10; hour <= 20; hour++) {
      if (hour !== 14) { // Skip 2 PM
        const formattedHour = hour === 12 ? "12 PM" : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
        const isTooSoon = isToday && hour < minHour;
        
        let isAvailable = true;
        if (!isBCH && selectedDate) {
          const dayOfWeek = selectedDate.getDay();
          if (dayOfWeek === 0) { // Sunday for Karthik
            isAvailable = false;
          } else {
            isAvailable = (hour >= 11 && hour < 14) || (hour >= 16 && hour <= 20);
          }
        }
        
        allSlots.push({
          time: formattedHour,
          available: !isTooSoon && isAvailable
        });
      }
    }
    
    // Return only available slots
    return allSlots.filter(slot => slot.available);
  };

  const timeSlots = getTimeSlots();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setValue('selectedSlot', ''); // Reset time slot when date changes
    
    if (date) {
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setValue('selectedDate', formattedDate);
    }
  };

  const handleTimeSlotSelect = (slot: string) => {
    setValue('selectedSlot', slot);
  };

  // Track form sections as user completes them
  const trackSectionCompletion = async (sectionName: string, sectionData: any) => {
    try {
      await trackFormSection(sessionId, sectionName, sectionData, 2);
    } catch (error) {
      console.error('Section tracking error:', error);
    }
  };

  // Track counseling slot selection
  React.useEffect(() => {
    if (formSelectedDate && selectedSlot) {
      trackSectionCompletion('counseling_slot_selected', {
        selectedDate: formSelectedDate,
        selectedSlot,
        counselorName,
        leadCategory,
        sessionId
      });
    }
  }, [formSelectedDate, selectedSlot, counselorName, leadCategory, sessionId]);

  // Track parent details completion
  React.useEffect(() => {
    if (parentName && email) {
      trackSectionCompletion('parent_details_complete', {
        parentName,
        email,
        sessionId
      });
    }
  }, [parentName, email, sessionId]);

  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleFormSubmit = (data: QualifiedLeadData) => {
    window.scrollTo(0, 0);
    onSubmit(data);
  };

  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

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

      <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Shortened Header for Mobile */}
        <div className="text-center space-y-4 mb-8">
          {/* Mobile - Very Short Message */}
          <div className="block md:hidden">
            <h3 className="text-xl font-bold text-primary">
              {defaultValues?.studentFirstName ? `Great news about ${defaultValues.studentFirstName}! 🎉` : 'Congratulations! 🎉'}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Excellent potential for elite university admissions! Book a strategy session with our Managing Director.
            </p>
          </div>
          
          {/* Desktop - Full Message */}
          <div className="hidden md:block max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-3">
              {defaultValues?.studentFirstName ? `Great news about ${defaultValues.studentFirstName}! 🎉` : 'Congratulations! 🎉'}
            </h3>
            <p className="text-gray-700 text-base leading-relaxed">
              {defaultValues?.studentFirstName 
                ? `${defaultValues.studentFirstName} has excellent potential for elite university admissions. Book a strategy session with our Managing Director.`
                : `You have excellent potential for elite university admissions. Book a strategy session with our Managing Director.`
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Mobile Layout */}
          {isMobile ? (
            <>
              {/* Counselor Profile - Mobile */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 shadow-md border border-primary/10 mb-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={counselorImage} 
                      alt={counselorName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                      <Award className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className="text-lg font-bold text-primary">{counselorName}</h4>
                      <a 
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm font-medium text-primary/80">{counselorTitle}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{counselorBio}</p>
                  </div>
                </div>
              </div>

              {/* Slot Selection - Mobile */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h4 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Your Session
                </h4>
                
                <div className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-3 block">
                      Choose Date
                    </Label>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, index) => {
                        const { day, date: dateNum, month } = formatDateDisplay(date);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "flex flex-col items-center justify-center p-1 rounded-lg border-2 transition-all text-xs",
                              selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                              isToday(date) && "ring-1 ring-accent/30"
                            )}
                          >
                            <span className="font-semibold">{day}</span>
                            <span className="text-sm font-bold">{dateNum}</span>
                            <span className="text-xs">{month}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.selectedDate && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a date</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <Label className="text-base font-medium text-gray-700 mb-3 block">
                        Choose Time
                      </Label>
                      {timeSlots.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No slots available for this day</p>
                      ) : (
                        <Controller
                          name="selectedSlot"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              handleTimeSlotSelect(value);
                            }} value={field.value}>
                              <SelectTrigger className="h-12 bg-white">
                                <SelectValue placeholder="Choose a time slot" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((slot, index) => (
                                  <SelectItem key={index} value={slot.time}>
                                    {slot.time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}
                      {errors.selectedSlot && (
                        <p className="text-sm text-red-500 italic mt-2">Please select a time slot</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contact Information - Mobile */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <h4 className="text-lg font-medium text-primary mb-4">Parent Details</h4>
                
                <div className="space-y-4">
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
              </div>
            </>
          ) : (
            /* Desktop Layout - Compact Rounded Rectangle */
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Top Section: Counselor Profile */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={counselorImage} 
                      alt={counselorName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                      <Award className="w-3 h-3" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-bold text-primary">{counselorName}</h4>
                      <a 
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-sm font-medium text-primary/80 mb-2">{counselorTitle}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{counselorBio}</p>
                  </div>
                </div>
              </div>
              
              {/* Middle Section: Date and Time Selection */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Select Your Session
                </h4>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Choose Date
                    </Label>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, index) => {
                        const { day, date: dateNum, month } = formatDateDisplay(date);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-xs",
                              selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300",
                              isToday(date) && "ring-2 ring-accent/30"
                            )}
                          >
                            <span className="font-semibold">{day}</span>
                            <span className="text-sm font-bold">{dateNum}</span>
                            <span className="text-xs">{month}</span>
                            {isToday(date) && <span className="text-xs bg-accent text-primary px-1 rounded mt-0.5">Today</span>}
                          </button>
                        );
                      })}
                    </div>
                    {errors.selectedDate && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a date</p>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Available Times
                    </Label>
                    {!selectedDate ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Please select a date first</p>
                    ) : timeSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No slots available</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setValue('selectedSlot', slot.time);
                              handleTimeSlotSelect(slot.time);
                            }}
                            className={cn(
                              "p-2 rounded-lg border-2 text-xs font-medium transition-all",
                              selectedSlot === slot.time
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                    {errors.selectedSlot && (
                      <p className="text-sm text-red-500 italic mt-2">Please select a time slot</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Bottom Section: Contact Information */}
              <div className="p-6">
                <h4 className="text-lg font-medium text-primary mb-4">Parent Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
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
                
                {/* Submit Button - Desktop Standard Size */}
                <div className="mt-6 flex justify-center">
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
                        ? "Complete all fields" 
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
          )}
        </form>
      </div>

      {/* Mobile Sticky Submit Button Only */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto">
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
                  ? "Complete all fields to continue" 
                  : isSubmitting 
                    ? "Submitting..." 
                    : "Submit Application"
                }
              </span>
              {isFormReady && !isSubmitting && <ChevronRight className="w-5 h-5" />}
            </button>
            
            {/* Progress Indicator */}
            {isFormReady && selectedSlot && (
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-600">
                  Session: {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedSlot}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}