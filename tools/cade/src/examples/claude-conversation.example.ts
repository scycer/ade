import { ClaudeCodeService } from "../services/claude-code.service";

/**
 * Example: Multi-turn conversation with Claude Code that can edit files
 *
 * This demonstrates how to:
 * 1. Start a conversation with Claude
 * 2. Enable file system operations
 * 3. Handle streaming responses
 * 4. Track tool usage
 * 5. Continue the conversation with context
 */

async function runConversationExample() {
  // Initialize the service
  const claude = new ClaudeCodeService();

  console.log("🤖 Starting Claude Code conversation with file system access...\n");

  // Options for the conversation
  const conversationOptions = {
    allowFileOperations: true,  // Enable file system access
    workingDirectory: process.cwd(),  // Set working directory

    // Optional: Track when Claude uses tools
    onToolUse: (tool: string, args: any) => {
      console.log(`📦 Tool used: ${tool}`);
      console.log(`   Args:`, args);
    },

    // Optional: Show partial messages as they stream
    onPartialMessage: (content: string) => {
      // Could update UI with streaming content
      // console.log("Streaming:", content);
    }
  };

  try {
    // First turn: Ask Claude to examine the project
    console.log("👤 User: What files are in the src/services directory?\n");

    let sessionId: string | undefined;

    for await (const message of claude.conversation(
      "What files are in the src/services directory?",
      conversationOptions
    )) {
      if (message.type === "result") {
        console.log("🤖 Claude:", message.response);
        sessionId = message.sessionId;  // Save session ID for continuation

        if (message.toolsUsed?.length > 0) {
          console.log("\n📊 Tools used in this turn:",
            message.toolsUsed.map((t: any) => t.name).join(", "));
        }
      }
      // Could also handle tool_use messages here for real-time updates
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Second turn: Continue the conversation with context
    console.log("👤 User: Create a simple hello.service.ts file in that directory\n");

    for await (const message of claude.conversation(
      "Create a simple hello.service.ts file in that directory with a HelloService class that has a greet method",
      { ...conversationOptions, sessionId }  // Use same session
    )) {
      if (message.type === "result") {
        console.log("🤖 Claude:", message.response);

        if (message.toolsUsed?.length > 0) {
          console.log("\n📊 Tools used in this turn:",
            message.toolsUsed.map((t: any) => t.name).join(", "));
        }

        if (message.costUsd) {
          console.log(`💰 Cost: $${message.costUsd.toFixed(4)}`);
        }
      }
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // Third turn: Modify the file we just created
    console.log("👤 User: Add a goodbye method to that service\n");

    for await (const message of claude.conversation(
      "Add a goodbye method to the HelloService class that returns 'Goodbye!'",
      { ...conversationOptions, sessionId }
    )) {
      if (message.type === "result") {
        console.log("🤖 Claude:", message.response);

        if (message.toolsUsed?.length > 0) {
          console.log("\n📊 Tools used:",
            message.toolsUsed.map((t: any) => t.name).join(", "));
        }
      }
    }

    // Show conversation history
    console.log("\n" + "=".repeat(50));
    console.log("📜 Conversation History:");
    const history = claude.getHistory();
    history.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}]: ${msg.content.substring(0, 100)}...`);
      if (msg.toolCalls) {
        console.log(`   Tools: ${msg.toolCalls.map((t: any) => t.name).join(", ")}`);
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Alternative: Simple usage without streaming
async function simpleConversationExample() {
  const claude = new ClaudeCodeService();

  // Collect all messages into an array
  const messages: any[] = [];

  for await (const msg of claude.conversation(
    "List the files in the current directory and tell me what this project does",
    { allowFileOperations: true }
  )) {
    messages.push(msg);
  }

  // Find the result message
  const result = messages.find(m => m.type === "result");
  if (result) {
    console.log("Response:", result.response);
    console.log("Tools used:", result.toolsUsed?.map((t: any) => t.name));
  }
}

// Run the example
if (require.main === module) {
  runConversationExample()
    .then(() => console.log("\n✅ Example completed"))
    .catch(console.error);
}

export { runConversationExample, simpleConversationExample };