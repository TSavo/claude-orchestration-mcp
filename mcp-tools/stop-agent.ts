#!/usr/bin/env npx tsx

export const stopAgentTool = {
  name: "stop-agent",
  description: "Stop current request for an agent",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent to stop" }
    },
    required: ["agentName"]
  }
};