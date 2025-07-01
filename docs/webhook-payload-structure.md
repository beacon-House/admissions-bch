# Webhook Payload Structure v8.1

## Overview

This document provides a complete mapping of all webhook payload variables used in the form submission process, including their sources and descriptions. **Updated to reflect correct field name mappings between frontend, webhook, and database.**

## Complete Variable Mapping

| Variable Name | Source | Form Field | Description | Example Values |
|---------------|--------|------------|-------------|----------------|
| **Core Session Data** |
| `sessionId` | System | UUID generation | Unique session identifier | "123e4567-e89b-12d3-a456-426614174000" |
| `environment` | System | Environment variable | Environment where form was submitted | Value from VITE_ENVIRONMENT |
| `userAgent` | System | Browser detection | User's browser information | "Mozilla/5.0..." |
| **Page 1: Student Information** |
| `formFillerType` | Page 1 | Form filler dropdown | Who filled the form | "parent", "student" |
| `studentFirstName` | Page 1 | First name input | Student's first name | "John" |
| `studentLastName` | Page 1 | Last name input | Student's last name | "Smith" |
| `currentGrade` | Page 1 | Grade level dropdown | Student's grade level | "7_below", "8", "9", "10", "11", "12", "masters" |
| `phoneNumber` | Page 1 | Phone input | Parent phone number | "9876543210" |
| **Page 1: Academic Information** |
| `curriculumType` | Page 1 | Curriculum dropdown | Academic curriculum | "IB", "IGCSE", "CBSE", "ICSE", "State_Boards", "Others" |
| `schoolName` | Page 1 | School name input | Name of student school | "Delhi Public School" |
| `gradeFormat` | Page 1 | Format button selection | Format of grade provided | "gpa", "percentage" |
| `gpaValue` | Page 1 | GPA input | GPA value (if gradeFormat is 'gpa') | "8.5" |
| `percentageValue` | Page 1 | Percentage input | Percentage value (if gradeFormat is 'percentage') | "85" |
| **Page 1: Study Preferences** |
| `scholarshipRequirement` | Page 1 | Scholarship radio | Level of scholarship needed | "scholarship_optional", "partial_scholarship", "full_scholarship" |
| `targetGeographies` | Page 1 | Geography checkboxes | Selected target study destinations | ["US", "UK", "Rest of World", "Need Guidance"] |
| **Page 2: Parent Information** |
| `parentName` | Page 2A/2B | Parent name input | Parent's full name | "Jane Smith" |
| `parentEmail` | Page 2A/2B | Email input | Parent's email address | "jane@example.com" |
| **Page 2A: Counselling Data (Qualified Leads)** |
| `counsellingDate` | Page 2A | Date selection | Selected counselling date | "Monday, January 15, 2025" |
| `counsellingTime` | Page 2A | Time selection | Selected counselling time | "4 PM" |
| `counsellingSlotPicked` | System | Based on date/time | Whether a counselling slot was selected | `true`, `false` |
| **System Generated Data** |
| `leadCategory` | System | Algorithm | Determined lead category | "bch", "lum-l1", "lum-l2", "nurture", "masters", "drop" |
| `pageCompleted` | System | Form tracking | Last completed page number | 1, 2 |
| `funnelStage` | System | Form tracking | Current stage in conversion funnel | "initial_capture", "counseling_booked", "contact_submitted" |
| `isQualifiedLead` | System | Lead categorization | Whether lead qualifies for counseling | `true`, `false` |
| `stepCompleted` | System | Form tracking | Last completed step number | 1, 2 |
| `stepNumber` | System | Form tracking | Current step number | 1, 2 |
| `stepType` | System | Form tracking | Type of current step | "initial_capture", "counseling_booking", "contact_submission" |
| `triggeredEvents` | System | Pixel tracking | List of triggered Meta Pixel events | ["adm_page_1_continue_stg", "adm_qualfd_prnt_stg"] |
| `created_at` | System | Timestamp | Submission timestamp | "2025-01-15T10:30:45.123Z" |

## Source Details

### Page 1: Initial Lead Capture Form (`InitialLeadCaptureForm.tsx`)
- Contains all essential lead qualification data
- Collects student info, academic details, and preferences
- All fields on this page are required except when conditionally hidden

### Page 2A: Qualified Lead Form (`QualifiedLeadForm.tsx`)
- For leads categorized as BCH, Luminaire L1, or Luminaire L2
- Displays counselor profile (Viswanathan for BCH, Karthik for Luminaire)
- Collects parent details and counseling slot preferences

### Page 2B: Disqualified Lead Form (`DisqualifiedLeadForm.tsx`)
- For leads categorized as nurture, drop, or masters
- Simple contact form for parent details
- No counseling booking functionality

