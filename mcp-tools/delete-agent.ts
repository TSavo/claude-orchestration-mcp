#!/usr/bin/env npx tsx

export const deleteAgentTool = {
  name: "delete-agent",
  description: "Delete an agent permanently from the system. LIFECYCLE MANAGEMENT: Use when projects complete or switching to diverse tasks. Fresh agents provide better focus and avoid context contamination. ONLY delete agents when: 1) Project fully complete, 2) Switching to different technology/domain, 3) Agent becomes confused/unresponsive. Keep agents for same-project continuation.",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent to permanently remove - this will delete their conversation history" }
    },
    required: ["agentName"]
  }
};