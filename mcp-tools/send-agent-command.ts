#!/usr/bin/env npx tsx

export const sendAgentCommandTool = {
  name: "send-agent-command",
  description: "Send a direct command to an existing agent. EMERGENCY USE ONLY: For debugging unresponsive agents or system recovery. ALL normal communication including briefings MUST use send-chat with 'to:' parameter. This bypasses the chat system and should be avoided - prefer send-chat for all regular communication including initial briefings.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent (emergency debugging only)" },
      command: { type: "string", description: "Emergency command - prefer send-chat for normal communication" }
    },
    required: ["agentName", "command"]
  }
};