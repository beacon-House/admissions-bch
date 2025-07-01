# Form Structure Documentation v7.0

## Overview

This document outlines the complete structure of the Beacon House multi-step admissions form, including all form steps, validation logic, lead categorization, and user flows.

## Form Architecture

### Technology Stack
- **Frontend**: React 18.3.1 with TypeScript
- **Form Management**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Database**: Supabase PostgreSQL
- **Analytics**: Google Analytics + Meta Pixel
- **Styling**: Tailwind CSS with shadcn/ui components

### Form Flow Overview
```
Page 1: Initial Lead Capture
    ↓
Lead Categorization (automatic)
    ↓
Page 2A: Qualified Leads (bch, lum-l1, lum-l2)
    - Parent details + Counseling booking
    OR
Page 2B: Disqualified Leads (nurture, drop, masters-l1, masters-l2)
    - Parent details only
    ↓
Form Submission & Thank You
```

## Page-by-Page Breakdown

### Page 1: Initial Lead Capture

#### Required Fields:
* **Form Filler Type**: Dropdown - Whether the parent or student is filling the form (Parent, Student)
* **Student's Name**: First and last name of the student (same constraints as current form)
* **Student Grade**: Current grade level (7 or below, 8, 9, 10, 11, 12, Masters)
* **Curriculum**: Academic curriculum type (IB, IGCSE, CBSE, ICSE, State Boards, Others)
* **GPA**: Student's current academic performance (option to choose GPA or Percentage format, same constraints as current form)
* **School Name**: Name of current school
* **Scholarship Requirement**: Level of financial support needed (Full, Partial, Optional)
* **Parent Phone Number**: Contact number for follow-up
* **Target Geographies**: Preferred study destinations (US, UK, Rest of World, Need Guidance) - simplified options

After Page 1 completion, lead categorization occurs automatically using existing logic.

### Page 2A: Qualified Leads (BCH, Luminaire L1, Luminaire L2)

#### Required Fields:
* **Parent Name**: Full name of the parent/guardian
* **Parent's Email**: Email address for communication
* **Slot Date**: Preferred counseling session date (7-day calendar)
* **Slot Time**: Preferred counseling session time (dropdown with available slots)

#### Counselor Assignment:
* **BCH leads**: Assigned to Viswanathan
* **Luminaire leads**: Assigned to Karthik Lakshman

### Page 2B: Disqualified Leads (Nurture, Drop, Masters)

#### Required Fields:
* **Parent Name**: Full name of the parent/guardian
* **Parent's Email**: Email address for communication

#### No Additional Features:
* No booking calendar displayed
* Simple form submission
* Direct to thank you page

## Lead Categorization Rules

### Categories:
1. **bch** - Premium category (→ Page 2A with Viswanathan)
2. **lum-l1** - Luminaire Level 1 (→ Page 2A with Karthik)
3. **lum-l2** - Luminaire Level 2 (→ Page 2A with Karthik)
4. **masters-l1** - Masters Level 1 (→ Page 2B)
5. **masters-l2** - Masters Level 2 (→ Page 2B)
6. **nurture** - Development category (→ Page 2B)
7. **drop** - Grade 7 or below (→ Page 2B)

### Categorization Logic:
Uses existing `determineLeadCategory()` function with all current rules:
- Global overrides (student forms, spam detection, grade 7 below)
- Parent-filled form logic for BCH, Luminaire, and Masters categories
- Default to nurture for all other cases

## Technical Implementation

### Components to Update:
1. **Page 1**: Combine all initial fields into single form
2. **Page 2A**: Counseling booking for qualified leads
3. **Page 2B**: Simple contact form for disqualified leads
4. **Routing Logic**: Based on lead category after Page 1

### Data Collection:
- All essential lead qualification data captured on Page 1
- Minimal additional data collection on Page 2
- Maintains existing webhook structure and analytics tracking

### Benefits:
- **Reduced Friction**: Fewer form steps
- **Higher Completion**: Simplified user journey
- **Better Qualification**: All decision data collected upfront
- **Clearer Path**: Qualified vs. disqualified leads have distinct experiences

## Form Validation & Error Handling

### Validation Layers:
1. **Client-Side**: Zod schemas with real-time validation
2. **Form-Level**: Cross-field validation and business rules
3. **Submission**: Webhook payload validation
4. **Database**: Supabase row-level security and constraints

### Error Handling:
- **FormValidationError**: Custom error class for validation failures
- **Toast Notifications**: User-friendly error messages
- **Analytics Tracking**: Error events sent to Google Analytics
- **Graceful Degradation**: Form continues working even if tracking fails

## Data Flow & Persistence

### State Management:
- **Zustand Store**: `useFormStore` in `src/store/formStore.ts`
- **Session Tracking**: Unique session ID generated per form instance
- **Progress Tracking**: Current step, completion status, triggered events

### Database Schema:
**Table**: `form_sessions` in Supabase
- Comprehensive tracking of all form interactions
- Lead category validation and consistency checks
- Environment-specific data segregation

### Webhook Integration:
- **Endpoint**: Configured via `VITE_REGISTRATION_WEBHOOK_URL`
- **Payload**: Complete form data with lead category and metadata
- **Retry Logic**: Error handling for failed submissions
- **Data Validation**: Lead category sanitization before submission

## Analytics & Event Tracking

### Meta Pixel Events (18 Total):
1. **CTA Events** (2): Header and hero button clicks
2. **Form Navigation** (7): Page views, step completions, qualified leads
3. **Counselling Events** (2): Form view and submission
4. **Flow Completion** (3): Category-specific completion events
5. **Lead-Specific Events** (4): Student leads, masters leads, spam detection

### Google Analytics:
- Form funnel tracking
- Step completion rates
- Error tracking
- User journey analysis

## Mobile Responsiveness

### Breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations:
- Touch-friendly interface elements
- Optimized input handling (16px font size to prevent zoom)
- Sticky CTA behavior
- Responsive grid layouts
- Simplified navigation

## Security & Data Protection

### Data Validation:
- Input sanitization
- Lead category validation
- Character encoding consistency
- SQL injection prevention

### Privacy:
- GDPR-compliant data collection
- WhatsApp consent tracking
- Secure data transmission
- Environment-specific configurations

## Performance Optimizations

### Code Splitting:
- Lazy-loaded form components
- Dynamic imports for heavy dependencies
- Route-based code splitting

### Asset Optimization:
- Font loading optimization
- Image preloading for critical assets
- Minified production builds
- CDN integration for external assets

## Environment Configuration

### Required Environment Variables:
```
VITE_REGISTRATION_WEBHOOK_URL=<webhook_endpoint>
VITE_META_PIXEL_ID=<pixel_id>
VITE_ENVIRONMENT=<staging|production>
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
```

### Environment-Specific Features:
- Event naming with environment suffixes
- Analytics activation based on domain
- Database connection configuration
- Error tracking and logging levels

## Deployment & Monitoring

### Build Process:
- Vite-based build system
- TypeScript compilation
- Asset optimization
- Environment variable injection

### Monitoring:
- Real-time form analytics
- Lead category consistency monitoring
- Error tracking and alerting
- Performance metrics

This documentation reflects the current state of the form system as of v7.0, including all recent UX improvements and technical optimizations.