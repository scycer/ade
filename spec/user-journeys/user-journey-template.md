# User Journey {{JOURNEY_NUMBER}}: {{JOURNEY_NAME}}

## Context
**When:** {{WHEN_CONTEXT}}
**Where:** {{WHERE_CONTEXT}}
**Mindset:** {{USER_MINDSET}}

## Problem Statement
**Current friction:** {{CURRENT_FRICTION}}
**Impact:** {{BUSINESS_IMPACT}}

## Step-by-Step Flow
1. **Trigger:** {{TRIGGER_EVENT}}
2. **Action sequence:**
   - Step A: {{STEP_A}}
   - Step B: {{STEP_B}}
   - Step C: {{STEP_C}}
   - Step D: {{STEP_D}}
   {{ADDITIONAL_STEPS}}
3. **Resolution:** {{RESOLUTION_OUTCOME}}

## Success Criteria
- **Functional:** {{FUNCTIONAL_CRITERIA}}
- **Performance:** {{PERFORMANCE_CRITERIA}}
- **Experience:** {{EXPERIENCE_CRITERIA}}

## Constraints
- **Time limit:** {{TIME_CONSTRAINTS}}
- **Device limitations:** {{DEVICE_CONSTRAINTS}}
- **Context limitations:** {{CONTEXT_CONSTRAINTS}}

## Actions Required

### {{ACTION_NAME}}
**Purpose:** {{ACTION_PURPOSE}}

**Input:**
{{INPUT_PARAMETERS}}

**Output:**
{{OUTPUT_STRUCTURE}}

**Business Logic:**
{{BUSINESS_LOGIC_STEPS}}

{{ADDITIONAL_IMPLEMENTATION_SECTIONS}}

---

## Template Usage Instructions

This template is located at: `spec/user-journeys/user-journey-template.md`

### Placeholder Descriptions:

- `{{JOURNEY_NUMBER}}` - Sequential number for the user journey
- `{{JOURNEY_NAME}}` - Descriptive name for the journey (e.g., "Event History Review")
- `{{WHEN_CONTEXT}}` - When does this journey typically occur
- `{{WHERE_CONTEXT}}` - Where/on what device does this happen
- `{{USER_MINDSET}}` - What is the user's mental state/goal
- `{{CURRENT_FRICTION}}` - What problems exist today
- `{{BUSINESS_IMPACT}}` - Why does this problem matter
- `{{TRIGGER_EVENT}}` - What initiates this journey
- `{{STEP_A}}, {{STEP_B}}, etc.` - Sequential actions in the flow
- `{{ADDITIONAL_STEPS}}` - Add more steps if needed (format: "- Step E: Description")
- `{{RESOLUTION_OUTCOME}}` - How the journey successfully concludes
- `{{FUNCTIONAL_CRITERIA}}` - What must work functionally
- `{{PERFORMANCE_CRITERIA}}` - Performance requirements
- `{{EXPERIENCE_CRITERIA}}` - User experience requirements
- `{{TIME_CONSTRAINTS}}` - Time-related limitations
- `{{DEVICE_CONSTRAINTS}}` - Device or technical limitations
- `{{CONTEXT_CONSTRAINTS}}` - Situational limitations
- `{{ACTION_NAME}}` - Name of the required system action (snake_case)
- `{{ACTION_PURPOSE}}` - What this action accomplishes
- `{{INPUT_PARAMETERS}}` - List of input parameters with types and descriptions
- `{{OUTPUT_STRUCTURE}}` - Expected output format and data structure
- `{{BUSINESS_LOGIC_STEPS}}` - Numbered list of processing steps
- `{{ADDITIONAL_IMPLEMENTATION_SECTIONS}}` - Any special implementation patterns, system-wide requirements, or code examples

### Input Parameters Format:
```
- `parameter_name`: type (description, optional/required)
- `another_param`: string (what it represents)
```

### Output Structure Format:
```
- `field_name`: type (description)
- `nested_object`: object containing:
  - `sub_field`: type
```

### Business Logic Format:
```
1. First step description
2. Second step description
3. Continue numbering...
```

### Additional Implementation Sections Examples:
- System-Wide Requirements
- Implementation Patterns with code examples
- Database schema considerations (see `app/src/db/` for LanceDB implementation)
- API specifications (see `app/src/api/` for API structure)
- Security requirements
- Tool specifications (see `spec/tools/` for tool definitions)

### Example Usage:
To use this template, replace all `{{PLACEHOLDER}}` markers with actual content. For programmatic replacement, use a simple find-and-replace operation or template engine.

### Related Project Structure:
- User journey specs: `spec/user-journeys/`
- Tool specifications: `spec/tools/`
- API implementation: `app/src/api/`
- Database layer: `app/src/db/`
- Core brain architecture: `app/src/core/`
- UI components: `app/src/ui/`
- Server configuration: `app/src/server/`