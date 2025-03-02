import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { addDays, setHours, setMinutes, isAfter, addHours, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

const BUSINESS_RULES = {
  minAdvanceHours: 2,
  startHour: 10, // 10 AM
  endHour: 20,   // 8 PM
  maxDaysAhead: 14,
  defaultTimezone: 'local'
} as const;

interface CalendarSlotPickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
}

export function CalendarSlotPicker({ value, onChange }: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(value || null);
  const [selectedTime, setSelectedTime] = React.useState<Date | null>(null);

  // Generate available time slots for a given date
  const getTimeSlots = (date: Date): Date[] => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const slots: Date[] = [];
    
    let startHour = BUSINESS_RULES.startHour;
    if (isToday) {
      // For today, only show slots at least minAdvanceHours ahead
      const minStartTime = addHours(now, BUSINESS_RULES.minAdvanceHours);
      startHour = Math.max(BUSINESS_RULES.startHour, minStartTime.getHours());
    }

    for (let hour = startHour; hour < BUSINESS_RULES.endHour; hour++) {
      const slot = setHours(setMinutes(date, 0), hour);
      if (!isToday || isAfter(slot, addHours(now, BUSINESS_RULES.minAdvanceHours))) {
        slots.push(slot);
      }
    }

    return slots;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: Date) => {
    setSelectedTime(time);
    const dateWithTime = new Date(time);
    // Only update parent state if onChange is provided
    if (onChange) {
      onChange(dateWithTime);
    }
  };

  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-2">1. Select a Date</h4>
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={new Date()}
          maxDate={addDays(new Date(), BUSINESS_RULES.maxDaysAhead)}
          dateFormat="MMMM d, yyyy"
          className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholderText="Select a date"
          inline
        />
      </div>

      {selectedDate && (
        <div>
          <h4 className="text-lg font-semibold mb-2">2. Choose a Time Slot</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timeSlots.length > 0 ? timeSlots.map((slot) => (
              <button
                key={slot.toISOString()}
                onClick={() => handleTimeSelect(slot)}
                type="button"
                className={`h-12 rounded-lg border transition-all duration-200 ${
                  selectedTime?.toISOString() === slot.toISOString()
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                {format(slot, 'h:mm a')}
              </button>
            )) : (
              <p className="col-span-full text-gray-500 text-center py-4">
                No available slots for this date
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500">
        All times are in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
      </p>
    </div>
  );
}