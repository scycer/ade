# Development Dockerfile - minimal, everything is mounted
FROM oven/bun:latest

# Set working directory
WORKDIR /app

RUN ls -la

# Expose the development server port
EXPOSE 6969

# Start the development server with hot reload
CMD ["sh", "-c", "bun install && bun run dev"]