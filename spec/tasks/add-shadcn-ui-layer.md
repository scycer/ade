# Task: Add shadcn/ui as UI Layer

## Objective
Replace the current basic UI implementation with shadcn/ui components to create a modern, accessible, and themeable interface for the Brain Architecture app.

## Current State
- Basic React UI with custom CSS
- Single page showing Brain connection status
- Minimal styling in `index.css`
- App component fetches from `/api/brain/hello` endpoint

## Target Implementation

### 1. Setup shadcn/ui
- Install required dependencies:
  - `tailwindcss` and its peer dependencies
  - `class-variance-authority` for component variants
  - `clsx` and `tailwind-merge` for className utilities
  - `lucide-react` for icons
- Initialize Tailwind CSS configuration
- Setup shadcn/ui with TypeScript support
- Configure path aliases if needed

### 2. Components to Add
- **Card**: For the main content container
- **Button**: For user interactions (future actions)
- **Alert**: For displaying messages and errors
- **Skeleton**: For loading states
- **Badge**: For displaying node IDs and status

### 3. UI Updates
Transform current UI to use:
- Card component for the main window
- Alert for success/error messages
- Skeleton for loading state
- Badge for node ID display
- Proper typography with Tailwind classes
- Dark mode support (system preference)

### 4. Structure
```
app/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn components
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── skeleton.tsx
│   ├── lib/
│   │   └── utils.ts      # cn() utility
│   └── ui/
│       ├── App.tsx       # Updated with shadcn
│       └── index.css     # Tailwind directives
```

### 5. Configuration Files
- `tailwind.config.js` - Tailwind configuration
- `components.json` - shadcn/ui configuration
- Update `tsconfig.json` for path aliases (if needed)

## Success Criteria
- [ ] shadcn/ui properly installed and configured
- [ ] All current UI functionality preserved
- [ ] Loading, success, and error states using shadcn components
- [ ] Clean, modern interface with consistent styling
- [ ] Dark mode support
- [ ] All tests still passing
- [ ] App builds and runs without errors

## Implementation Steps
1. Install Tailwind CSS and dependencies
2. Initialize Tailwind configuration
3. Setup shadcn/ui base configuration
4. Add required shadcn components
5. Update App.tsx to use new components
6. Test all states (loading, success, error)
7. Verify build and tests pass