/**
 * Data Validation Utility
 * 
 * Purpose: Validates data consistency between webhook payload and database records,
 * specifically focusing on lead category field integrity and character encoding.
 * 
 * Changes made:
 * - Created comprehensive validation system for lead category consistency
 * - Implemented error logging for category mismatches
 * - Added data integrity checks across the entire lifecycle
 */

import { LeadCategory, LEAD_CATEGORIES } from '@/types/form';

// Lead category validation interface
interface LeadCategoryValidation {
  isValid: boolean;
  category: string;
  errors: string[];
  warnings: string[];
}

// Data consistency report interface
interface DataConsistencyReport {
  webhookPayload: any;
  databaseRecord: any;
  leadCategoryMatch: boolean;
  encodingConsistent: boolean;
  validationErrors: string[];
  recommendations: string[];
}

/**
 * Validate lead category against schema requirements
 */
export const validateLeadCategory = (category: any): LeadCategoryValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if category exists
  if (!category) {
    errors.push('Lead category is null or undefined');
    return {
      isValid: false,
      category: '',
      errors,
      warnings
    };
  }
  
  // Check data type
  if (typeof category !== 'string') {
    errors.push(`Lead category must be string, received: ${typeof category}`);
    return {
      isValid: false,
      category: String(category),
      errors,
      warnings
    };
  }
  
  // Check for whitespace issues
  const trimmedCategory = category.trim();
  if (category !== trimmedCategory) {
    warnings.push('Lead category contains leading/trailing whitespace');
  }
  
  // Check against valid categories
  if (!LEAD_CATEGORIES.includes(trimmedCategory as LeadCategory)) {
    errors.push(`Invalid lead category: "${trimmedCategory}". Valid categories: ${LEAD_CATEGORIES.join(', ')}`);
    return {
      isValid: false,
      category: trimmedCategory,
      errors,
      warnings
    };
  }
  
  // Check for character encoding issues
  const encodedCategory = encodeURIComponent(trimmedCategory);
  const decodedCategory = decodeURIComponent(encodedCategory);
  if (decodedCategory !== trimmedCategory) {
    warnings.push('Potential character encoding issue detected');
  }
  
  return {
    isValid: errors.length === 0,
    category: trimmedCategory,
    errors,
    warnings
  };
};

/**
 * Compare lead category between webhook payload and database record
 */
export const compareLeadCategories = (
  webhookCategory: any,
  databaseCategory: any
): DataConsistencyReport => {
  const webhookValidation = validateLeadCategory(webhookCategory);
  const databaseValidation = validateLeadCategory(databaseCategory);
  
  const validationErrors: string[] = [];
  const recommendations: string[] = [];
  
  // Check if both are valid
  if (!webhookValidation.isValid) {
    validationErrors.push(`Webhook category invalid: ${webhookValidation.errors.join(', ')}`);
  }
  
  if (!databaseValidation.isValid) {
    validationErrors.push(`Database category invalid: ${databaseValidation.errors.join(', ')}`);
  }
  
  // Check for exact match
  const leadCategoryMatch = webhookValidation.category === databaseValidation.category;
  if (!leadCategoryMatch && webhookValidation.isValid && databaseValidation.isValid) {
    validationErrors.push(`Lead category mismatch: webhook="${webhookValidation.category}", database="${databaseValidation.category}"`);
    recommendations.push('Investigate data transformation during save process');
  }
  
  // Check encoding consistency
  const webhookEncoded = encodeURIComponent(webhookValidation.category);
  const databaseEncoded = encodeURIComponent(databaseValidation.category);
  const encodingConsistent = webhookEncoded === databaseEncoded;
  
  if (!encodingConsistent) {
    validationErrors.push('Character encoding inconsistency detected');
    recommendations.push('Review character encoding handling in data pipeline');
  }
  
  // Add warnings as recommendations
  if (webhookValidation.warnings.length > 0) {
    recommendations.push(`Webhook warnings: ${webhookValidation.warnings.join(', ')}`);
  }
  
  if (databaseValidation.warnings.length > 0) {
    recommendations.push(`Database warnings: ${databaseValidation.warnings.join(', ')}`);
  }
  
  return {
    webhookPayload: {
      category: webhookCategory,
      validation: webhookValidation
    },
    databaseRecord: {
      category: databaseCategory,
      validation: databaseValidation
    },
    leadCategoryMatch,
    encodingConsistent,
    validationErrors,
    recommendations
  };
};

/**
 * Sanitize and normalize lead category
 */
export const sanitizeLeadCategory = (category: any): string | null => {
  if (!category) return null;
  
  const stringCategory = String(category).trim().toLowerCase();
  
  // Find matching category (case-insensitive)
  const validCategory = LEAD_CATEGORIES.find(
    cat => cat.toLowerCase() === stringCategory
  );
  
  return validCategory || null;
};

/**
 * Log lead category validation errors
 */
export const logLeadCategoryError = (
  context: string,
  category: any,
  sessionId?: string,
  additionalData?: any
): void => {
  const validation = validateLeadCategory(category);
  
  if (!validation.isValid || validation.warnings.length > 0) {
    const errorData = {
      context,
      sessionId,
      category,
      validation,
      additionalData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    console.error('Lead Category Validation Error:', errorData);
    
    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to error tracking service
      // errorTrackingService.captureError('lead_category_validation', errorData);
    }
  }
};

/**
 * Validate complete form data for lead category consistency
 */
export const validateFormDataConsistency = (formData: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check lead category
  const categoryValidation = validateLeadCategory(formData.lead_category);
  if (!categoryValidation.isValid) {
    errors.push(...categoryValidation.errors);
  }
  warnings.push(...categoryValidation.warnings);
  
  // Check for data consistency based on lead category
  if (categoryValidation.isValid) {
    const category = categoryValidation.category as LeadCategory;
    
    // Validate category-specific requirements
    switch (category) {
      case 'masters-l1':
      case 'masters-l2':
        if (formData.currentGrade !== 'masters') {
          errors.push(`Masters category "${category}" requires currentGrade to be "masters", got: "${formData.currentGrade}"`);
        }
        break;
        
      case 'drop':
        if (formData.currentGrade !== '7_below') {
          errors.push(`Drop category requires currentGrade to be "7_below", got: "${formData.currentGrade}"`);
        }
        break;
        
      case 'bch':
      case 'lum-l1':
      case 'lum-l2':
        if (formData.currentGrade === 'masters' || formData.currentGrade === '7_below') {
          warnings.push(`Category "${category}" typically not used with grade "${formData.currentGrade}"`);
        }
        break;
    }
    
    // Check form filler type consistency
    if (formData.formFillerType === 'student' && !['nurture', 'drop'].includes(category)) {
      warnings.push(`Student-filled forms typically result in "nurture" category, got: "${category}"`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Generate data integrity report
 */
export const generateDataIntegrityReport = (
  webhookData: any,
  databaseData: any,
  sessionId: string
): DataConsistencyReport => {
  const report = compareLeadCategories(
    webhookData.lead_category,
    databaseData.lead_category
  );
  
  // Add session context
  report.webhookPayload.sessionId = sessionId;
  report.databaseRecord.sessionId = sessionId;
  
  // Log any issues found
  if (report.validationErrors.length > 0) {
    logLeadCategoryError(
      'Data Integrity Check',
      { webhook: webhookData.lead_category, database: databaseData.lead_category },
      sessionId,
      { webhookData, databaseData }
    );
  }
  
  return report;
};