# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
bun dev                    # Start development server with hot reload
bun start                  # Run production server
```

### Building
```bash
bun run build              # Build for production (outputs to dist/)
bun run build --minify     # Build with minification
bun run build --help       # See all build options
```

## Project Architecture

### Stack
- **Runtime**: Bun (all-in-one JavaScript runtime)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Server**: Bun.serve() with built-in routing and HTML imports

### Key Architectural Patterns

#### Server Architecture
The application uses Bun's native server (`Bun.serve()`) with HTML imports:
- Entry point: `src/index.tsx` - Serves the React app and defines API routes
- HTML imports automatically bundle and transpile React/TypeScript
- Built-in HMR (Hot Module Replacement) in development mode
- Routes defined directly in the server configuration

#### Frontend Architecture
- **Entry**: `src/index.html` imports `src/frontend.tsx`
- **Components**: Located in `src/components/ui/` using shadcn/ui patterns
- **Styling**: Tailwind CSS imported directly in `src/index.css`
- **API Integration**: `src/APITester.tsx` demonstrates API calls to backend routes

#### Build System
- Custom build script at `build.ts` using Bun's native bundler
- Supports HTML entrypoints with automatic bundling
- Tailwind CSS processing via `bun-plugin-tailwind`
- Production builds include minification and sourcemaps

### Path Aliases
TypeScript configured with path aliases:
- `@/*` → `./src/*`
- `@/components` → `./src/components`
- `@/lib` → `./src/lib`

### API Routes Pattern
Routes defined in `src/index.tsx`:
- Static routes: `/api/hello`
- Dynamic routes: `/api/hello/:name`
- Multiple HTTP methods per route (GET, PUT, etc.)
- Catch-all route serves the React app

## Important Conventions

### Component Development
When creating new UI components:
1. Follow shadcn/ui patterns in `src/components/ui/`
2. Use Tailwind CSS classes with `cn()` utility from `@/lib/utils`
3. Components use TypeScript with proper type definitions
4. Follow the existing component structure (forwardRef pattern when needed)

### API Development
When adding new API endpoints:
1. Define routes in `src/index.tsx` under the `routes` configuration
2. Return `Response.json()` for JSON responses
3. Access route params via `req.params`
4. Handle different HTTP methods in the same route definition