import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Label } from '../ui/label';
import { ChevronLeft, ChevronRight, Building, Calendar, Clock } from 'lucide-react';
import { CalendarSlotPicker } from '../CalendarSlotPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

// Step 3: Commitment Schema
const commitmentSchema = z.object({
  preferredCountries: z.array(z.enum([
    'USA (Rs. 1.6-2 Cr)',
    'UK (Rs. 1.2-1.6 Cr)',
    'Canada (Rs. 1.2-1.6 Cr)',
    'Australia (Rs. 1.2-1.6 Cr)',
    'Europe (Rs. 1-1.5 Cr)',
    'Asia (Singapore, Hong Kong) (Rs. 60L-1.5 Cr)',
    'Middle East (Dubai) (Rs. 60L-1.5 Cr)',
    'Other Geographies',
    'Need Guidance'
  ])).min(1, 'Please select at least one preferred destination'),
  targetUniversityRank: z.enum(['top_20', 'top_50', 'top_100', 'any_good']),
  scholarshipRequirement: z.enum(['good_to_have', 'must_have']),
  timelineCommitment: z.enum(['immediate_start', 'within_3_months', 'still_exploring']),
  consultationSlot: z.date().optional(),
});

export type CommitmentData = z.infer<typeof commitmentSchema>;

interface CommitmentFormProps {
  onSubmit: (data: CommitmentData) => void;
  onBack: () => void;
  defaultValues?: Partial<CommitmentData>;
}

export function CommitmentForm({ onSubmit, onBack, defaultValues }: CommitmentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<CommitmentData>({
    resolver: zodResolver(commitmentSchema),
    defaultValues
  });

  const consultationSlot = watch('consultationSlot');

  const handleFormSubmit = (data: CommitmentData) => {
    // Ensure we have all required data before submitting
    if (!data.preferredCountries || !data.targetUniversityRank || 
        !data.scholarshipRequirement || !data.timelineCommitment) {
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Building className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold text-primary">Commitment & Investment</h3>
      </div>


      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Target University Rank</Label>
          <Select onValueChange={(value) => setValue('targetUniversityRank', value as CommitmentData['targetUniversityRank'])}>
            <SelectTrigger className="h-12 bg-white border-gray-200">
              <SelectValue placeholder="Select target university rank" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top_20">Top 20 Universities</SelectItem>
              <SelectItem value="top_50">Top 50 Universities</SelectItem>
              <SelectItem value="top_100">Top 100 Universities</SelectItem>
              <SelectItem value="any_good">Any Good University</SelectItem>
            </SelectContent>
          </Select>
          {errors.targetUniversityRank && (
            <p className="text-sm text-red-500">{errors.targetUniversityRank.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Target Geographies</Label>
          <p className="text-sm text-gray-600 mb-2">Select your preferred destinations (includes typical budget ranges)</p>
          {errors.preferredCountries && (
            <p className="text-sm text-red-500 mb-2">{errors.preferredCountries.message}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'USA (Rs. 1.6-2 Cr)',
              'UK (Rs. 1.2-1.6 Cr)',
              'Canada (Rs. 1.2-1.6 Cr)',
              'Australia (Rs. 1.2-1.6 Cr)',
              'Europe (Rs. 1-1.5 Cr)',
              'Asia (Singapore, Hong Kong) (Rs. 60L-1.5 Cr)',
              'Middle East (Dubai) (Rs. 60L-1.5 Cr)',
              'Other Geographies',
              'Need Guidance'
            ].map((country) => (
              <label key={country} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  {...register('preferredCountries')}
                  value={country}
                  className="rounded border-gray-300 text-primary focus:ring-primary mt-1"
                />
                <span className="text-sm leading-tight">{country}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Scholarship Requirement</Label>
          <Select onValueChange={(value) => setValue('scholarshipRequirement', value as CommitmentData['scholarshipRequirement'])}>
            <SelectTrigger className="h-12 bg-white border-gray-200">
              <SelectValue placeholder="Select scholarship requirement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="good_to_have">Good to have</SelectItem>
              <SelectItem value="must_have">Must-have</SelectItem>
            </SelectContent>
          </Select>
          {errors.scholarshipRequirement && (
            <p className="text-sm text-red-500">{errors.scholarshipRequirement.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Planned Start Timeline</Label>
          <Select onValueChange={(value) => setValue('timelineCommitment', value as CommitmentData['timelineCommitment'])}>
            <SelectTrigger className="h-12 bg-white border-gray-200">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate_start">Immediate Start</SelectItem>
              <SelectItem value="within_3_months">Within 3 months</SelectItem>
              <SelectItem value="still_exploring">Still Exploring</SelectItem>
            </SelectContent>
          </Select>
          {errors.timelineCommitment && (
            <p className="text-sm text-red-500">{errors.timelineCommitment.message}</p>
          )}
        </div>

        <div className="mt-12 p-6 bg-primary/5 rounded-xl space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h4 className="text-lg font-semibold text-primary">Book Your Free Strategy Session</h4>
          </div>
          
          <p className="text-gray-600">
            Take the first step towards your dream university! Schedule a personalized 1-on-1 consultation 
            with our expert counselors to discuss your profile and create a winning strategy.
          </p>

          <CalendarSlotPicker
            value={consultationSlot}
            onChange={(date) => setValue('consultationSlot', date)}
            className="mb-4"
          />
          {errors.consultationSlot && (
            <p className="text-sm text-red-500">{errors.consultationSlot.message}</p>
          )}
        </div>

      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-100 text-gray-700 h-14 px-8 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        <button
          type="submit"
          className="bg-accent text-primary h-14 px-8 rounded-lg text-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2"
        >
          <span>Submit Application</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}