import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronLeft, ChevronRight, GraduationCap, Phone, MessageSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

// Masters Academic Details Schema
const mastersAcademicDetailsSchema = z.object({
  schoolName: z.string().min(2, 'University name is required'),
  intake: z.enum(['aug_sept_2025', 'jan_2026', 'aug_sept_2026', 'other']),
  intakeOther: z.string().optional(),
  graduationStatus: z.enum(['2025', '2026', '2027', 'others', 'graduated']),
  graduationYear: z.string().min(1, 'Graduation year is required').optional().or(z.literal('')),
  workExperience: z.enum(['0_years', '1_2_years', '3_5_years', '6_plus_years']),
  gradeFormat: z.enum(['gpa', 'percentage']),
  gpaValue: z.string().optional(),
  percentageValue: z.string().optional(),
  entranceExam: z.enum(['gre', 'gmat', 'planning', 'not_required']),
  examScore: z.string().optional(),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  scholarshipRequirement: z.enum(['scholarship_optional', 'partial_scholarship', 'full_scholarship']),
  preferredCountries: z.array(z.string()).min(1, 'Please select at least one preferred destination'),
  contactMethods: z.object({
    call: z.boolean().default(false),
    callNumber: z.string().optional(),
    whatsapp: z.boolean().default(true),
    whatsappNumber: z.string().optional(),
    email: z.boolean().default(true),
    emailAddress: z.string().email().optional(),
  }).refine(data => data.call || data.whatsapp || data.email, {
    message: "Please select at least one contact method",
    path: ['contact']
  }),
}).refine(data => {
  if (data.gradeFormat === 'gpa') {
    return !!data.gpaValue;
  } else if (data.gradeFormat === 'percentage') {
    return !!data.percentageValue;
  }
  return true;
}, {
  message: "Please provide your grade in the selected format",
  path: ['gpaValue'],
});

export type MastersAcademicDetailsData = z.infer<typeof mastersAcademicDetailsSchema>;

interface MastersAcademicDetailsFormProps {
  onSubmit: (data: MastersAcademicDetailsData) => void;
  onBack: () => void;
  defaultValues?: Partial<MastersAcademicDetailsData>;
}

