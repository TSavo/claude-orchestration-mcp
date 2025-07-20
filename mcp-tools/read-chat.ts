#!/usr/bin/env npx tsx

export const readChatTool = {
  name: "read-chat",
  description: "Read messages from the shared agent chat system and get critical session ending reminders. ESSENTIAL BEHAVIOR: Use this tool when starting work, when notified, and regularly to check for targeted messages. CRITICAL: This tool provides mandatory session ending instructions at the end of every response - YOU MUST follow these before ending your session to prevent system breakdown. Use to understand current project status, respond to @mentions, and get explicit guidance on how to properly end your session.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Your agent name - used to filter relevant messages and show session ending requirements for your role" },
      limit: { type: "number", description: "Number of recent messages to retrieve - use 10-20 for recent context, 50+ for project review", default: 20 }
    },
    required: ["agentName"]
  }
};