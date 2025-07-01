# Lead Categorization Logic v8.0

## Overview

This document outlines the complete lead categorization system implemented in the Beacon House admissions form. The system automatically categorizes leads based on form responses to determine the appropriate follow-up process.

## Lead Categories

The system categorizes leads into 7 distinct categories:

1. **`bch`** - Premium category (High priority)
2. **`lum-l1`** - Luminaire Level 1 (Medium-high priority)
3. **`lum-l2`** - Luminaire Level 2 (Medium priority)
4. **`masters-l1`** - Masters Level 1 (High priority)
5. **`masters-l2`** - Masters Level 2 (Medium priority)
6. **`nurture`** - Development category (Requires nurturing)
7. **`drop`** - Grade 7 or below (Direct submission)

## Categorization Process

The lead categorization follows a hierarchical rule system with global overrides checked first, followed by specific qualification criteria.

### Global Override Rules (Applied First)

These rules take precedence over all other categorization logic:

1. **Student Form Filler**: `formFillerType = student` → `nurture`
2. **Spam Detection**: `GPA = 10` OR `percentage = 100` → `nurture`
3. **Full Scholarship**: `scholarshipRequirement = full_scholarship` → `nurture`
4. **Grade 7 or Below**: `grade = 7_below` → `drop`
5. **Masters Grade**: `grade = masters` → `masters`

### Qualified Lead Categories (Parent-Filled Forms Only)

After global overrides, parent-filled forms are evaluated for qualification:

#### BCH Category (Premium)

**Rule 1: Grades 8, 9, 10**
- `grade = [8, 9, 10]`
- `formFillerType = parent`
- `scholarshipRequirement = [scholarship_optional, partial_scholarship]`

**Rule 2: Grade 11 with US Target**
- `grade = 11`
- `formFillerType = parent`
- `scholarshipRequirement = [scholarship_optional, partial_scholarship]`
- `targetGeographies` includes `US`

#### Luminaire L1 Category

**Rule 1: Grade 11 Non-US**
- `grade = 11`
- `formFillerType = parent`
- `scholarshipRequirement = scholarship_optional`
- `targetGeographies` includes `[UK, Rest of World, Need Guidance]`

**Rule 2: Grade 12 Optional Scholarship**
- `grade = 12`
- `formFillerType = parent`
- `scholarshipRequirement = scholarship_optional`

#### Luminaire L2 Category

**Rule 1: Grade 11 Partial Scholarship Non-US**
- `grade = 11`
- `formFillerType = parent`
- `scholarshipRequirement = partial_scholarship`
- `targetGeographies` includes `[UK, Rest of World, Need Guidance]`

**Rule 2: Grade 12 Partial Scholarship**
- `grade = 12`
- `formFillerType = parent`
- `scholarshipRequirement = partial_scholarship`

### Default Category

All leads that don't match the above criteria are categorized as **`nurture`**.

## Form Flow Based on Category

### Qualified Leads (bch, lum-l1, lum-l2)
- **Page 1**: Initial Lead Capture
- **Page 2A**: Counseling Booking Form
  - Parent contact details
  - Date and time selection
  - Counselor assignment (Viswanathan for BCH, Karthik for Luminaire)

### Disqualified Leads (nurture, drop, masters-l1, masters-l2)
- **Page 1**: Initial Lead Capture
- **Page 2B**: Contact Information Form
  - Parent contact details only
  - No counseling booking
  - Direct to thank you page

## Implementation Details

### Code Location
- **Main Logic**: `src/lib/leadCategorization.ts`
- **Function**: `determineLeadCategory()`
- **Validation**: `src/lib/dataValidation.ts`

### Input Parameters
```typescript
determineLeadCategory(
  currentGrade: string,
  formFillerType: string,
  scholarshipRequirement: string,
  curriculumType: string,
  targetUniversityRank?: string,
  gpaValue?: string,
  percentageValue?: string,
  intake?: string,
  applicationPreparation?: string,
  targetUniversities?: string,
  supportLevel?: string,
  extendedNurtureData?: any,
  targetGeographies?: string[]
): LeadCategory
```

### Key Parameters Used
- **`currentGrade`**: Student's grade level
- **`formFillerType`**: Whether parent or student filled the form
- **`scholarshipRequirement`**: Level of financial support needed
- **`gpaValue`** / **`percentageValue`**: Academic performance
- **`targetGeographies`**: Preferred study destinations

## Validation and Error Handling

### Data Validation
- **Category Validation**: Ensures returned category is valid
- **Input Sanitization**: Cleans and validates input data
- **Error Logging**: Logs categorization errors for debugging

### Fallback Mechanism
- If categorization fails, defaults to `nurture`
- Logs error details for investigation
- Ensures form continues to function

## Analytics and Tracking

### Event Tracking
- **Qualified Lead Events**: Tracks when leads qualify for counseling
- **Category-Specific Events**: Different events for each category
- **Spam Detection Events**: Tracks detected spam submissions

### Data Consistency
- **Lead Category Validation**: Ensures category consistency
- **Database Integrity**: Validates data before storage
- **Webhook Validation**: Sanitizes data before submission

## Examples

### Example 1: BCH Qualification
```
Input:
- currentGrade: "10"
- formFillerType: "parent"
- scholarshipRequirement: "scholarship_optional"
- gpaValue: "8.5"

Output: "bch"
Flow: Page 1 → Page 2A (Counseling with Viswanathan)
```

### Example 2: Student Form (Auto-Nurture)
```
Input:
- currentGrade: "11"
- formFillerType: "student"
- scholarshipRequirement: "partial_scholarship"
- gpaValue: "9.0"

Output: "nurture" (Global Override)
Flow: Page 1 → Page 2B (Contact Info Only)
```

### Example 3: Luminaire L1 Qualification
```
Input:
- currentGrade: "12"
- formFillerType: "parent"
- scholarshipRequirement: "scholarship_optional"
- targetGeographies: ["UK"]

Output: "lum-l1"
Flow: Page 1 → Page 2A (Counseling with Karthik)
```

### Example 4: Spam Detection
```
Input:
- currentGrade: "11"
- formFillerType: "parent"
- gpaValue: "10"
- scholarshipRequirement: "scholarship_optional"

Output: "nurture" (Global Override - Spam)
Flow: Page 1 → Page 2B (Contact Info Only)
```

## Testing and Quality Assurance

### Test Cases
- **Global Override Tests**: Verify all override rules work correctly
- **Qualification Tests**: Test all BCH and Luminaire qualification paths
- **Edge Case Tests**: Handle invalid inputs and boundary conditions
- **Integration Tests**: End-to-end form flow testing

### Monitoring
- **Category Distribution**: Track distribution of lead categories
- **Conversion Rates**: Monitor qualified vs. disqualified lead ratios
- **Error Rates**: Track categorization failures and errors

## Maintenance and Updates

### Version Control
- **Current Version**: v8.0
- **Change Log**: All modifications documented
- **Backward Compatibility**: Maintains compatibility with existing data

### Future Enhancements
- **Dynamic Rules**: Ability to update rules without code changes
- **A/B Testing**: Support for testing different categorization logic
- **Machine Learning**: Potential for ML-based categorization

This documentation reflects the current implementation as of v8.0 and serves as the authoritative reference for the lead categorization system.