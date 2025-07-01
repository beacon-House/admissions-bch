# Meta Pixel Events Implementation v8.0

## Overview

This document outlines the complete implementation of the Beacon House Meta Ads Events Framework. The system tracks 35+ events across the lead qualification and form completion process.

## Implementation Summary

### Core Event Categories Implemented

1. **Primary Lead Classification Events (8 events)**
   - Parent vs Student classification
   - Qualified vs Disqualified categorization
   - Spam detection for both parents and students
   - Student qualification simulation (if parent filled)

2. **General Funnel Events (7 events)**
   - Page views, CTA clicks, form progression
   - Universal tracking across all lead types

3. **Category-Specific Events (20 events)**
   - BCH Lead Specific (4 events)
   - Luminaire L1 Lead Specific (4 events)
   - Luminaire L2 Lead Specific (4 events)
   - Qualified Parent Specific (4 events)
   - Qualified Student Specific (4 events)

## Event Firing Logic

### Critical Rule Compliance
- ✅ **No events fire until Page 1 "Next" button is clicked**
- ✅ **All lead classification happens after Page 1 completion**
- ✅ **Page 2 routing based on qualification status**

### Event Firing Sequence

#### Page 1 Completion
```typescript
firePageOneCompleteEvents(formData) {
  // PRIMARY CLASSIFICATION
  if (isParent && !isSpam) {
    trackPixelEvent({ name: PIXEL_EVENTS.PARENT_EVENT });
    if (isQualified) {
      trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT });
    } else {
      trackPixelEvent({ name: PIXEL_EVENTS.DISQUALIFIED_PARENT });
    }
  }
  
  // STUDENT CLASSIFICATION
  if (isStudent) {
    trackPixelEvent({ name: PIXEL_EVENTS.STUDENT_EVENT });
    if (wouldQualifyAsParent(formData)) {
      trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_STUDENT });
    } else {
      trackPixelEvent({ name: PIXEL_EVENTS.DISQUALIFIED_STUDENT });
    }
  }
  
  // CATEGORY-SPECIFIC EVENTS
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_PAGE_1_CONTINUE });
  }
  // ... similar for lum-l1, lum-l2
}
```

#### Page 2 View
```typescript
firePageTwoViewEvents(formData) {
  trackPixelEvent({ name: PIXEL_EVENTS.PAGE_2_VIEW });
  
  // Category-specific view events
  if (leadCategory === 'bch') {
    trackPixelEvent({ name: PIXEL_EVENTS.BCH_PAGE_2_VIEW });
  }
  
  // Qualified parent/student events
  if (isParent && isQualified) {
    trackPixelEvent({ name: PIXEL_EVENTS.QUALIFIED_PARENT_PAGE_2_VIEW });
  }
}
```

#### Page 2 Submit & Form Complete
```typescript
firePageTwoSubmitEvents(formData);
fireFormCompleteEvents(formData);
```

## Qualification Detection Logic

### Parent Qualification
```typescript
// BCH Criteria
if (['8', '9', '10'].includes(grade) && 
    ['scholarship_optional', 'partial_scholarship'].includes(scholarship)) {
  return 'bch';
}

// Grade 11 + US target
if (grade === '11' && targetGeographies.includes('US')) {
  return 'bch';
}

// Luminaire L1/L2 criteria...
```

### Student Qualification Simulation
```typescript
wouldStudentQualifyAsParent(formData) {
  // Simulates the same qualification logic as if parent filled form
  // Used to determine if student would be "qualified" or "disqualified"
  return checkBCHCriteria(formData) || checkLuminaireCriteria(formData);
}
```

### Spam Detection
```typescript
isSpamLead(formData) {
  return formData.gpaValue === "10" || formData.percentageValue === "100";
}
```

## Event Names with Environment Suffix

All events automatically include environment suffix:
- Development: `adm_event_name_dev`
- Staging: `adm_event_name_staging`
- Production: `adm_event_name_production`

