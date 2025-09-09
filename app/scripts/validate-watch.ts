#!/usr/bin/env bun

import { $ } from "bun";
import { writeFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { join, relative } from "node:path";

interface CheckResult {
  name: string;
  status: "SUCCESS" | "FAIL";
  output?: string;
  errors?: string;
}

async function runCheck(
  name: string,
  command: string[]
): Promise<CheckResult> {
  try {
    const result = await $`${command}`.quiet();
    return {
      name,
      status: "SUCCESS",
      output: result.stdout.toString(),
    };
  } catch (error: any) {
    return {
      name,
      status: "FAIL",
      errors: error.stderr?.toString() || error.stdout?.toString() || error.message,
    };
  }
}

async function runAllChecks(): Promise<CheckResult[]> {
  console.log("🔍 Running validation checks...");

  const checks = await Promise.all([
    runCheck("Tests", ["bun", "test"]),
    runCheck("TypeScript", ["bunx", "tsc", "--noEmit"]),
    runCheck("Compilation", ["bun", "build", "./src/index.tsx", "--target=bun", "--outdir=/tmp/bun-compile-check"]),
  ]);

  return checks;
}

function formatResults(results: CheckResult[]): string {
  const timestamp = new Date().toISOString();
  let output = `=================================
VALIDATION REPORT
Generated: ${timestamp}
=================================\n\n`;

  let hasFailures = false;

  for (const result of results) {
    const statusEmoji = result.status === "SUCCESS" ? "✅" : "❌";
    output += `${statusEmoji} ${result.name}: ${result.status}\n`;

    if (result.status === "FAIL") {
      hasFailures = true;
      output += "  Issues:\n";
      if (result.errors) {
        // Indent each line of the error output
        const errorLines = result.errors.split("\n").filter(line => line.trim());
        errorLines.forEach(line => {
          output += `    ${line}\n`;
        });
      }
      output += "\n";
    }
  }

  output += "\n=================================\n";
  output += `Overall Status: ${hasFailures ? "❌ FAILED" : "✅ PASSED"}\n`;
  output += "=================================\n";

  return output;
}

async function writeReport(results: CheckResult[]) {
  const report = formatResults(results);
  const outputPath = "./validation-report.txt";

  await writeFile(outputPath, report);
  console.log(`\n📄 Report written to: ${outputPath}`);
  console.log("\n" + report);
}

async function runValidation() {
  const results = await runAllChecks();
  await writeReport(results);
}

// Run initial validation
await runValidation();

// Watch for file changes
console.log("\n👁️  Watching for file changes...");
console.log("Press Ctrl+C to stop\n");

const watchPaths = ["./src", "./scripts", "."];
const ignorePaths = [/node_modules/, /\.git/, /dist/, /validation-report\.txt/, /bun\.lockb/];

// Debounce mechanism to prevent multiple runs
let debounceTimer: Timer | null = null;
let pendingValidation = false;

async function debouncedValidation() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  pendingValidation = true;
  
  debounceTimer = setTimeout(async () => {
    if (pendingValidation) {
      pendingValidation = false;
      await runValidation();
    }
  }, 100); // Run after 100ms of no changes
}

// Set up file watchers with polling for better detection
watchPaths.forEach(path => {
  try {
    watch(path, { 
      recursive: true,
      persistent: true // Keep watching even if directory is renamed/recreated
    }, async (eventType, filename) => {
      if (!filename) return;

      // Skip if file matches ignore patterns
      if (ignorePaths.some(pattern => pattern.test(filename))) return;

      // Watch all relevant file types
      if (!/\.(ts|tsx|js|jsx|json|mjs|cjs)$/.test(filename)) return;

      console.log(`\n🔄 Change detected (${eventType}): ${filename}`);
      await debouncedValidation();
    });
  } catch (error) {
    console.warn(`⚠️  Could not watch ${path}:`, error);
  }
});

// Track file modification times for extra detection
const fileModTimes = new Map<string, number>();
let lastValidationTime = Date.now();

// Function to check if files have been modified
async function checkForModifications() {
  const files = await $`find ./src ./scripts -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -newer /tmp/.last-validation-check 2>/dev/null || true`.quiet().text();
  
  if (files.trim()) {
    const changedFiles = files.trim().split('\n').filter(f => f);
    if (changedFiles.length > 0) {
      console.log(`\n🔍 Detected ${changedFiles.length} file(s) changed via polling`);
      await debouncedValidation();
    }
  }
  
  // Update timestamp file
  await $`touch /tmp/.last-validation-check`.quiet();
}

// Also use polling as a backup for missed events
setInterval(async () => {
  if (!pendingValidation && !debounceTimer) {
    await checkForModifications();
  }
}, 2000); // Check every 2 seconds for more aggressive detection

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n\n👋 Stopping validation watcher...");
  process.exit(0);
});