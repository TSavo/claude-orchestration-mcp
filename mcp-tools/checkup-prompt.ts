#!/usr/bin/env npx tsx

export const checkupPromptTool = {
  name: "checkup",
  description: "Prompt the orchestrator to check team status and take action",
  inputSchema: {
    type: "object",
    properties: {
      focus: { type: "string", description: "Specific area to check (team status, progress, blockers, etc.)", default: "overall status" }
    }
  }
};