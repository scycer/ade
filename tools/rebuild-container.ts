#!/usr/bin/env bun

import { $ } from "bun";

console.log("🔄 Rebuilding Docker container...");

try {
  // Stop the current container
  console.log("📦 Stopping current container...");
  await $`docker compose down`.quiet();

  // Rebuild with no cache to ensure all dependencies are fresh
  console.log("🔨 Building new container image...");
  await $`docker compose build --no-cache`;

  // Start the container in detached mode
  console.log("🚀 Starting container...");
  await $`docker compose up -d`;

  console.log("✅ Container rebuilt and started successfully!");
  console.log("🌐 App running at http://localhost:6969");
} catch (error) {
  console.error("❌ Failed to rebuild container:", error);
  process.exit(1);
}
