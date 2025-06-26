import { LeadCategory, ExtendedNurtureFormData } from '@/types/form';
import { validateLeadCategory, logLeadCategoryError } from './dataValidation';

/**
 * Determines the lead category based on categorization logic
 * 
 * Categories:
 * 1. bch - High priority leads
 * 2. lum-l1 - Medium-high priority luminaire leads
 * 3. lum-l2 - Medium priority luminaire leads
 * 4. masters-l1 - High priority masters leads
 * 5. masters-l2 - Medium priority masters leads
 * 6. nurture - Default category for all others
 * 7. drop - Grade 7 or below, form directly submitted after step 1
 */
export const determineLeadCategory = (
  currentGrade: string,
  formFillerType: string,
  scholarshipRequirement: string,
  curriculumType: string,
  targetUniversityRank?: string,
  // Masters-specific fields
  gpaValue?: string,
  percentageValue?: string,
  intake?: string,
  applicationPreparation?: string,
  targetUniversities?: string,
  supportLevel?: string,
  // New parameter for Extended Nurture Form data
  extendedNurtureData?: ExtendedNurtureFormData
): LeadCategory => {
  let determinedCategory: LeadCategory;
  
  // NEW RULE: Student-filled forms are always categorized as nurture
  if (formFillerType === 'student') {
    determinedCategory = 'nurture';
  }
  // Filter out spam leads with unrealistic academic scores
  else if (gpaValue === "10" || percentageValue === "100") {
    determinedCategory = 'nurture';
  }
  // Special case: Grade 7 or below is directly submitted after step 1 and categorized as DROP
  else if (currentGrade === '7_below') {
    determinedCategory = 'drop';
  }
  // If extended nurture data exists, we need to re-categorize the lead
  else if (extendedNurtureData) {
    // Re-categorize based on form filler type and their answers
    if (formFillerType === 'parent') {
      const { partialFundingApproach } = extendedNurtureData;
      
      // Updated categorization based on new logic:
      if (partialFundingApproach === 'accept_loans') {
        determinedCategory = 'lum-l2';
      } else if (partialFundingApproach === 'affordable_alternatives') {
        determinedCategory = 'lum-l2';
      } else {
        // For defer_scholarships, only_full_funding
        determinedCategory = 'nurture';
      }
    } else if (formFillerType === 'student') {
      // First check if parentalSupport is "would_join"
      // If it's anything else, mark as nurture regardless of other answers
      if (extendedNurtureData.parentalSupport !== 'would_join') {
        determinedCategory = 'nurture';
      }
      
      const { partialFundingApproach } = extendedNurtureData;
      
      // CHANGE: If partialFundingApproach is 'accept_cover_remaining', always categorize as lum-l1 
      // for grades 11 and 12, regardless of curriculum
      if (partialFundingApproach === 'accept_cover_remaining') {
        // Still need to handle grades 9, 10 or grade 11 with top_20 target
        if (
          ['8', '9', '10'].includes(currentGrade) ||
          (currentGrade === '11' && targetUniversityRank === 'top_20' && ['IB', 'IGCSE'].includes(curriculumType))
        ) {
          determinedCategory = 'bch';
        } else if (['11', '12'].includes(currentGrade)) {
          // CHANGE: Now categorizing as lum-l1 regardless of curriculum type for grades 11/12
          determinedCategory = 'lum-l1';
        }
      } 
      // CHANGE: Added 'affordable_alternatives' as condition for lum-l2
      else if (partialFundingApproach === 'defer_external_scholarships' || partialFundingApproach === 'affordable_alternatives') {
        determinedCategory = 'lum-l2';
      } else {
        // For only_full_funding and need_to_ask_parents
        determinedCategory = 'nurture';
      }
    } else {
      determinedCategory = 'nurture';
    }
  }
  // If we don't have extended nurture data, continue with the original logic
  else if (scholarshipRequirement === 'full_scholarship' && currentGrade !== 'masters') {
    // CHANGE: Modified global override to exclude masters applicants
    // Global override: Full scholarship leads go to NURTURE by default (except masters)
    determinedCategory = 'nurture';
  }
  // MASTERS category evaluation
  else if (currentGrade === 'masters') {
    // First check if application preparation is "undecided_need_help"
    // If so, route to NURTURE regardless of other criteria
    if (applicationPreparation === 'undecided_need_help') {
      determinedCategory = 'nurture';
    }
    
    // Only proceed with masters-l1/masters-l2 evaluation if the user is actually preparing
    if (applicationPreparation === 'researching_now' || applicationPreparation === 'taken_exams_identified_universities') {
      // Logic based on target universities
      if (targetUniversities === 'top_20_50') {
        determinedCategory = 'masters-l1';
      } else if (targetUniversities === 'top_50_100' || targetUniversities === 'partner_university') {
        determinedCategory = 'masters-l2';
      } else if (targetUniversities === 'unsure') {
        determinedCategory = 'nurture';
      } else {
        determinedCategory = 'nurture';
      }
    } else {
      determinedCategory = 'nurture';
    }
  }
  // BCH category
  // Case 1: Grade 9 or 10, parent-filled form, scholarship not required or partial
  else if (
    ['8', '9', '10'].includes(currentGrade) &&
    formFillerType === 'parent' &&
    (scholarshipRequirement === 'scholarship_optional' || scholarshipRequirement === 'partial_scholarship')
  ) {
    determinedCategory = 'bch';
  }
  // Case 2: Grade 11, parent or IB/IGCSE student, scholarship not required or partial, top-20 target
  else if (
    currentGrade === '11' &&
    (scholarshipRequirement === 'scholarship_optional' || scholarshipRequirement === 'partial_scholarship') &&
    targetUniversityRank === 'top_20' &&
    (
      formFillerType === 'parent' || 
      (formFillerType === 'student' && ['IB', 'IGCSE'].includes(curriculumType))
    )
  ) {
    determinedCategory = 'bch';
  }
  else {
    // Check for lum-l1 or lum-l2 eligibility based on school year and curriculum
    const isEligibleForLuminaire = (
    ['11', '12'].includes(currentGrade) &&
    (
      formFillerType === 'parent' || 
      (formFillerType === 'student' && ['IB', 'IGCSE'].includes(curriculumType))
    )
    );

    if (isEligibleForLuminaire) {
      // Luminaire Level 1 (lum-l1) - scholarship_optional
      if (scholarshipRequirement === 'scholarship_optional') {
        // For Grade 11, must NOT have top_20 target (those go to BCH)
        if (currentGrade === '11' && targetUniversityRank === 'top_20') {
          // Skip since this would go to BCH (handled above)
          determinedCategory = 'nurture';
        } else {
          determinedCategory = 'lum-l1';
        }
      }
      // Luminaire Level 2 (lum-l2) - partial_scholarship
      else if (scholarshipRequirement === 'partial_scholarship') {
        determinedCategory = 'lum-l2';
      } else {
        determinedCategory = 'nurture';
      }
    } else {
      // Default: NURTURE for all other cases
      determinedCategory = 'nurture';
    }
  }
  
  // Validate the determined category
  const validation = validateLeadCategory(determinedCategory);
  if (!validation.isValid) {
    logLeadCategoryError(
      'Lead Categorization - Invalid Result',
      determinedCategory,
      undefined,
      {
        currentGrade,
        formFillerType,
        scholarshipRequirement,
        curriculumType,
        targetUniversityRank,
        extendedNurtureData
      }
    );
    // Fallback to nurture if categorization fails
    return 'nurture';
  }
  
  return determinedCategory;
}