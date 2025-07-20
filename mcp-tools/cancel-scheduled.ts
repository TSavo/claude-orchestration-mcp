#!/usr/bin/env npx tsx

export const cancelScheduledTool = {
  name: "cancelscheduled",
  description: "Cancel a scheduled task by its ID. Use listscheduled to see all pending tasks and their IDs. Once cancelled, the scheduled chat message or agent command will not execute.",
  inputSchema: {
    type: "object",
    properties: {
      scheduleId: { 
        type: "string", 
        description: "The schedule ID to cancel (get from listscheduled)" 
      }
    },
    required: ["scheduleId"]
  }
};