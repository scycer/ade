# User Journey 01: Git Diff

## Context
**When:** Anytime code has been changed and I want to see the current diff
**Where:** On my computer or phone
**Mindset:** Development

## Problem Statement
**Current friction:** New idea is all
**Impact:** Test an example feature

## Step-by-Step Flow
1. **Trigger:** Open UI, click git diff button
2. **Action sequence:**
   - Step A: Click git diff button
   - Step B: Get git diff page with all file diffs currently outstanding changes
3. **Resolution:** I just go back

## Success Criteria
- **Functional:** Get all git diffs
- **Performance:** None
- **Experience:** Minimal

## Constraints
- **Time limit:** None specified
- **Device limitations:** Desktop and mobile
- **Context limitations:** None

## Actions Required

### get_git_diffs
**Purpose:** Get git diffs

**Input:**
- No specific inputs required

**Output:**
- List of all file diffs with outstanding changes
- Diff content for each changed file

**Business Logic:**
1. Execute git diff command
2. Parse the diff output
3. Format for display
4. Return formatted diff data