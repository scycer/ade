import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ClaudeCodeService } from "./claude-code.service";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * Integration test for ClaudeCodeService with tool usage
 * This test verifies that Claude can actually use tools to create files
 */

describe("ClaudeCodeService - Tool Usage Test", () => {
  let service: ClaudeCodeService;
  const testDir = path.join(__dirname, "../../test-output");
  const testFile = path.join(testDir, "claude-test-file.txt");

  beforeEach(async () => {
    service = new ClaudeCodeService();
    // Ensure test directory exists
    await fs.mkdir(testDir, { recursive: true });
    // Clean up any existing test file
    try {
      await fs.unlink(testFile);
    } catch {}
  });

  afterEach(async () => {
    // Clean up test file after test
    try {
      await fs.unlink(testFile);
    } catch {}
  });

  test("should use tools to create a file", async () => {
    console.log("\n🧪 Testing Claude Code Service tool usage...");
    console.log(`📁 Test file path: ${testFile}`);

    // Track what tools were used
    const toolsUsed: string[] = [];
    let response = "";
    let sessionId = "";

    // Ask Claude to create a specific file with specific content
    const testContent = "Hello from Claude Code Service Test!";
    const prompt = `Create a file at ${testFile} with exactly this content: "${testContent}"`;

    console.log(`💬 Prompt: ${prompt}`);

    // Execute the conversation
    for await (const msg of service.conversation(prompt, {
      allowFileOperations: true,
      workingDirectory: testDir,
      onToolUse: (tool, args) => {
        console.log(`🔧 Tool used: ${tool}`, args);
        toolsUsed.push(tool);
      }
    })) {
      if (msg.type === "tool_use") {
        console.log(`  Tool: ${msg.tool} - ${msg.result}`);
      }

      if (msg.type === "result") {
        response = msg.response;
        sessionId = msg.sessionId || "";

        if (msg.toolsUsed && msg.toolsUsed.length > 0) {
          console.log(`📊 Tools reported in result:`, msg.toolsUsed.map((t: any) => t.name));
        }
      }
    }

    console.log(`\n📝 Response: ${response}`);
    console.log(`🔑 Session ID: ${sessionId}`);
    console.log(`🛠️ Tools used: ${toolsUsed.join(", ")}`);

    // Verify the response is not asking for permission
    expect(response.toLowerCase()).not.toContain("permission");
    expect(response.toLowerCase()).not.toContain("grant");
    expect(response.toLowerCase()).not.toContain("allow");

    // Verify tools were actually used
    expect(toolsUsed.length).toBeGreaterThan(0);

    // Check for file creation tool usage
    const fileCreationTools = ["create_file", "write_file", "edit_file"];
    const usedFileCreationTool = toolsUsed.some(tool =>
      fileCreationTools.includes(tool.toLowerCase())
    );
    expect(usedFileCreationTool).toBe(true);

    // Most importantly: Verify the file was actually created
    const fileExists = await fs.access(testFile)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);

    // Verify the file content is correct
    if (fileExists) {
      const content = await fs.readFile(testFile, "utf-8");
      console.log(`📄 File content: "${content}"`);
      expect(content).toBe(testContent);
    }

    console.log("\n✅ Test completed successfully!");
  }, 60000); // 60 second timeout for API call

  test("should track tool usage for reading files", async () => {
    console.log("\n🧪 Testing file reading with tool tracking...");

    // First create a file to read
    const testContent = "Test content for reading";
    await fs.writeFile(testFile, testContent);

    const toolsUsed: string[] = [];
    let response = "";

    const prompt = `Read the file at ${testFile} and tell me what it contains`;

    for await (const msg of service.conversation(prompt, {
      allowFileOperations: true,
      workingDirectory: testDir,
      onToolUse: (tool, args) => {
        console.log(`🔧 Tool used: ${tool}`);
        toolsUsed.push(tool);
      }
    })) {
      if (msg.type === "result") {
        response = msg.response;
      }
    }

    console.log(`📝 Response: ${response}`);
    console.log(`🛠️ Tools used: ${toolsUsed.join(", ")}`);

    // Verify response mentions the content
    expect(response.toLowerCase()).toContain("test content");

    // Verify read tool was used
    const readTools = ["read_file", "read", "cat"];
    const usedReadTool = toolsUsed.some(tool =>
      readTools.includes(tool.toLowerCase())
    );
    expect(usedReadTool).toBe(true);

    console.log("✅ Read test completed!");
  }, 60000);
});

// Run the test if this file is executed directly
if (require.main === module) {
  console.log("Running Claude Code Service Tool Usage Test...");
}