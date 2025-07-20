#!/usr/bin/env npx tsx

export const summarizeAgentTool = {
  name: "summarize-agent",
  description: "Create a summary of an agent's work history",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent to summarize" }
    },
    required: ["agentName"]
  }
};