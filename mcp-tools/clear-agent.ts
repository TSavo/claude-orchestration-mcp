#!/usr/bin/env npx tsx

export const clearAgentTool = {
  name: "clear-agent",
  description: "Clear an agent's history while keeping agent alive",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent to clear" }
    },
    required: ["agentName"]
  }
};