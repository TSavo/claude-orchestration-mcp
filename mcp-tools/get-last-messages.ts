#!/usr/bin/env npx tsx

export const getLastMessagesTool = {
  name: "get-last-messages",
  description: "Get the last X messages from an agent",
  inputSchema: {
    type: "object",
    properties: {
      agentName: { type: "string", description: "Name of the agent" },
      count: { type: "number", description: "Number of messages to retrieve", default: 10 }
    },
    required: ["agentName"]
  }
};