### Complete Event List

#### Primary Lead Classification
1. `adm_prnt_event_[environment]`
2. `adm_qualfd_prnt_[environment]`
3. `adm_disqualfd_prnt_[environment]`
4. `adm_spam_prnt_[environment]`
5. `adm_spam_stdnt_[environment]`
6. `adm_stdnt_[environment]`
7. `adm_qualfd_stdnt_[environment]`
8. `adm_disqualfd_stdnt_[environment]`

#### General Funnel
9. `adm_page_view_[environment]`
10. `adm_cta_hero_[environment]`
11. `adm_cta_header_[environment]`
12. `adm_page_1_continue_[environment]`
13. `adm_page_2_view_[environment]`
14. `adm_page_2_submit_[environment]`
15. `adm_form_complete_[environment]`

#### BCH Lead Specific
16. `adm_bch_page_1_continue_[environment]`
17. `adm_bch_page_2_view_[environment]`
18. `adm_bch_page_2_submit_[environment]`
19. `adm_bch_form_complete_[environment]`

#### Luminaire L1 Lead Specific
20. `adm_lum_l1_page_1_continue_[environment]`
21. `adm_lum_l1_page_2_view_[environment]`
22. `adm_lum_l1_page_2_submit_[environment]`
23. `adm_lum_l1_form_complete_[environment]`

#### Luminaire L2 Lead Specific
24. `adm_lum_l2_page_1_continue_[environment]`
25. `adm_lum_l2_page_2_view_[environment]`
26. `adm_lum_l2_page_2_submit_[environment]`
27. `adm_lum_l2_form_complete_[environment]`

#### Qualified Parent Specific
28. `adm_qualfd_prnt_page_1_continue_[environment]`
29. `adm_qualfd_prnt_page_2_view_[environment]`
30. `adm_qualfd_prnt_page_2_submit_[environment]`
31. `adm_qualfd_prnt_form_complete_[environment]`

#### Qualified Student Specific
32. `adm_qualfd_stdnt_page_1_continue_[environment]`
33. `adm_qualfd_stdnt_page_2_view_[environment]`
34. `adm_qualfd_stdnt_page_2_submit_[environment]`
35. `adm_qualfd_stdnt_form_complete_[environment]`

## Form Flow Integration

### Page 1 → Page 2 Routing
```typescript
if (isQualified && isParent) {
  // Show evaluation animation → Page 2A (Counseling)
  firePageTwoViewEvents(formData);
} else {
  // Direct to Page 2B (Contact Info)
  firePageTwoViewEvents(formData);
}
```

### Student Direct Submission
```typescript
if (formFillerType === 'student') {
  // Fire all completion events immediately
  fireFormCompleteEvents(formData);
  submitForm();
}
```

## Testing and Validation

### Event Verification
- All events include environment-specific suffixes
- Events fire in correct sequence based on user journey
- Spam detection works for both parents and students
- Student qualification simulation matches parent logic
- Category-specific events fire only for relevant leads

### Lead Category Coverage
- ✅ BCH leads get full event sequence
- ✅ Luminaire L1/L2 leads get appropriate events
- ✅ Nurture/Drop/Masters leads get general events only
- ✅ Student leads get student-specific events
- ✅ Spam leads get spam-specific events

### Integration Points
- ✅ Form Container orchestrates all event firing
- ✅ Header/Landing Page fire CTA events
- ✅ Lead categorization drives event selection
- ✅ All events stored in form state for webhook submission

## Monitoring and Analytics

The complete event framework provides comprehensive tracking for:
- Lead qualification rates by source
- Form completion funnels by lead type
- Student vs parent conversion patterns
- Spam detection effectiveness
- Category-specific performance metrics
- CTA effectiveness across different locations

This implementation ensures precise, comprehensive tracking aligned with the Beacon House Meta Ads Events Framework requirements.