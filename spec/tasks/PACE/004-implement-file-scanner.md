# Task 004: Implement File Scanner

## Outcome
A backend service that scans the ADE codebase and extracts file information, dependencies, and relationships for visualization.

## Files to Create
- `app/src/lib/pace/file-scanner.ts` - Core scanning logic
- `app/src/lib/pace/dependency-parser.ts` - Parse imports and dependencies
- `app/src/lib/pace/types.ts` - TypeScript interfaces for graph data

## Implementation Details
1. Define data structures in types.ts:
   - FileNode: id, path, name, type (ts/tsx/js/jsx/css/json), size, lastModified
   - FileDependency: source, target, type (import/export/require)
   - GraphData: nodes array, edges array

2. File scanner functionality:
   - Recursively scan `/home/scycer/dev/ade` directory
   - Filter for relevant file types (.ts, .tsx, .js, .jsx, .css)
   - Exclude node_modules, dist, build directories
   - Extract file metadata (size, modification date)
   - Store relative paths for cleaner display

3. Dependency parser:
   - Parse TypeScript/JavaScript files for imports
   - Handle different import styles (ES6, CommonJS)
   - Resolve relative import paths
   - Track import types (default, named, namespace)
   - Create edges between file nodes

4. Data optimization:
   - Limit initial scan to app/src directory
   - Cache scan results to avoid repeated parsing
   - Provide progress updates during scanning

## Success Criteria
- Scans codebase without blocking UI
- Correctly identifies all project files
- Accurately parses import relationships
- Returns data structure compatible with Cytoscape.js
- Handles errors gracefully (missing files, circular deps)