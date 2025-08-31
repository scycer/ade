# Git History Feature Implementation Plan

## Overview
Create a new route in the TanStack Start application to display git commit history and code diffs with a clean, developer-friendly interface.

## Architecture

### 1. Route Structure
- **Route Path**: `/git-history`
- **File Location**: `/src/routes/git-history.tsx`
- TanStack Router's file-based routing will automatically register this route

### 2. Server Functions

#### `getCommits`
- Fetches git log with pagination support
- Returns: Array of commit objects containing:
  - Hash (short and full)
  - Author name and email
  - Date (formatted)
  - Commit message
  - Stats (files changed, insertions, deletions)
- Command: `git log --format=json --stat`
- Pagination: 20 commits per page

#### `getCommitDiff`
- Retrieves detailed diff for a specific commit
- Parameters: commit hash
- Returns: Unified diff output
- Command: `git show [hash] --format=fuller`

### 3. UI Components

#### Commit List View
```
┌─────────────────────────────────────────────────┐
│ Git History                              [Home]  │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ 6c1b78b • 2 hours ago • DanH              │   │
│ │ clean                                      │   │
│ │ 3 files changed, 42 insertions(+)         │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ 0a78733 • 5 hours ago • DanH              │   │
│ │ Was so close                               │   │
│ │ 1 file changed, 8 insertions(+), 2 del(-) │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ [Previous] Page 1 of 5 [Next]                   │
└─────────────────────────────────────────────────┘
```

#### Diff View
```
┌─────────────────────────────────────────────────┐
│ Commit: 6c1b78b                         [Back]  │
├─────────────────────────────────────────────────┤
│ Author: DanH <scycer1@hotmail.com>              │
│ Date: Sun Aug 31 22:42:35 2025 +1000            │
│ Message: clean                                  │
├─────────────────────────────────────────────────┤
│ src/routes/index.tsx                            │
│ ─────────────────────                           │
│ - const oldCode = "hello"                       │
│ + const newCode = "world"                       │
│                                                  │
│ package.json                                     │
│ ─────────────────────                           │
│ + "new-package": "^1.0.0"                       │
└─────────────────────────────────────────────────┘
```

### 4. Styling Approach

#### Color Scheme (matching existing dark theme)
- Background: `#1a1a1a`
- Card background: `#2a2a2a`
- Border: `#404040`
- Text: `#ffffff`
- Addition (diff): `#22c55e`
- Deletion (diff): `#ef4444`
- Line numbers: `#666666`

#### Typography
- Font: `'Fira Code', monospace`
- Consistent with existing application styling

### 5. Implementation Details

#### File: `/src/routes/git-history.tsx`
```typescript
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// Server functions for git operations
const getCommits = createServerFn({
  method: 'GET',
}).handler(async ({ page = 1 }) => {
  // Implementation
})

const getCommitDiff = createServerFn({
  method: 'GET',
}).handler(async ({ hash }) => {
  // Implementation
})

export const Route = createFileRoute('/git-history')({
  component: GitHistory,
  loader: async () => await getCommits({ page: 1 }),
})
```

### 6. Features

#### Phase 1 (Core)
- [x] Display commit list with pagination
- [x] Show commit details (author, date, message)
- [x] Click to view commit diff
- [x] Basic diff syntax highlighting
- [x] Navigation between views

#### Phase 2 (Enhancements)
- [ ] Search/filter commits
- [ ] File tree view for commits
- [ ] Side-by-side diff view option
- [ ] Copy commit hash button
- [ ] Export diff to file

### 7. Dependencies

#### Required
- No additional dependencies needed for basic implementation
- Uses Node.js built-in `child_process` for git commands

#### Optional Enhancements
- `diff2html`: Beautiful diff rendering (if advanced formatting needed)
- `prismjs`: Syntax highlighting for code blocks
- `date-fns`: Date formatting utilities

### 8. Security Considerations
- All git commands executed server-side via `createServerFn`
- No direct command injection possible from client
- Validate and sanitize commit hashes before passing to git commands
- Limit git operations to read-only commands

### 9. Navigation Updates
Add link to Git History from home page:
- Simple text link or button
- Maintain consistent styling with existing UI

### 10. Error Handling
- Handle case when not in a git repository
- Graceful handling of invalid commit hashes
- Loading states for async operations
- User-friendly error messages

## Implementation Steps

1. Create `/src/routes/git-history.tsx` file
2. Implement server functions for git operations
3. Build commit list component with pagination
4. Add diff viewer component
5. Style components to match existing theme
6. Add navigation link from home page
7. Test with various repository states
8. Add error handling and edge cases

## Testing Checklist
- [ ] Route loads correctly at `/git-history`
- [ ] Commits display with correct information
- [ ] Pagination works for repositories with many commits
- [ ] Clicking commit shows diff view
- [ ] Navigation between views works smoothly
- [ ] Styling matches existing application
- [ ] Works with empty repositories
- [ ] Handles large diffs gracefully
- [ ] Error messages display appropriately