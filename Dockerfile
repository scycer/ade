# Development Dockerfile - minimal, everything is mounted
FROM oven/bun:latest

# Install Node.js 18+ for Claude Code CLI
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /app

# Expose the development server port
EXPOSE 6969

# Start the development server with hot reload
CMD ["bun", "run", "start"]