# Task 005: Integrate Real Codebase Data

## Outcome
The Cytoscape graph displays actual files and dependencies from the ADE codebase instead of mock data.

## Files to Modify
- `app/src/components/pace/index.tsx` - Replace mock data with real scan results

## Files to Create
- `app/src/components/pace/graph-config.ts` - Graph styling and layout configuration

## Implementation Details
1. Connect file scanner to PACE component:
   - Call scanner on component mount
   - Show loading state while scanning
   - Display progress (files scanned, dependencies found)
   - Handle scan errors with user-friendly messages

2. Transform scan data for Cytoscape:
   - Convert FileNode to Cytoscape node format
   - Convert FileDependency to Cytoscape edge format
   - Add visual properties based on file type
   - Calculate node sizes based on file sizes or complexity

3. Enhanced graph configuration:
   - Color coding by file type:
     - TypeScript: Blue shades
     - React components: Green shades
     - Styles: Purple shades
     - Config files: Orange shades
   - Node sizing based on file importance/size
   - Edge styling for different dependency types
   - Labels showing file names (abbreviated paths)

4. Layout optimization:
   - Use force-directed layout (cola) for better organization
   - Group related files closer together
   - Minimize edge crossings
   - Provide layout animation

## Success Criteria
- Real codebase structure is visualized
- All project files appear as nodes
- Dependencies shown as edges
- Graph is readable and organized
- Performance remains smooth with 100+ nodes