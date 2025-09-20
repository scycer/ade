# Task 008: Add Graph Statistics Dashboard

## Outcome
A statistics panel showing metrics about the codebase structure, complexity, and dependencies to provide insights about the project.

## Files to Create
- `app/src/components/pace/stats-panel.tsx` - Statistics display component
- `app/src/lib/pace/graph-analytics.ts` - Graph analysis algorithms

## Files to Modify
- `app/src/components/pace/index.tsx` - Integrate statistics panel

## Implementation Details
1. Statistics panel UI:
   - Position: Bottom-left corner, expandable
   - Compact view: Key metrics only
   - Expanded view: Detailed breakdown
   - Smooth expand/collapse animation

2. Basic metrics:
   - Total files count
   - Total dependencies count
   - Average dependencies per file
   - Most connected files (top 5)
   - Isolated files count
   - File type distribution (pie chart)

3. Complexity metrics:
   - Cyclic dependencies detected
   - Maximum dependency depth
   - Average path length
   - Clustering coefficient
   - Module boundaries identification

4. File-specific stats (on selection):
   - Direct dependencies count
   - Direct dependents count
   - Dependency depth from entry point
   - File complexity score
   - Lines of code

5. Visual indicators:
   - Color-coded complexity levels
   - Dependency hotspots highlighting
   - Circular dependency warnings
   - Unused file indicators

6. Export capabilities:
   - Export stats as JSON
   - Export graph as image (PNG/SVG)
   - Generate dependency report (Markdown)

## Success Criteria
- All metrics calculate correctly
- Statistics update when filters change
- Performance remains good with large graphs
- Visual indicators help identify issues
- Export functions work properly