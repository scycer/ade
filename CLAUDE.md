# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADE - A Bun-powered React application with Tailwind CSS and shadcn/ui components. The project uses Bun's native server with HTML imports for hot module replacement and built-in routing.

## Development Commands

### From root directory:
- **Start development**: `./start-dev.sh` or `cd app && bun run dev`
- **Start production**: `./start-prod.sh` or `cd app && bun run start`

### From app directory:
- **Install dependencies**: `bun install`
- **Development server**: `bun dev` (runs with HMR on port 3000)
- **Production server**: `bun start` (NODE_ENV=production)
- **Build for production**: `bun run build` or `bun build.ts`
  - Outputs to `dist/` directory
  - Supports CLI flags: `--minify`, `--sourcemap`, `--outdir`, etc.
  - Run `bun build.ts --help` for all options

## Architecture Overview

### Server Architecture (app/src/index.tsx)
- Uses `Bun.serve()` with native routing support
- HTML imports for React components with automatic bundling
- Routes defined in object format:
  - `"/*"`: Catch-all for client-side routing (serves index.html)
  - `/api/todo`: Reads and returns TODO.md content from docs directory
- Development features: HMR enabled, console forwarding to server

### Frontend Structure
- **Entry point**: `app/src/index.html` imports `frontend.tsx`
- **React root**: Mounts to document body via `frontend.tsx`
- **Components**: shadcn/ui components in `app/src/components/ui/`
- **Styling**: Tailwind CSS with custom configuration
- **Path aliases**: `@/*` maps to `./src/*`

### Key Configuration Files
- `app/tsconfig.json`: TypeScript config with bundler mode, strict typing
- `app/components.json`: shadcn/ui configuration (New York style, zinc base color)
- `app/bunfig.toml`: Bun configuration

## Bun-Specific Guidelines

### Use Bun APIs Instead of Node Packages
- **Server**: `Bun.serve()` (not Express)
- **SQLite**: `bun:sqlite` (not better-sqlite3)
- **Redis**: `Bun.redis` (not ioredis)
- **Postgres**: `Bun.sql` (not pg)
- **WebSocket**: Built-in WebSocket support
- **File operations**: `Bun.file()` over fs methods
- **Shell commands**: `Bun.$` instead of execa
- **Testing**: `bun test` with `bun:test`

### HTML Imports Pattern
Bun automatically bundles and transpiles when HTML files import TypeScript/React:
```html
<script type="module" src="./frontend.tsx"></script>
```

## Adding Features

### New API Endpoint
Add to routes object in `app/src/index.tsx`:
```typescript
"/api/your-endpoint": {
  GET: async (req) => Response.json({...}),
  POST: async (req) => Response.json({...})
}
```

### New Component
1. Use shadcn/ui CLI: `bunx shadcn add <component>`
2. Or create in `app/src/components/`
3. Follow existing component patterns (use `cn()` utility for className merging)

### WebSocket Support
Add websocket handler to server config:
```typescript
websocket: {
  open: (ws) => {},
  message: (ws, message) => {},
  close: (ws) => {}
}
```

## Planned Features (from docs/TODO.md)
- Git commit visualization with diff viewer
- AI-powered commit summaries
- Node and edges visualization (fullstack with AI)
- Document vector search tool
- Claude Code session monitoring and hook logging
- Validation hooks system

## Project Structure
```
/
├── app/                 # Main application
│   ├── src/
│   │   ├── index.tsx   # Server entry point
│   │   ├── index.html  # HTML entry point
│   │   ├── frontend.tsx # React app mount
│   │   ├── App.tsx     # Main React component
│   │   ├── APITester.tsx # API testing component
│   │   └── components/ui/ # shadcn/ui components
│   ├── build.ts        # Production build script
│   └── package.json    # Dependencies and scripts
├── docs/               # Documentation and planning
├── misc/               # Miscellaneous files
├── start-dev.sh        # Development launcher
└── start-prod.sh       # Production launcher
```