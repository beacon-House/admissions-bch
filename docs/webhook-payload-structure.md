# Webhook Payload Structure v8.0

## Overview

This document outlines the complete webhook payload structure for the simplified 2-page form system. The payload contains all data collected from the lead capture process and categorization results.

## Webhook Payload Structure

### Complete Payload Example

```json
{
  // Page 1: Initial Lead Capture Data
  "formFillerType": "parent",
  "studentFirstName": "John",
  "studentLastName": "Smith", 
  "currentGrade": "11",
  "curriculumType": "IB",
  "gradeFormat": "gpa",
  "gpaValue": "8.5",
  "percentageValue": null,
  "schoolName": "International School of Mumbai",
  "scholarshipRequirement": "scholarship_optional",
  "targetGeographies": ["US", "UK"],
  "phoneNumber": "9876543210",
  
  // Page 2A: Qualified Lead Data (BCH, Luminaire L1, L2)
  "parentName": "Jane Smith",
  "email": "jane.smith@email.com",
  "selectedDate": "Monday, January 15, 2025",
  "selectedSlot": "4 PM",
  
  // OR Page 2B: Disqualified Lead Data (Nurture, Drop, Masters)
  "parentName": "Jane Smith", 
  "email": "jane.smith@email.com",
  // No counseling fields for disqualified leads
  
  // System Generated Data
  "lead_category": "bch",
  "session_id": "uuid-generated-session-id",
  "environment": "staging",
  "total_time_spent": 180,
  "created_at": "2025-01-15T10:30:45.123Z",
  "step_completed": 2,
  "triggeredEvents": [
    "admissions_page1_continue_staging",
    "admissions_page2_next_regular_staging"
  ]
}
```

## Field Definitions

### Page 1 Fields (Always Present)

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `formFillerType` | string | Who filled the form | "parent", "student" |
| `studentFirstName` | string | Student's first name | "John" |
| `studentLastName` | string | Student's last name | "Smith" |
| `currentGrade` | string | Student's grade level | "7_below", "8", "9", "10", "11", "12", "masters" |
| `curriculumType` | string | Academic curriculum | "IB", "IGCSE", "CBSE", "ICSE", "State_Boards", "Others" |
| `gradeFormat` | string | Grade format selected | "gpa", "percentage" |
| `gpaValue` | string/null | GPA value if selected | "8.5", null |
| `percentageValue` | string/null | Percentage if selected | "85", null |
| `schoolName` | string | Name of school | "International School of Mumbai" |
| `scholarshipRequirement` | string | Scholarship needs | "scholarship_optional", "partial_scholarship", "full_scholarship" |
| `targetGeographies` | array | Study destinations | ["US", "UK", "Rest of World", "Need Guidance"] |
| `phoneNumber` | string | Parent phone number | "9876543210" |

### Page 2A Fields (Qualified Leads Only)

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `parentName` | string | Parent's full name | "Jane Smith" |
| `email` | string | Parent's email | "jane.smith@email.com" |
| `selectedDate` | string | Counseling date | "Monday, January 15, 2025" |
| `selectedSlot` | string | Counseling time | "4 PM" |

### Page 2B Fields (Disqualified Leads Only)

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `parentName` | string | Parent's full name | "Jane Smith" |
| `email` | string | Parent's email | "jane.smith@email.com" |

### System Fields (Always Present)

| Field | Type | Description | Example Values |
|-------|------|-------------|----------------|
| `lead_category` | string | Determined category | "bch", "lum-l1", "lum-l2", "nurture", "masters", "drop" |
| `session_id` | string | Unique session ID | "uuid-generated-session-id" |
| `environment` | string | Environment name | "staging", "production" |
| `total_time_spent` | number | Time in seconds | 180 |
| `created_at` | string | ISO timestamp | "2025-01-15T10:30:45.123Z" |
| `step_completed` | number | Last completed step | 1, 2 |
| `triggeredEvents` | array | Analytics events | ["event1", "event2"] |

## Payload Variations by Lead Category

### BCH Leads (Qualified)
```json
{
  "lead_category": "bch",
  "selectedDate": "Monday, January 15, 2025",
  "selectedSlot": "4 PM",
  "counselor_assigned": "Viswanathan"
}
```

### Luminaire Leads (Qualified)
```json
{
  "lead_category": "lum-l1", // or "lum-l2"
  "selectedDate": "Monday, January 15, 2025", 
  "selectedSlot": "4 PM",
  "counselor_assigned": "Karthik Lakshman"
}
```

### Nurture Leads (Disqualified)
```json
{
  "lead_category": "nurture",
  "selectedDate": null,
  "selectedSlot": null,
  "counselor_assigned": null
}
```

### Drop Leads (Grade 7 Below)
```json
{
  "lead_category": "drop",
  "selectedDate": null,
  "selectedSlot": null,
  "counselor_assigned": null,
  "step_completed": 1
}
```

### Masters Leads (Disqualified)
```json
{
  "lead_category": "masters",
  "selectedDate": null,
  "selectedSlot": null,
  "counselor_assigned": null
}
```

## Data Validation Rules

### Required Fields (All Leads)
- `formFillerType`
- `studentFirstName`
- `studentLastName`
- `currentGrade`
- `curriculumType`
- `gradeFormat`
- `gpaValue` OR `percentageValue` (based on gradeFormat)
- `schoolName`
- `scholarshipRequirement`
- `targetGeographies` (at least one)
- `phoneNumber`
- `lead_category`

### Conditional Fields
- **Qualified Leads**: `parentName`, `email`, `selectedDate`, `selectedSlot`
- **Disqualified Leads**: `parentName`, `email`
- **GPA Format**: `gpaValue` required, `percentageValue` null
- **Percentage Format**: `percentageValue` required, `gpaValue` null

### Data Constraints
- `phoneNumber`: 10-digit numeric string
- `email`: Valid email format
- `gpaValue`: 1.0-10.0 range
- `percentageValue`: 1-100 range
- `targetGeographies`: Non-empty array
- `lead_category`: Valid category from enum

## Error Handling

### Validation Errors
- Missing required fields
- Invalid data formats
- Out-of-range values
- Invalid enum values

### Fallback Behavior
- Invalid lead category → defaults to "nurture"
- Missing optional fields → null values
- Validation failures → error logging + form retry

## Integration Notes

### Webhook Endpoint
- **URL**: Configured via `VITE_REGISTRATION_WEBHOOK_URL`
- **Method**: POST
- **Content-Type**: application/json
- **Timeout**: 30 seconds

### Response Handling
- **Success**: 200-299 status codes
- **Retry Logic**: 3 attempts for 5xx errors
- **Error Logging**: All failures logged to console

### Security
- **Data Sanitization**: All inputs sanitized
- **Lead Category Validation**: Category verified before submission
- **Environment Isolation**: Environment-specific endpoints

This payload structure supports the simplified 2-page form while maintaining all necessary data for lead processing and follow-up.