# Form Component Flow Documentation

## 1. Form Overview

The application form is a multi-step lead generation system that collects information from prospective students and parents. Based on their inputs, the system categorizes leads into different segments for appropriate follow-up.

The form has these main components:
- **Step 1**: Personal Details Form
- **Step 2A**: Academic Details Form (for grades 8-12)
- **Step 2B**: Masters Academic Details Form (for Masters applicants)
- **Step 2.5**: Extended Nurture Form (for nurture category leads in grades 11-12, parent-filled only)
- **Step 3**: Counselling Form (schedules a session with appropriate counselor)

## 2. Form Questions by Component

### Step 1: Personal Details Form

| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Are you the parent or the student? | Select | Required | Parent, Student | `formFillerType` |
| Grade in Academic Year 25-26 | Select | Required | Grade 12, Grade 11, Grade 10, Grade 9, Grade 8, Grade 7 or below, Apply for Masters | `currentGrade` |
| Student's First Name | Text | Min 2 chars | | `studentFirstName` |
| Student's Last Name | Text | Min 1 char | | `studentLastName` |
| Parent's Name | Text | Min 2 chars | | `parentName` |
| School Location (City/Locality) | Text | Required | | `areaOfResidence` |
| Parent's Email | Email | Valid email | | `email` |
| Phone Number | Text | 10 digits | | `phoneNumber` |
| WhatsApp Consent | Checkbox | | True/False (default: True) | `whatsappConsent` |

### Step 2A: Academic Details Form (Non-Masters)

| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Curriculum Type | Select | Required | IB, IGCSE, CBSE, ICSE, State Boards, Others | `curriculumType` |
| School Name | Text | Min 2 chars | | `schoolName` |
| Grade Format | Button Group | Required | GPA Format, Percentage Format | `gradeFormat` |
| GPA Value (if GPA selected) | Numeric Input | Required, 1-10 range | Float with up to 1 decimal point | `gpaValue` |
| Percentage Value (if Percentage selected) | Numeric Input | Required, 1-100 range | Float with up to 1 decimal point | `percentageValue` |
| Target University Rank | Select | Required | Top 20 Universities, Top 50 Universities, Top 100 Universities, Any Good University | `targetUniversityRank` |
| Target Geographies | Checkbox Group | Min 1 selection | USA, UK, Canada, Australia, Europe, Asia, Middle East, Others, Need Guidance | `preferredCountries` |
| Level of scholarship needed | Radio | Required | Full scholarship needed, Partial scholarship needed, Scholarship optional | `scholarshipRequirement` |
| Contact Methods | Checkbox Group | Min 1 selection | Phone Call, WhatsApp, Email | `preferredContactMethods` |
| Contact Details | Text fields | Based on selection | Phone number, WhatsApp number, Email address | `callNumber`, `whatsappNumber`, `emailAddress` |

### Step 2B: Masters Academic Details Form

#### University & Program Information
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Current/Previous University | Text | Min 2 chars | | `schoolName` |
| When do you expect to graduate? | Select | Required | 2025, 2026, 2027, Others, Graduated Already | `graduationStatus` |
| Which intake are you applying for? | Select | Required | Aug/Sept 2025, Jan or Aug 2026, Jan or Aug 2027, Others | `intake` |
| Other intake (when "Others" selected) | Text | | | `intakeOther` |
| How many years of work experience do you have? | Select | Required | 0 years, 1-2 years, 3-5 years, 6+ years | `workExperience` |
| What is your intended field of study? | Text | Required | | `fieldOfStudy` |

#### Academic Information
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Grade Format | Button Group | Required | GPA Format, Percentage Format | `gradeFormat` |
| GPA Value (if GPA selected) | Numeric Input | Required, 1-10 range | Float with up to 1 decimal point | `gpaValue` |
| Percentage Value (if Percentage selected) | Numeric Input | Required, 1-100 range | Float with up to 1 decimal point | `percentageValue` |
| GRE/GMAT Status | Select | Required | Yes - GRE, Yes - GMAT, No - planning to take it, Not required for my programs | `entranceExam` |
| Exam Score (if GRE/GMAT selected) | Text | | | `examScore` |

