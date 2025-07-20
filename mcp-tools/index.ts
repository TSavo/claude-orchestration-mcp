#!/usr/bin/env npx tsx

// Agent Management Tools
export { makeNewAgentTool } from './make-new-agent.js';
export { sendAgentCommandTool } from './send-agent-command.js';
export { getLastMessagesTool } from './get-last-messages.js';
export { stopAgentTool } from './stop-agent.js';
export { deleteAgentTool } from './delete-agent.js';
export { clearAgentTool } from './clear-agent.js';
export { summarizeAgentTool } from './summarize-agent.js';

// Communication Tools
export { sendChatTool } from './send-chat.js';
export { readChatTool } from './read-chat.js';

// System Tools
export { setTimeoutTool } from './set-timeout.js';

// Scheduling Tools
export { scheduleTool } from './schedule.js';
export { listScheduledTool } from './list-scheduled.js';
export { cancelScheduledTool } from './cancel-scheduled.js';

// Core Prompt Generators
export { initPromptTool } from './init-prompt.js';
export { assemblePromptTool } from './assemble-prompt.js';
export { checkupPromptTool } from './checkup-prompt.js';

// Tool collection for easy import
export const foundationalTools = [
  makeNewAgentTool,
  sendAgentCommandTool,
  getLastMessagesTool,
  stopAgentTool,
  deleteAgentTool,
  clearAgentTool,
  summarizeAgentTool,
  sendChatTool,
  readChatTool,
  setTimeoutTool,
  scheduleTool,
  listScheduledTool,
  cancelScheduledTool,
  initPromptTool,
  assemblePromptTool,
  checkupPromptTool
];