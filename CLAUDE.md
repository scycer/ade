# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADE (AI-first Development Environment) - A Bun-based development environment with React frontend, designed to integrate with Claude Code and provide AI-powered development capabilities.

## Tech Stack

- **Runtime**: Bun (latest) - Use Bun instead of Node.js for all operations
- **Frontend**: React 19 with TypeScript
- **Build System**: Bun's built-in bundler with HTML imports
- **Containerization**: Docker with docker-compose for development

## Development Commands

### Running the Application

```bash
# Install dependencies
cd app && bun install

# Development server with hot reload (port 6969)
bun dev

# Production build
bun build

# Production server
bun start
```

### Docker Development

```bash
# Start the development container
docker-compose up

# The container mounts:
# - ./app -> /app (application code)
# - ./data -> /data (persistent data)
# - ./codebases -> /codebases (for cloned repositories)
```

## Architecture

### Server Structure
- **Entry Point**: `app/src/index.tsx` - Bun server with HTML imports, no need for Vite or webpack
- **Frontend Entry**: `app/src/index.html` imports `frontend.tsx` directly
- **API Routes**: Defined in the server's routes object (e.g., `/api/hello`)

### Key Patterns
- Use `Bun.serve()` with routes object for API endpoints
- HTML imports handle React/TSX/CSS bundling automatically  
- Hot Module Replacement (HMR) enabled in development
- No need for dotenv - Bun loads `.env` automatically

### File Structure
```
/app
  /src
    - index.tsx      # Server entry point with routes
    - index.html     # HTML entry that imports frontend
    - frontend.tsx   # React app mount point
    - App.tsx        # Main React component
    - index.css      # Styles
```

## Bun-Specific Guidelines

- Use `bun` instead of `node` or `ts-node`
- Use `bun test` instead of jest/vitest
- Use `Bun.file()` instead of fs.readFile/writeFile
- Use `Bun.$` for shell commands instead of execa
- Use built-in WebSocket support, not `ws` package
- For SQLite: use `bun:sqlite`
- For Redis: use `Bun.redis`
- For Postgres: use `Bun.sql`

## Current Development Focus

Based on TODO.md, the immediate goals are:
1. Basic file reading and display in UI
2. Git repository cloning with worktree support
3. Claude Code integration

## Port Configuration

Default port is 6969, configurable via PORT environment variable in `.env` or docker-compose.