#### Application Preparation
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Have you started preparing for your Master's application? | Radio | Required | Yes I'm researching right now, Have taken GRE/GMAT & identified universities, Yet to decide if I want to apply | `applicationPreparation` |
| Target Universities | Radio | Required | Top 20-50 ranked global university, Open to 50-100 ranked universities, Partner University without GRE/GMAT, Unsure about preferences | `targetUniversities` |
| Support Level Needed | Radio | Required | Personalized guidance, Exploring options, Self-guided, Partner Universities | `supportLevel` |
| Scholarship Requirement | Radio | Required | Full scholarship needed, Partial scholarship needed, Scholarship optional | `scholarshipRequirement` |
| Contact Methods | Same as Step 2A | | | Same as Step 2A |

### Step 2.5: Extended Nurture Form (Parent-Filled Only)

#### Student Form Filler Questions (Not Used - Students bypass this step)
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| N/A - Student forms are submitted directly | | | | |

#### Parent Form Filler Questions
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| If your preferred university offers admission with partial funding, what would be your approach? | Radio | Required | Accept and find ways to cover remaining costs using loans; Defer to following year and apply for additional external scholarships; Consider more affordable university alternatives; Would only proceed with full funding | `partialFundingApproach` |
| Would you like help in building your child's profile? | Radio | Required | Interested in doing relevant work to build strong profile; Focus is on Academics, will only do the minimum needed to get an admit | `strongProfileIntent` |

### Step 3: Counselling Form
| Field | Type | Validation | Options | Webhook Variable |
|-------|------|------------|---------|-----------------|
| Selected date | Calendar | Optional | Next 7 days available | `counsellingDate` |
| Selected time slot | Button Group | Optional | Available slots between 10 AM and 8 PM | `counsellingTime` |

## 3. Form Flow and Navigation

### Normal Flow
1. User starts at Personal Details Form (Step 1)
2. After completing Step 1, system checks:
   - If grade is "7_below": Form is submitted directly with category "drop"
   - If grade is "masters": User proceeds to Masters Academic Details Form (Step 2B)
   - Otherwise: User proceeds to Academic Details Form (Step 2A)
3. After completing Step 2:
   - **NEW RULE**: If form filler is "student": Form is submitted directly with category "nurture" (bypasses all subsequent steps)
   - System determines lead category for parent-filled forms
   - If lead category is "nurture" and grade is 11 or 12 AND form filler is "parent": User proceeds to Extended Nurture Form (Step 2.5)
   - If lead category is "nurture" and grade is not 11 or 12 (including masters): Form is submitted directly
   - Otherwise: User sees evaluation animation and proceeds to Counselling Form (Step 3)
4. After completing Step 2.5:
   - System re-categorizes lead based on Extended Nurture form answers
   - If re-categorized as "nurture": Form is submitted directly
   - Otherwise: User proceeds to Counselling Form (Step 3)
5. After completing Step 3, form is submitted with all data

### Progress Indicators
- Progress bar at the top shows 25% for Step 1, 50% for Step 2, 75% for Step 2.5, 100% for Step 3
- Current step is highlighted
- Mobile navigation adapts to smaller screens

## 4. Button Actions and Triggers

### Step 1: Personal Details Form
- **Continue Button**: 
  - Validates all fields including new `areaOfResidence` field
  - If valid: Updates form store with data
  - For grade "7_below": Submits form with drop category
  - Otherwise: Advances to Step 2
  - Tracks `admissions_page1_continue_[environment]` pixel event
  - Tracks `parent_admissions_page1_continue_[environment]` if form filler is parent
  - Tracks `admissions_student_lead_[environment]` if form filler is student
  - Tracks `admissions_masters_lead_[environment]` if grade is masters

### Step 2A/2B: Academic Details Form
- **Previous Button**:
  - Saves current form data
  - Returns to Step 1
- **Next Button**:
  - Validates all fields
  - If valid: Updates form store with data
  - Determines lead category
  - **NEW**: If form filler is "student": Submits form directly with "nurture" category
  - For parent-filled forms with "nurture" category in grades 11-12: Shows evaluation animation and advances to Step 2.5
  - For "nurture" category in other grades: Submits form directly
  - Otherwise: Shows evaluation animation and advances to Step 3
  - Tracks appropriate event: `admissions_page2_next_regular_[environment]` or `admissions_page2_next_masters_[environment]`
  - Tracks `admissions_qualified_lead_received_[environment]` for bch, lum-l1, or lum-l2 categories
  - Tracks `admissions_spammy_parent_[environment]` if parent with GPA=10 or Percentage=100
  - Tracks `admissions_stateboard_parent_[environment]` if parent with State Boards curriculum

### Step 2.5: Extended Nurture Form (Parent-Filled Only)
- **Previous Button**:
  - Saves current form data
  - Returns to Step 2
