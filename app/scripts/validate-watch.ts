#!/usr/bin/env bun

import { $ } from "bun";
import { writeFile } from "node:fs/promises";
import { watch } from "node:fs";

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

const watchPaths = ["./src"];
const ignorePaths = [/node_modules/, /\.git/, /dist/, /validation-report\.txt/];

// Set up file watchers
watchPaths.forEach(path => {
  try {
    watch(path, { recursive: true }, async (_eventType, filename) => {
      if (!filename) return;

      // Skip if file matches ignore patterns
      if (ignorePaths.some(pattern => pattern.test(filename))) return;

      // Skip non-code files
      if (!/\.(ts|tsx|js|jsx|json)$/.test(filename)) return;

      console.log(`\n🔄 Change detected in: ${filename}`);
      await runValidation();
    });
  } catch (error) {
    console.warn(`⚠️  Could not watch ${path}:`, error);
  }
});

// Keep the process running
process.on("SIGINT", () => {
  console.log("\n\n👋 Stopping validation watcher...");
  process.exit(0);
});