export function MastersAcademicDetailsForm({ onSubmit, onBack, defaultValues }: MastersAcademicDetailsFormProps) {
  const [callChecked, setCallChecked] = useState(defaultValues?.contactMethods?.call || false);
  const [whatsappChecked, setWhatsappChecked] = useState(defaultValues?.contactMethods?.whatsapp !== false); // Default to true unless explicitly false
  const [emailChecked, setEmailChecked] = useState(defaultValues?.contactMethods?.email !== false); // Default to true if not explicitly false
  const [showOtherIntake, setShowOtherIntake] = useState(defaultValues?.intake === 'other');
  const [selectedEntranceExam, setSelectedEntranceExam] = useState(defaultValues?.entranceExam || 'not_required');
  const [graduationStatus, setGraduationStatus] = useState(defaultValues?.graduationStatus || '2026');
  const [gradeFormat, setGradeFormat] = useState(defaultValues?.gradeFormat || 'gpa');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    watch,
    clearErrors,
  } = useForm<MastersAcademicDetailsData>({
    resolver: zodResolver(mastersAcademicDetailsSchema),
    defaultValues: {
      ...defaultValues,
      gradeFormat: defaultValues?.gradeFormat || 'gpa',
      contactMethods: {
        call: defaultValues?.contactMethods?.call || false,
        callNumber: defaultValues?.contactMethods?.callNumber || defaultValues?.phoneNumber || '',
        whatsapp: defaultValues?.contactMethods?.whatsapp !== false, // Default to true unless explicitly false
        whatsappNumber: defaultValues?.contactMethods?.whatsappNumber || defaultValues?.phoneNumber || '',
        email: defaultValues?.contactMethods?.email !== false, // Default to true if not explicitly false
        emailAddress: defaultValues?.contactMethods?.emailAddress || defaultValues?.email || '',
      }
    }
  });

  // Watch for changes to key fields
  const intake = watch('intake');
  const entranceExam = watch('entranceExam');
  const watchGraduationStatus = watch('graduationStatus');
  const watchGradeFormat = watch('gradeFormat');

  // Update states when values change
  useEffect(() => {
    setShowOtherIntake(intake === 'other');
    setSelectedEntranceExam(entranceExam);
    setGraduationStatus(watchGraduationStatus);
    setGradeFormat(watchGradeFormat);
  }, [intake, entranceExam, watchGraduationStatus, watchGradeFormat]);

  // Pre-fill contact methods with user data from step 1
  useEffect(() => {
    if (defaultValues) {
      // Pre-fill phone number if available
      if (defaultValues.phoneNumber && !defaultValues.contactMethods?.callNumber) {
        setValue('contactMethods.callNumber', defaultValues.phoneNumber);
      }
      
      // Pre-fill WhatsApp with phone number if available
      if (defaultValues.phoneNumber && !defaultValues.contactMethods?.whatsappNumber) {
        setValue('contactMethods.whatsappNumber', defaultValues.phoneNumber);
      }
      
      // Pre-fill email if available
      if (defaultValues.email && !defaultValues.contactMethods?.emailAddress) {
        setValue('contactMethods.emailAddress', defaultValues.email);
      }
    }
  }, [defaultValues, setValue]);

  const handleContactMethodChange = (method: 'call' | 'whatsapp' | 'email', checked: boolean) => {
    setValue(`contactMethods.${method}`, checked);
    
    if (method === 'call') {
      setCallChecked(checked);
      // If enabling call and field is empty, pre-fill with phone number
      if (checked && !getValues('contactMethods.callNumber') && defaultValues?.phoneNumber) {
        setValue('contactMethods.callNumber', defaultValues.phoneNumber);
      }
    }
    
    if (method === 'whatsapp') {
      setWhatsappChecked(checked);
      // If enabling whatsapp and field is empty, pre-fill with phone number
      if (checked && !getValues('contactMethods.whatsappNumber') && defaultValues?.phoneNumber) {
        setValue('contactMethods.whatsappNumber', defaultValues.phoneNumber);
      }
    }
    
    if (method === 'email') {
      setEmailChecked(checked);
      // If enabling email and field is empty, pre-fill with email
      if (checked && !getValues('contactMethods.emailAddress') && defaultValues?.email) {
        setValue('contactMethods.emailAddress', defaultValues.email);
      }
    }
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    onBack();
  };

  const handleFormSubmit = (data: MastersAcademicDetailsData) => {
    window.scrollTo(0, 0);
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <GraduationCap className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold text-primary">Masters Program Details</h3>
      </div>

      <div className="space-y-6">
        {/* University Name */}
        <div className="space-y-2">
          <Label htmlFor="schoolName">Current/Previous University</Label>
          <Input
            placeholder="Enter your university name"
            id="schoolName"
            {...register('schoolName')}
            className="h-12"
          />
          {errors.schoolName && (
            <p className="text-sm text-red-500">{errors.schoolName.message}</p>
          )}
        </div>

        {/* Graduation Year */}
        <div className="space-y-2">
          <Label>When do you expect to graduate?</Label>
          <Select 
            onValueChange={(value) => setValue('graduationStatus', value as MastersAcademicDetailsData['graduationStatus'])}
            defaultValue={defaultValues?.graduationStatus}
          >
            <SelectTrigger className="h-12 bg-white">
              <SelectValue placeholder="Select your expected graduation year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="others">Others</SelectItem>
              <SelectItem value="graduated">Graduated Already</SelectItem>
            </SelectContent>
          </Select>
          {errors.graduationStatus && (
            <p className="text-sm text-red-500">{errors.graduationStatus.message}</p>
          )}
        </div>

        {/* Intake */}
        <div className="space-y-2">
          <Label>Which intake are you applying for?</Label>
          <Select 
            onValueChange={(value) => setValue('intake', value as MastersAcademicDetailsData['intake'])}
            defaultValue={defaultValues?.intake}
          >
            <SelectTrigger className="h-12 bg-white">
              <SelectValue placeholder="Select intake" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aug_sept_2025">Aug/Sept 2025</SelectItem>
              <SelectItem value="jan_2026">Jan 2026</SelectItem>
              <SelectItem value="aug_sept_2026">Aug/Sept 2026</SelectItem>
              <SelectItem value="other">Others</SelectItem>
            </SelectContent>
          </Select>
          {errors.intake && (
            <p className="text-sm text-red-500">{errors.intake.message}</p>
          )}

          {/* Other intake text field */}
          {showOtherIntake && (
            <div className="mt-2">
              <Input
                placeholder="Please specify your intake"
                {...register('intakeOther')}
                className="h-12"
              />
            </div>
          )}
        </div>

        {/* Work Experience */}
        <div className="space-y-2">
          <Label>How many years of work experience do you have?</Label>
          <Select 
            onValueChange={(value) => setValue('workExperience', value as MastersAcademicDetailsData['workExperience'])}
            defaultValue={defaultValues?.workExperience}
          >
            <SelectTrigger className="h-12 bg-white">
              <SelectValue placeholder="Select work experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0_years">0 years</SelectItem>
              <SelectItem value="1_2_years">1-2 years</SelectItem>
              <SelectItem value="3_5_years">3-5 years</SelectItem>
              <SelectItem value="6_plus_years">6+ years</SelectItem>
            </SelectContent>
          </Select>
          {errors.workExperience && (
            <p className="text-sm text-red-500">{errors.workExperience.message}</p>
          )}
        </div>

        {/* Target Geographies */}
        <div className="space-y-2">
          <Label>Target Geographies</Label>
          <p className="text-sm text-gray-600 mb-2">
            Select your preferred destinations
          </p>
          {errors.preferredCountries && (
            <p className="text-sm text-red-500 mb-2">{errors.preferredCountries.message}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'USA',
              'UK',
              'Canada',
              'Australia',
              'Europe',
              'Asia (Singapore, Hong Kong)',
              'Middle East',
              'Other Geographies',
              'Need Guidance'
            ].map((country) => (
              <label key={country} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  {...register('preferredCountries')}
                  value={country}
                  defaultChecked={defaultValues?.preferredCountries?.includes(country)}
                  className="rounded border-gray-300 text-primary focus:ring-primary mt-1"
                />
                <span className="text-sm leading-tight">{country}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Academic Grade Format Selection */}
        <div className="space-y-2">
          <Label>What format would you like to provide your undergraduate grade in?</Label>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button
              type="button"
              onClick={() => {
                setValue('gradeFormat', 'gpa');
                clearErrors('gpaValue');
              }}
              className={cn(
                "h-12 flex items-center justify-center border rounded-lg font-medium transition-colors",
                gradeFormat === 'gpa'
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              GPA Format
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('gradeFormat', 'percentage');
                clearErrors('percentageValue');
              }}
              className={cn(
                "h-12 flex items-center justify-center border rounded-lg font-medium transition-colors",
                gradeFormat === 'percentage'
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              Percentage Format
            </button>
          </div>

          {/* Show appropriate input field based on selected format */}
          {gradeFormat === 'gpa' ? (
            <div className="space-y-2">
              <Label htmlFor="gpaValue">GPA (on a 10.0 scale)</Label>
              <Input
                placeholder="Enter your GPA (e.g., 8.2)"
                id="gpaValue"
                {...register('gpaValue')}
                className="h-12"
              />
              {errors.gpaValue && (
                <p className="text-sm text-red-500">{errors.gpaValue.message || "Please provide your GPA"}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="percentageValue">Percentage</Label>
              <Input
                placeholder="Enter your percentage (e.g., 85%)"
                id="percentageValue"
                {...register('percentageValue')}
                className="h-12"
              />
              {errors.percentageValue && (
                <p className="text-sm text-red-500">{errors.percentageValue.message || "Please provide your percentage"}</p>
              )}
            </div>
          )}
        </div>

        {/* Field of Study */}
        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy">What is your intended field of study?</Label>
          <Input
            placeholder="E.g., Computer Science, Business Analytics, etc."
            id="fieldOfStudy"
            {...register('fieldOfStudy')}
            className="h-12"
          />
          {errors.fieldOfStudy && (
            <p className="text-sm text-red-500">{errors.fieldOfStudy.message}</p>
          )}
        </div>

        {/* Entrance Exam */}
        <div className="space-y-2">
          <Label>Do you have a GRE/GMAT score (if required for your programs)?</Label>
          <Select 
            onValueChange={(value) => setValue('entranceExam', value as MastersAcademicDetailsData['entranceExam'])}
            defaultValue={defaultValues?.entranceExam}
          >
            <SelectTrigger className="h-12 bg-white">
              <SelectValue placeholder="Select exam status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gre">Yes - GRE</SelectItem>
              <SelectItem value="gmat">Yes - GMAT</SelectItem>
              <SelectItem value="planning">No - but planning to take it</SelectItem>
              <SelectItem value="not_required">Not required for my programs</SelectItem>
            </SelectContent>
          </Select>
          {errors.entranceExam && (
            <p className="text-sm text-red-500">{errors.entranceExam.message}</p>
          )}

          {/* Show score input if GRE or GMAT selected */}
          {(selectedEntranceExam === 'gre' || selectedEntranceExam === 'gmat') && (
            <div className="mt-2">
              <Input
                placeholder={selectedEntranceExam === 'gre' ? "GRE Score" : "GMAT Score"}
                {...register('examScore')}
                className="h-12"
              />
            </div>
          )}
        </div>

        {/* Scholarship Requirement */}
        <div className="space-y-3">
          <Label>Level of scholarship needed<span className="text-red-500">*</span></Label>
          <p className="text-sm text-gray-600 mb-2">
            Please select your scholarship requirements:
          </p>
          
          <div className="space-y-3">
            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                {...register('scholarshipRequirement')}
                value="full_scholarship"
                className="mt-0.5"
              />
              <div className="space-y-1">
                <span className="font-medium">Full scholarship needed</span>
                <p className="text-sm text-gray-600">I require 100% financial assistance to pursue my studies</p>
              </div>
            </label>
            
            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                {...register('scholarshipRequirement')}
                value="partial_scholarship"
                className="mt-0.5"
              />
              <div className="space-y-1">
                <span className="font-medium">Partial scholarship needed</span>
                <p className="text-sm text-gray-600">I can cover some costs but require partial financial support</p>
              </div>
            </label>
            
            <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                {...register('scholarshipRequirement')}
                value="scholarship_optional"
                className="mt-0.5"
              />
              <div className="space-y-1">
                <span className="font-medium">Scholarship optional</span>
                <p className="text-sm text-gray-600">I can pursue my studies without scholarship support</p>
              </div>
            </label>
          </div>
          
          {errors.scholarshipRequirement && (
            <p className="text-sm text-red-500">{errors.scholarshipRequirement.message}</p>
          )}
        </div>

        {/* Communication Preferences Section */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <Label className="text-lg font-medium">How Would You Like Us to Contact You?</Label>
          <p className="text-sm text-gray-600 mb-2">
            Choose your preferred communication methods (select at least one)
          </p>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  id="callMethod"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={callChecked}
                  onChange={(e) => handleContactMethodChange('call', e.target.checked)}
                />
                <Label htmlFor="callMethod" className="mb-0 cursor-pointer flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>Phone Call</span>
                </Label>
              </div>
              <div className="flex-1">
                <Input
                  {...register('contactMethods.callNumber')}
                  disabled={!callChecked}
                  placeholder="Enter phone number for calls"
                  className={cn(
                    "h-10",
                    !callChecked && "bg-gray-100 text-gray-500"
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  id="whatsappMethod"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={whatsappChecked}
                  onChange={(e) => handleContactMethodChange('whatsapp', e.target.checked)}
                />
                <Label htmlFor="whatsappMethod" className="mb-0 cursor-pointer flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span>WhatsApp</span>
                </Label>
              </div>
              <div className="flex-1">
                <Input
                  {...register('contactMethods.whatsappNumber')}
                  disabled={!whatsappChecked}
                  placeholder="Enter WhatsApp number" 
                  className={cn(
                    "h-10",
                    !whatsappChecked && "bg-gray-100 text-gray-500"
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-[140px]">
                <input
                  type="checkbox"
                  id="emailMethod"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={emailChecked}
                  onChange={(e) => handleContactMethodChange('email', e.target.checked)}
                />
                <Label htmlFor="emailMethod" className="mb-0 cursor-pointer flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>Email</span>
                </Label>
              </div>
              <div className="flex-1">
                <Input
                  {...register('contactMethods.emailAddress')}
                  disabled={!emailChecked}
                  placeholder="Enter email address"
                  className={cn(
                    "h-10",
                    !emailChecked && "bg-gray-100 text-gray-500"
                  )}
                />
              </div>
            </div>
            
            {errors.contactMethods && (
              <p className="text-sm text-red-500">Please select at least one contact method</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          className="bg-gray-100 text-gray-700 h-14 px-8 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center space-x-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        <button
          type="submit"
          className="bg-accent text-primary h-14 px-8 rounded-lg text-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg flex items-center space-x-2"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}