- **Proceed Button**:
  - Validates all fields
  - If valid: Updates form store with data
  - Re-categorizes lead based on form responses
  - If re-categorized as "nurture": Submits form directly
  - Otherwise: Advances to Step 3
  - Tracks `admissions_qualified_lead_received_[environment]` for re-qualified leads

### Step 3: Counselling Form
- **Submit Application Button**:
  - Enabled only if date and time slot selected
  - Submits complete form data via webhook
  - Shows success message
  - Tracks multiple events:
    - `admissions_page3_submit_[lead_category]_[environment]`
    - `admissions_form_complete_[environment]`
    - `admissions_flow_complete_bch_[environment]` (for BCH leads)
    - `admissions_flow_complete_luminaire_[environment]` (for Luminaire leads)
    - `admissions_flow_complete_masters_[environment]` (for Masters leads)

### Evaluation Animation
- Triggered after Step 2 for all non-nurture parent-filled leads
- Triggered for nurture parent-filled leads in grades 11-12 before Step 2.5
- Shows analysis animation for 10 seconds
- Automatically advances to next step after completion

## 5. Special Cases and Conditional Logic

### Grade 7 or Below
- Form submits directly after Step 1
- Category set to "drop"
- No Step 2 or 3 presented

### Student-Filled Forms (NEW GLOBAL RULE)
- **ALL student-filled forms are categorized as "nurture"**
- Form is submitted immediately after Step 2 (or Step 2B for Masters)
- No Extended Nurture Form or Counselling Form is shown
- This applies regardless of grade, curriculum, or other factors

### Masters Applications
- Different form questions in Step 2
- Application preparation status determines initial filtering:
  - "undecided_need_help" → nurture 
  - Otherwise → proceed based on target university evaluation
- Target universities determine category:
  - "top_20_50" → masters-l1
  - "top_50_100" or "partner_university" → masters-l2
  - "unsure" → nurture

### Extended Nurture Form Conditions (Parent-Filled Only)
- Only shown to grade 11 and 12 parent-filled leads categorized as "nurture"
- **IMPORTANT**: Student-filled forms never reach this step as they are submitted directly
- For parent form filler:
  - `partialFundingApproach` = "accept_loans" → lum-l2
  - `partialFundingApproach` = "affordable_alternatives" → lum-l2
  - Otherwise → nurture

### Full Scholarship Requirement
- Any non-Masters application with "full_scholarship" selected goes to nurture category by default

### Spam Detection
- Forms with GPA = 10 or Percentage = 100 are categorized as "nurture"
- Tracks `admissions_spammy_parent_[environment]` event for parent-filled spam forms

### Counselor Assignment in Step 3
- Based on lead category:
  - bch category: Shows Viswanathan as counselor
  - Other categories: Shows Karthik Lakshman as counselor

### Time Slots in Counselling Form
- For today's date: Only shows slots at least 2 hours from current time
- All other dates: Shows full range of available slots (10 AM to 8 PM, except 2 PM)
- Users can only select dates within the next 7 days

## 6. Form Data Handling

### Data Storage
- Form data is stored in Zustand store (`formStore.ts`)
- Each step updates the store with new form fields
- Final submission combines all stored data
- New `areaOfResidence` field is captured and stored from Step 1

### Lead Categorization (Updated v6.1)
- **Global Rule**: All student-filled forms → "nurture" (submitted immediately after Step 2)
- Initial categorization performed in `leadCategorization.ts` after Step 2 for parent-filled forms
- Re-categorization performed after Extended Nurture Form (Step 2.5) for parent-filled forms only
- Categories: bch, lum-l1, lum-l2, masters-l1, masters-l2, nurture, drop
- Based on complex criteria including grade, form filler type, curriculum, and scholarship requirements

### Form Submission
- Webhook-based submission to Make.com integration
- Environment variables determine API endpoints
- Tracks total time spent and step completion
- Sends analytics events to Google Analytics and Meta Pixel
- Includes new `areaOfResidence` field in webhook payload

## 7. Meta Pixel Event Architecture (18 Total Events)

The following events are implemented in the application:

### CTA Buttons (2 Events):
- `admissions_cta_header_[environment]`: Triggered on header CTA click
- `admissions_cta_hero_[environment]`: Triggered on hero section CTA click

