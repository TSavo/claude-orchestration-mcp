#!/usr/bin/env npx tsx

export const setTimeoutTool = {
  name: "set-timeout",
  description: "Configure the agent timeout duration",
  inputSchema: {
    type: "object",
    properties: {
      minutes: { type: "number", description: "Timeout duration in minutes", default: 30 }
    },
    required: ["minutes"]
  }
};