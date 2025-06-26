/**
 * CounsellingForm Component
 * 
 * Purpose: Simplified counselling slot booking interface with direct date/time selection.
 * Users can select date and time directly, then submit with a single click.
 * 
 * Changes made:
 * - Removed complex swipe animation and modal system
 * - Direct inline date and time selection
 * - Single "Submit Application" button after selection
 * - Clean, friction-free booking experience
 */

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Award, ChevronRight, Clock, Linkedin } from 'lucide-react';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { LeadCategory } from '@/types/form';
import { cn } from '@/lib/utils';
import { trackPixelEvent, PIXEL_EVENTS } from '@/lib/pixel';

// Step 3: Counselling Booking Schema
const counsellingSchema = z.object({
  selectedDate: z.string().optional(),
  selectedSlot: z.string().optional(),
});

export type CounsellingData = z.infer<typeof counsellingSchema>;

interface CounsellingFormProps {
  onSubmit: (data: CounsellingData) => void;
  leadCategory?: LeadCategory;
}

// Define a slot interface with availability
interface TimeSlot {
  time: string;
  available: boolean;
}

export function CounsellingForm({ onSubmit, leadCategory }: CounsellingFormProps) {
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting }
  } = useForm<CounsellingData>({
    resolver: zodResolver(counsellingSchema),
    defaultValues: {}
  });

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
    
    // Track counselling form view when component mounts
    if (leadCategory) {
      if (PIXEL_EVENTS.getPage3ViewEvent) {
        trackPixelEvent({
          name: PIXEL_EVENTS.getPage3ViewEvent(leadCategory),
          options: {
            lead_category: leadCategory,
            counsellor_name: counselorName,
            form_loaded_timestamp: new Date().toISOString()
          }
        });
      }
    }
  }, [leadCategory, counselorName]);

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
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  const handleTimeSlotSelect = (slot: string) => {
    setSelectedTimeSlot(slot);
    
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      setValue('selectedDate', formattedDate);
      setValue('selectedSlot', slot);
      
      // Auto-scroll to submit button after a short delay
      setTimeout(() => {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }
  };

  const handleFormSubmit = (data: CounsellingData) => {
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center space-x-2 justify-center mb-4">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold text-primary">Meet Our Managing Director</h3>
        </div>
        
        <p className="text-gray-700 max-w-3xl mx-auto">
          Congratulations! Based on your profile, we believe you have excellent potential for admission to elite universities. 
          To maximize your chances, we invite you to a personal strategy session with one of our Managing Directors.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Mobile Layout */}
        {isMobile ? (
          <div className="space-y-6">
            {/* Counselor Card */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 shadow-md border border-primary/10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img 
                    src={counselorImage} 
                    alt={counselorName} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                    <Award className="w-4 h-4" />
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
                  <p className="text-sm text-gray-600 leading-relaxed">{counselorBio}</p>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Label className="text-lg font-medium text-primary flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5" />
                Select a Date
              </Label>
              
              <div className="grid grid-cols-7 gap-2">
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
                      <span className="text-lg font-bold">{dateNum}</span>
                      <span className="text-xs">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <Label className="text-lg font-medium text-primary flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" />
                  Available Times for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Label>
                
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No slots available for this day</p>
                ) : (
                  <Select onValueChange={handleTimeSlotSelect} value={selectedTimeSlot || ""}>
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
              </div>
            )}
          </div>
        ) : (
          /* Desktop Layout */
          <div className="space-y-6">
            {/* Desktop Grid Layout */}
            <div className="grid grid-cols-12 gap-6">
              {/* Counselor Card - 4 columns */}
              <div className="col-span-4">
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 shadow-md border border-primary/10 h-full">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <img 
                        src={counselorImage} 
                        alt={counselorName} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-accent text-primary p-1 rounded-full shadow-sm">
                        <Award className="w-4 h-4" />
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
                      <p className="text-sm text-gray-600 leading-relaxed">{counselorBio}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Date Selector - 4 columns */}
              <div className="col-span-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
                  <Label className="text-lg font-medium text-primary flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5" />
                    Select Date
                  </Label>
                  <div className="space-y-3">
                    {calendarDates.map((date, index) => {
                      const { day, date: dateNum, month } = formatDateDisplay(date);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                            selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-gray-200 hover:border-gray-300",
                            isToday(date) && "ring-2 ring-accent/30"
                          )}
                        >
                          <span className="font-medium">{day}, {month} {dateNum}</span>
                          {isToday(date) && <span className="text-xs bg-accent text-primary px-2 py-1 rounded">Today</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Time Slots - 4 columns */}
              <div className="col-span-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
                  <Label className="text-lg font-medium text-primary flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5" />
                    Available Times
                  </Label>
                  {!selectedDate ? (
                    <p className="text-sm text-gray-500 text-center py-8">Please select a date first</p>
                  ) : timeSlots.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No slots available for this day</p>
                  ) : (
                    <Select onValueChange={handleTimeSlotSelect} value={selectedTimeSlot || ""}>
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button - Only shows when slot is selected */}
        {selectedTimeSlot && (
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "bg-accent text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2",
                isMobile ? "w-full" : ""
              )}
            >
              <span>Submit Application</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}