### Form Navigation (7 Events):
- `admissions_page_view_[environment]`: Triggered on form page views
- `admissions_page1_continue_[environment]`: Triggered on Step 1 completion
- `parent_admissions_page1_continue_[environment]`: Triggered on Step 1 completion (parent-specific)
- `admissions_page2_next_regular_[environment]`: Triggered on Step 2 completion (non-masters)
- `admissions_page2_next_masters_[environment]`: Triggered on Step 2 completion (masters)
- `admissions_qualified_lead_received_[environment]`: Triggered when lead qualifies as bch, lum-l1, or lum-l2
- `admissions_form_complete_[environment]`: Triggered on form completion

### Counselling Form Events (2 Events):
- `admissions_page3_view_[lead_category]_[environment]`: Triggered when counselling form is viewed
- `admissions_page3_submit_[lead_category]_[environment]`: Triggered when lead submits counselling form

### Complete Flow Events (3 Events):
- `admissions_flow_complete_bch_[environment]`: Triggered when a BCH lead completes entire form flow
- `admissions_flow_complete_luminaire_[environment]`: Triggered when a Luminaire lead (l1 or l2) completes flow
- `admissions_flow_complete_masters_[environment]`: Triggered when a Masters lead completes flow

### New Specific Lead Events (4 Events):
- `admissions_student_lead_[environment]`: Triggered when form filler selects "Student"
- `admissions_masters_lead_[environment]`: Triggered when grade "Apply for Masters" is selected
- `admissions_spammy_parent_[environment]`: Triggered for parent with GPA=10 or Percentage=100
- `admissions_stateboard_parent_[environment]`: Triggered for parent with State Boards curriculum

## 8. Lead Categorization Logic (Updated v6.1)

### Global Rules (Applied First)
1. **Student Form Filler**: ALL student-filled forms → "nurture" (submitted immediately)
2. **Spam Detection**: GPA=10 or Percentage=100 → "nurture"
3. **Grade 7 or Below**: → "drop" (submitted after Step 1)

### Parent-Filled Form Categorization

#### Initial Categorization (After Step 2)

1. **bch** (premium category):
   - Grade 8/9/10 + parent + scholarship not required or partial
   - Grade 11 + parent + targeting top 20 universities + scholarship not required or partial

2. **lum-l1** (Luminaire Level 1):
   - Grade 11 or 12 + parent + scholarship optional + not targeting top 20 universities (for Grade 11)

3. **lum-l2** (Luminaire Level 2):
   - Grade 11 or 12 + parent + partial scholarship required

4. **masters-l1** (Masters Level 1):
   - Masters grade + not "undecided" about applying + targeting top 20-50 universities

5. **masters-l2** (Masters Level 2):
   - Masters grade + not "undecided" about applying + targeting top 50-100 or partner universities

6. **nurture** (development category):
   - Full scholarship required (automatic override for non-Masters)
   - Masters grade + undecided about applying or unsure about university preferences
   - Any other lead not matching above categories

7. **drop** (direct submission):
   - Grade 7 or below

#### Re-categorization after Extended Nurture Form (Parent-Filled Only)

For **Parent** form fillers in grades 11-12 initially categorized as "nurture":
- `partialFundingApproach` = "accept_loans" → lum-l2
- `partialFundingApproach` = "affordable_alternatives" → lum-l2
- `partialFundingApproach` = "defer_scholarships" or "only_full_funding" → nurture

## 9. Form Field Updates

### New Fields Added
- **School Location (City/Locality)**: Required text field in Step 1 (`areaOfResidence`)
  - Validation: Minimum 1 character
  - Purpose: Captures student's school location for better lead qualification
  - Webhook variable: `areaOfResidence`

### Updated Validation
- All form validation schemas updated to include the new location field
- Error messages provide clear guidance for required fields
- Mobile-optimized input handling with proper font sizes to prevent auto-zoom

### Contact Methods Enhancement
- Pre-filling logic improved for contact methods
- WhatsApp and Email default to enabled for better user experience
- Phone number from Step 1 automatically populates contact method fields

## 10. Technical Implementation Notes

### Form Store Integration
- Zustand store manages all form state
- Events are tracked to prevent duplicate submissions
- Form data persistence across steps

### Mobile Optimization
- Responsive design with mobile-first approach
- Touch-friendly interface elements
- Optimized input handling for mobile devices
- Sticky CTA button behavior on mobile

### Performance Considerations
- Lazy loading of form components
- Efficient re-rendering with React Hook Form
- Optimized validation with Zod schemas

### Error Handling
- Comprehensive form validation
- User-friendly error messages
- Graceful handling of submission failures
- Analytics tracking for error events

This documentation reflects the current state of the form as of the latest updates, including the new location field, updated student form handling, and comprehensive event tracking system.