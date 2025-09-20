# Task 007: Implement File Preview on Node Click

## Outcome
Clicking on a node in the graph opens a preview panel showing the file's content with syntax highlighting and file information.

## Files to Create
- `app/src/components/pace/file-preview.tsx` - File preview panel component
- `app/src/components/pace/code-highlighter.tsx` - Syntax highlighting component

## Files to Modify
- `app/src/components/pace/index.tsx` - Add click handlers and preview state

## Implementation Details
1. Click interaction:
   - Single click: Select node and highlight dependencies
   - Double click: Open file preview
   - Click outside: Deselect and close preview
   - Escape key: Close preview panel

2. File preview panel:
   - Position: Slide in from right side (drawer style)
   - Width: 40-50% of screen width
   - Resizable panel border
   - Close button in header

3. Panel header:
   - File path (with copy button)
   - File type badge
   - File size
   - Last modified date
   - Open in editor button (if applicable)

4. Content display:
   - Syntax highlighted code
   - Line numbers
   - Scrollable container
   - Support for large files (virtualization)
   - Loading state for file reading

5. Additional features:
   - Minimap for long files
   - Search within file (Ctrl+F)
   - Dependency list at bottom
   - Quick navigation to dependencies

6. Graph highlighting:
   - Selected node: Bright highlight
   - Direct dependencies: Medium highlight
   - Other nodes: Dimmed
   - Dependency edges: Emphasized

## Success Criteria
- Preview opens smoothly on node click
- File content displays with proper syntax highlighting
- Panel is responsive and doesn't break layout
- Large files load without freezing UI
- Dependencies are clearly highlighted in graph