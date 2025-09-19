# /user-journey

Create a new user journey document from template with interactive prompts.

## Steps

1. Check existing journey files in `spec/user-journeys/` to determine next journey number (or use 01 if none exist)
2. Ask ALL questions at once (show numbered list of all questions)
3. User provides all answers at once
4. Process the template with all the provided information

## Template

Use the template at `spec/user-journeys/user-journey-template.md` and replace placeholders:
- {{JOURNEY_NUMBER}} with the journey number
- {{JOURNEY_NAME}} with the journey name
- {{CONTEXT_WHEN}} with when context
- {{CONTEXT_WHERE}} with where context
- {{CONTEXT_MINDSET}} with mindset context
- {{CURRENT_FRICTION}} with current friction
- {{IMPACT}} with impact
- {{TRIGGER}} with trigger
- {{STEPS}} with formatted steps (Step A, Step B, etc.)
- {{RESOLUTION}} with resolution
- {{FUNCTIONAL_CRITERIA}} with functional criteria
- {{PERFORMANCE_CRITERIA}} with performance criteria
- {{EXPERIENCE_CRITERIA}} with experience criteria
- {{TIME_CONSTRAINT}} with time constraint
- {{DEVICE_CONSTRAINT}} with device constraint
- {{CONTEXT_CONSTRAINT}} with context constraint
- {{ACTION_NAME}} with action name
- {{ACTION_PURPOSE}} with action purpose
- {{ACTION_INPUTS}} with formatted inputs
- {{ACTION_OUTPUTS}} with formatted outputs
- {{BUSINESS_LOGIC}} with formatted business logic

## Output

Save the generated file to `spec/user-journeys/XX-journey-name.md` where:
- XX is the journey number padded to 2 digits
- journey-name is the journey name in kebab-case

## Example Usage

When user types `/user-journey`, Claude Code will:
1. Ask all the questions above interactively
2. Load the template from `spec/user-journeys/user-journey-template.md`
3. Replace all placeholders with user's answers
4. Format the steps properly (Step A, Step B, etc.)
5. Save to `spec/user-journeys/` with proper filename
6. Confirm creation with the file path