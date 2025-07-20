#!/usr/bin/env npx tsx

export const scheduleTool = {
  name: "schedule",
  description: "Schedule a chat message or agent command for future execution. USAGE: Schedule reminders, follow-ups, or agent commands with flexible time format (5m, 30s, 2h, 1d). Returns a schedule ID for cancellation. Examples: schedule 5m chat Orchestrator ProjectManager '5 minutes are up, talk to me?' or schedule 30m agent TaskBot 'Please provide status update'.",
  inputSchema: {
    type: "object",
    properties: {
      delay: { 
        type: "string", 
        description: "Time delay (5m, 30s, 2h, 1d) - supports seconds(s), minutes(m), hours(h), days(d)" 
      },
      type: { 
        type: "string", 
        enum: ["chat", "agent"], 
        description: "Schedule type: 'chat' for chat messages, 'agent' for direct agent commands" 
      },
      from: { 
        type: "string", 
        description: "Sender name (for chat type) - ignored for agent type" 
      },
      to: { 
        type: "string", 
        description: "Recipient: agent name for both chat and agent types" 
      },
      message: { 
        type: "string", 
        description: "Message content or agent command to send" 
      }
    },
    required: ["delay", "type", "to", "message"]
  }
};