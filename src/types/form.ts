import { z } from 'zod';

// Shared enums for form validation
export const GRADE_LEVELS = ['7_below', '8', '9', '10', '11', '12', 'masters'] as const;
export const CURRICULUM_TYPES = ['IB', 'IGCSE', 'CBSE', 'ICSE', 'State_Boards', 'Others'] as const;
export const ACADEMIC_PERFORMANCES = ['top_5', 'top_10', 'top_25', 'others'] as const;
export const SCHOLARSHIP_REQUIREMENTS = ['scholarship_optional', 'partial_scholarship', 'full_scholarship'] as const;
export const FORM_FILLER_TYPES = ['parent', 'student'] as const;
export const TARGET_UNIVERSITY_RANKS = ['top_20', 'top_50', 'top_100', 'any_good'] as const;

// Masters-specific enums
export const INTAKE_OPTIONS = ['aug_sept_2025', 'jan_aug_2026', 'jan_aug_2027', 'other'] as const;
export const GRADUATION_STATUS_OPTIONS = ['2025', '2026', '2027', 'others', 'graduated'] as const;
export const WORK_EXPERIENCE_OPTIONS = ['0_years', '1_2_years', '3_5_years', '6_plus_years'] as const;
export const ENTRANCE_EXAM_OPTIONS = ['gre', 'gmat', 'planning', 'not_required'] as const;
export const GRADE_FORMAT_OPTIONS = ['gpa', 'percentage'] as const;

// New masters-specific enums
export const APPLICATION_PREPARATION_OPTIONS = [
  'researching_now',
  'taken_exams_identified_universities',
  'undecided_need_help'
] as const;

export const TARGET_UNIVERSITIES_OPTIONS = [
  'top_20_50',
  'top_50_100',
  'partner_university',
  'unsure'
] as const;

export const SUPPORT_LEVEL_OPTIONS = [
  'personalized_guidance',
  'exploring_options',
  'self_guided',
  'partner_universities'
] as const;

// Lead Categories
export const LEAD_CATEGORIES = ['BCH', 'lum-l1', 'lum-l2', 'NURTURE', 'masters-l1', 'masters-l2', 'DROP'] as const;
export type LeadCategory = typeof LEAD_CATEGORIES[number];

// Base form interfaces
export interface FormStep {
  currentStep: number;
  startTime: number;
}

export interface BaseFormData {
  studentFirstName: string;
  studentLastName: string;
  parentName: string;
  email: string;
  phoneNumber: string;
  whatsappConsent: boolean;
  currentGrade: typeof GRADE_LEVELS[number];
  formFillerType: typeof FORM_FILLER_TYPES[number];
}

export interface ContactMethods {
  call: boolean;
  callNumber?: string;
  whatsapp: boolean;
  whatsappNumber?: string;
  email: boolean;
  emailAddress?: string;
}

export interface AcademicFormData {
  curriculumType: typeof CURRICULUM_TYPES[number];
  schoolName: string;
  academicPerformance: typeof ACADEMIC_PERFORMANCES[number];
  targetUniversityRank: typeof TARGET_UNIVERSITY_RANKS[number];
  preferredCountries: string[];
  scholarshipRequirement: typeof SCHOLARSHIP_REQUIREMENTS[number];
  contactMethods: ContactMethods;
}

export interface MastersAcademicFormData {
  schoolName: string;
  intake: typeof INTAKE_OPTIONS[number];
  intakeOther?: string;
  graduationStatus: typeof GRADUATION_STATUS_OPTIONS[number];
  graduationYear?: string;
  workExperience: typeof WORK_EXPERIENCE_OPTIONS[number];
  gradeFormat: typeof GRADE_FORMAT_OPTIONS[number];
  gpaValue?: string;
  percentageValue?: string;
  entranceExam: typeof ENTRANCE_EXAM_OPTIONS[number];
  examScore?: string;
  fieldOfStudy: string;
  applicationPreparation: typeof APPLICATION_PREPARATION_OPTIONS[number];
  targetUniversities: typeof TARGET_UNIVERSITIES_OPTIONS[number];
  supportLevel: typeof SUPPORT_LEVEL_OPTIONS[number];
  scholarshipRequirement: typeof SCHOLARSHIP_REQUIREMENTS[number];
  contactMethods: ContactMethods;
}

export interface CounsellingFormData {
  selectedDate?: string;
  selectedSlot?: string;
}

// Combined form data type
export type CompleteFormData = BaseFormData & 
  (AcademicFormData | MastersAcademicFormData) & {
    lead_category?: LeadCategory;
    counselling?: CounsellingFormData;
  };

// Form submission response
export interface FormSubmissionResponse {
  success: boolean;
  error?: string;
  category?: LeadCategory;
}