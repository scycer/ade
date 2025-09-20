# Task 006: Add Graph Controls

## Outcome
Interactive controls for manipulating the graph view, filtering nodes, and adjusting visualization settings.

## Files to Create
- `app/src/components/pace/graph-controls.tsx` - Control panel component
- `app/src/components/pace/graph-filters.ts` - Filtering logic

## Files to Modify
- `app/src/components/pace/index.tsx` - Integrate control panel

## Implementation Details
1. Control panel UI:
   - Position: Fixed overlay on top-right of graph
   - Semi-transparent background with blur
   - Collapsible to minimize screen usage
   - Smooth animations for show/hide

2. View controls:
   - Zoom in/out buttons
   - Fit to screen button
   - Reset view button
   - Toggle fullscreen mode

3. Filter controls:
   - File type checkboxes (TS, TSX, JS, CSS, etc.)
   - Search box for file names
   - Dependency depth slider (show N levels from selected)
   - Hide isolated nodes toggle
   - File size threshold slider

4. Layout controls:
   - Layout algorithm selector (grid, circle, cola, breadthfirst)
   - Apply layout button with animation
   - Node spacing adjustment
   - Save/restore layout positions

5. Visual controls:
   - Node size scaling slider
   - Edge opacity slider
   - Label visibility toggle
   - Color scheme selector (light/dark/high-contrast)

## Success Criteria
- All controls function correctly
- Changes apply immediately to graph
- Filtered nodes fade out smoothly
- Layout changes animate nicely
- Controls don't obstruct graph interaction