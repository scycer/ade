# Task 010: Create Floating AI Chat Window

## Outcome
A floating, draggable AI chat interface that can assist users with understanding the codebase and navigating the visualization.

## Files to Create
- `app/src/components/pace/ai-chat.tsx` - Main chat window component
- `app/src/components/pace/chat-message.tsx` - Individual message component
- `app/src/components/pace/chat-input.tsx` - Input field with controls
- `app/src/lib/pace/chat-context.ts` - Context management for chat

## Files to Modify
- `app/src/components/pace/index.tsx` - Integrate chat window

## Implementation Details
1. Chat window design:
   - Initial position: Bottom-right corner
   - Size: 350px width, 500px height
   - Draggable header bar
   - Resizable edges
   - Minimize/maximize buttons
   - Close button (hide, not destroy)

2. Window behavior:
   - Snap to screen edges
   - Remember position/size in localStorage
   - Z-index management (always on top)
   - Smooth open/close animations
   - Backdrop blur effect

3. Sticky positioning:
   - Snap zones on all four edges
   - Magnetic effect near edges
   - Auto-hide when docked (show on hover)
   - Different layouts for each edge
   - Gesture to un-dock

4. Chat interface:
   - Message history with scrolling
   - User and AI message bubbles
   - Typing indicator
   - Timestamp for messages
   - Code block support with syntax highlighting

5. Context awareness:
   - Current selected file context
   - Graph statistics in prompts
   - Dependency information
   - File content snippets
   - Navigation suggestions

6. Quick actions:
   - "Show me dependencies of X"
   - "Find files related to Y"
   - "Explain this file"
   - "What imports this?"
   - "Show complexity hotspots"

## Success Criteria
- Window is fully draggable and resizable
- Sticky edges work smoothly
- Chat maintains context with graph
- Messages display correctly
- Window state persists across sessions