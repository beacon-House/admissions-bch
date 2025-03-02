import { z } from 'zod';
import {
  GRADE_LEVELS,
  CURRICULUM_TYPES,
  ACADEMIC_PERFORMANCES,
  STUDY_PRIORITIES,
  SCHOLARSHIP_REQUIREMENTS,
  TIMELINE_COMMITMENTS,
  FORM_FILLER_TYPES,
  TARGET_UNIVERSITY_RANKS
} from '@/types/form';

// Personal Details Schema
export const personalDetailsSchema = z.object({
  currentGrade: z.enum(GRADE_LEVELS),
  formFillerType: z.enum(FORM_FILLER_TYPES),
  studentFirstName: z.string().min(2, 'First name is required'),
  studentLastName: z.string().min(1, 'Last name is required'),
  parentName: z.string().min(2, 'Parent name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number'),
  whatsappConsent: z.boolean().default(true)
});

// Academic Details Schema
export const academicDetailsSchema = z.object({
  schoolName: z.string().min(2, 'School name is required'),
  curriculumType: z.enum(CURRICULUM_TYPES),
  academicPerformance: z.enum(ACADEMIC_PERFORMANCES),
  studyAbroadPriority: z.enum(STUDY_PRIORITIES),
});

// Commitment Schema
export const commitmentSchema = z.object({
  preferredCountries: z.array(z.string()).min(1, 'Please select at least one preferred destination'),
  targetUniversityRank: z.enum(TARGET_UNIVERSITY_RANKS),
  scholarshipRequirement: z.enum(SCHOLARSHIP_REQUIREMENTS),
  timelineCommitment: z.enum(TIMELINE_COMMITMENTS),
  consultationDate: z.string().optional(),
  consultationTime: z.string().optional(),
});

// Complete Form Schema
export const completeFormSchema = personalDetailsSchema
  .merge(academicDetailsSchema)
  .merge(commitmentSchema);