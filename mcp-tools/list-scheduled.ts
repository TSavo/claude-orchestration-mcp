#!/usr/bin/env npx tsx

export const listScheduledTool = {
  name: "listscheduled",
  description: "List all pending scheduled tasks with their IDs, execution times, and details. Shows scheduled chat messages and agent commands that are waiting to execute. Use the returned IDs with cancelscheduled to cancel specific tasks.",
  inputSchema: {
    type: "object",
    properties: {
      filter: { 
        type: "string", 
        enum: ["all", "chat", "agent"], 
        description: "Filter by task type - shows all scheduled tasks if not specified",
        default: "all" 
      },
      format: { 
        type: "string", 
        enum: ["table", "list", "detailed"], 
        description: "Output format for scheduled tasks",
        default: "table" 
      }
    }
  }
};