### System Generated Fields
- `leadCategory`: Determined by `determineLeadCategory()` in `src/lib/leadCategorization.ts`
- `sessionId`: Generated in `src/store/formStore.ts` using `generateSessionId()`
- Time tracking and metadata: Managed in `src/lib/form.ts` and `src/lib/formTracking.ts`

## Database Mapping

All webhook payload variables map to corresponding columns in the `form_sessions` table:

| Webhook Variable | Database Column | Data Type | Notes |
|------------------|-----------------|-----------|-------|
| `sessionId` | `session_id` | text | |
| `environment` | `environment` | text | From VITE_ENVIRONMENT |
| `userAgent` | `user_agent` | text | |
| `formFillerType` | `form_filler_type` | text | |
| `studentFirstName` | `student_first_name` | text | |
| `studentLastName` | `student_last_name` | text | |
| `currentGrade` | `current_grade` | text | |
| `curriculumType` | `curriculum_type` | text | |
| `gradeFormat` | `grade_format` | text | |
| `gpaValue` | `gpa_value` | text | |
| `percentageValue` | `percentage_value` | text | |
| `schoolName` | `school_name` | text | |
| `scholarshipRequirement` | `scholarship_requirement` | text | |
| `targetGeographies` | `target_geographies` | jsonb | |
| `phoneNumber` | `phone_number` | text | |
| `parentName` | `parent_name` | text | |
| `parentEmail` | `parent_email` | text | **Fixed mapping** |
| `counsellingDate` | `counselling_date` | text | |
| `counsellingTime` | `counselling_time` | text | |
| `counsellingSlotPicked` | `counselling_slot_picked` | boolean | |
| `leadCategory` | `lead_category` | text | **Fixed mapping** |
| `pageCompleted` | `page_completed` | integer | **Fixed mapping** |
| `funnelStage` | `funnel_stage` | text | **Fixed mapping** |
| `isQualifiedLead` | `is_qualified_lead` | boolean | **Fixed mapping** |
| `stepCompleted` | `step_completed` | integer | **Fixed mapping** |
| `stepNumber` | `step_number` | numeric | **Fixed mapping** |
| `stepType` | `step_type` | text | **Fixed mapping** |
| `triggeredEvents` | `triggered_events` | jsonb | **Fixed mapping** |
| `created_at` | `created_at` | timestamptz | |

## Field Validation Rules

### Required Fields (All Submissions)
- `formFillerType`
- `studentFirstName`
- `studentLastName`
- `currentGrade`
- `curriculumType`
- `gradeFormat`
- One of `gpaValue` or `percentageValue` (depending on `gradeFormat`)
- `schoolName`
- `scholarshipRequirement`
- `targetGeographies`
- `phoneNumber`

### Required for Page 2 (All Leads)
- `parentName`
- `parentEmail`

### Required for Qualified Leads (Page 2A)
- `counsellingDate`
- `counsellingTime`

## Webhook Submission Process

1. **Data Collection**: Forms collect data across multiple steps
2. **Lead Categorization**: System determines lead category after Page 1
3. **Form Routing**: Qualified vs. disqualified lead form shown
4. **Data Merging**: All collected data merged into final payload with correct field names
5. **Submission**: Complete payload sent to webhook endpoint with proper mapping

The webhook implementation is in `src/lib/form.ts` in the `submitFormData()` function, which constructs the final payload and sends it to the endpoint specified in `VITE_REGISTRATION_WEBHOOK_URL`.

## Payload Variations by Lead Type

### BCH Lead Payload (Premium)
- Full payload including counseling data
- `isQualifiedLead`: true
- `funnelStage`: "counseling_booked"

### Luminaire Lead Payload (L1 or L2)
- Full payload including counseling data
- `isQualifiedLead`: true
- `funnelStage`: "counseling_booked"

### Nurture/Masters/Drop Lead Payload
- Basic payload without counseling data
- `isQualifiedLead`: false
- `funnelStage`: "contact_submitted"
- `counsellingSlotPicked`: false

## Recent Fixes (v8.1)

### Field Name Corrections
- **Fixed**: `email` → `parentEmail` mapping
- **Fixed**: System field names to match database function expectations
- **Removed**: Deprecated fields (`counselor_assigned`, `total_time_spent`, `form_version`)
- **Added**: `userAgent` field for better tracking

### Database Function Alignment
- All webhook field names now match what the database upsert function expects
- Proper camelCase to snake_case conversion handled by database function
- Environment variable properly passed without hardcoded fallbacks

## Note on Field Naming

Field names follow consistent conventions:
- **Frontend**: camelCase (e.g., `studentFirstName`)
- **Webhook**: camelCase (e.g., `studentFirstName`)
- **Database Function Parameter**: camelCase (e.g., `studentFirstName`)
- **Database Column**: snake_case (e.g., `student_first_name`)

The database function handles the conversion from camelCase parameters to snake_case column names.