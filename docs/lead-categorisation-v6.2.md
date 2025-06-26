# Lead Categorization Logic v6.2

## Overview

This version introduces two major updates to the lead categorization system:

1. **All student-filled leads**, regardless of grade or academic level, are now **directly categorized as 'nurture'** and the form is submitted immediately after Step 2 (or Step 2B for Masters).  
2. **Extended Nurture Form (Step 2.5)** is now **only shown to parent-filled forms** in Grades 11 and 12 that were initially categorized as 'nurture'.

The system continues to segment incoming student applications into seven distinct categories: bch (premium), Luminaire Level 1 (lum-l1), Luminaire Level 2 (lum-l2), Masters Level 1 (masters-l1), Masters Level 2 (masters-l2), nurture (development), and drop (direct submission).

## Categorization Process (Updated)

### Step 1: Student-Filled Form Detection (NEW GLOBAL RULE)

* If `formFillerType = student` → categorize as `nurture` → **submit immediately**  
* This check applies **before any other categorization logic**, including spam detection and Masters-specific logic

### Step 2: Spam Detection

* If GPA \= 10 or Percentage \= 100 → categorize as `nurture` → **submit immediately**

### Step 3: Grade 7 or Below Detection

* If grade is '7\_below' → categorize as `drop` → **submit immediately after Step 1**

### Step 4: Initial Categorization (Parent-Filled Only)

Categorization logic is evaluated only if form was filled by a parent:

**`bch`**:

* Grade 8/9/10 parent-filled form with scholarship not required or partial  
* Grade 11 parent-filled form targeting top-20 universities with scholarship not required or partial

**`lum-l1`**:

* Grade 11 (not targeting top-20) or Grade 12 parent-filled form  
* Scholarship requirement: optional

**`lum-l2`**:

* Grade 11 or 12 parent-filled form  
* Scholarship requirement: partial

**`masters-l1`**:

* Grade \= Masters  
* Application status: researching or taken exams  
* Target University Rank \= top\_20\_50

**`masters-l2`**:

* Grade \= Masters  
* Application status: researching or taken exams  
* Target University Rank \= top\_50\_100 or partner\_university

**`nurture`** (default for all others):

* Full scholarship required (non-Masters)  
* Masters with undecided application status or unsure about target universities  
* Any leads not qualifying for categories above

### Step 5: Extended Nurture Form (Step 2.5)

* Shown **only to parent-filled forms** where:  
  * Grade \= 11 or 12  
  * Initially categorized as `nurture`

### Step 6: Re-Categorization from Extended Nurture (Parent-Filled Only)

**Based on partial funding approach:**

* `accept_loans` → `lum-l2`  
* `affordable_alternatives` → `lum-l2`  
* Others → stay as `nurture`

## Form Flow by Category

### Flow 1: Grade 7 or Below

* Step 1 → submit immediately  
* Category: `drop`

### Flow 2: Student-Filled Leads (NEW)

* Step 1 → Step 2 → submit immediately  
* Category: `nurture`  
* No Extended Nurture Form or Counseling Form is shown

### Flow 3: Spam Leads

* Step 1 → Step 2 → submit immediately  
* Identified by GPA \= 10 or Percentage \= 100  
* Category: `nurture`

### Flow 4: Parent-Filled (bch, lum-l1/l2, masters-l1/l2)

* Step 1 → Step 2 → Step 3 (Counseling) → Submit  
* Category determined after Step 2

### Flow 5: Parent-Filled Nurture (Grades 11/12)

* Step 1 → Step 2 → Step 2.5 (Extended Nurture) →  
  * If re-categorized → Step 3 → Submit  
  * If still nurture → Submit

### Flow 6: Parent-Filled Nurture (Grades 8/9/10 or Masters)

* Step 1 → Step 2 → Submit

## Implementation Notes

1. **Form Flow Optimization**:  
     
   - Student-filled leads bypass both the Extended Nurture Form and Counseling Form  
   - Extended Nurture Form is shown only to parent-filled forms for Grades 11 and 12  
   - All relevant analytics and event tracking is preserved

   

2. **Global Rule Order**:  
     
   - Student form filler check occurs first  
   - Spam detection occurs second  
   - Grade 7 or below check occurs third  
   - All other categorization logic applies only to parent-filled forms

   

3. **Technical Implementation**:  
     
   - The lead categorization logic is implemented in `src/lib/leadCategorization.ts`  
   - Form flow control is managed in `src/components/forms/FormContainer.tsx`  
   - All Meta Pixel events defined in `src/lib/pixel.ts` are preserved unchanged
