#!/usr/bin/env npx tsx

export const sendChatTool = {
  name: "send-chat",
  description: "Send a message to the shared agent chat system. PRIMARY COMMUNICATION TOOL. Automatically registers agent activity to reset timeout when used. CRITICAL SESSION ENDING FORMATS (MANDATORY): Orchestrator asks user 'What would you like me to do next?', ProjectManager sends 'SESSION END: [summary]. NEXT: [plans]. Any new instructions?' to Orchestrator, Developer sends 'SESSION END: [work]. NEXT: [plans]. Any new assignments?' to ProjectManager. TASK ASSIGNMENTS must include 'REPLY TO:' and 'DO NOT FINISH' instructions. NEVER end a session without following required format for your role.",
  inputSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "Your agent name - always identify yourself correctly" },
      content: { type: "string", description: "Message content - be specific and include context. For assignments include 'REPLY TO:' and 'DO NOT FINISH' instructions." },
      to: { type: "string", description: "Target agent name for direct communication (enables focused collaboration) - REQUIRED for session endings and assignments" }
    },
    required: ["from", "content"]
  }
};