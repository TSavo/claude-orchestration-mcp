#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class RestartCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      agents = [], 
      preserve = 'history', 
      notify = true, 
      reason = 'unresponsive' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const unresponsiveAgents = this.getUnresponsiveAgents();
    
    // Smart defaults
    const finalAgents = agents.length === 0 ? unresponsiveAgents : agents;
    
    const restartPrompt = `AGENT RESTART REQUEST:

Target Agents: ${finalAgents.length > 0 ? finalAgents.join(', ') : 'Auto-detected unresponsive agents'}
Preserve: ${preserve}
Notify Team: ${notify}
Reason: ${reason}

CURRENT TEAM STATUS:
Total agents: ${existingTeam.agents.join(', ')}
Unresponsive detected: ${unresponsiveAgents.join(', ') || 'None detected'}
Theme: ${existingTeam.theme}

RESTART PROTOCOL:
1. DETECT STUCK AGENTS using MCP debugging tools:
   - Use get-last-messages agentName: "[AgentName]" count: 10 to check recent activity
   - Look for agents with no recent messages or stuck in loops
   - Use send-agent-command to send test message: "Please confirm you are responsive"
   - If no response after 90 seconds, agent is stuck and needs restart

2. DIAGNOSE BEFORE RESTART:
   - Check last messages for error patterns or infinite loops
   - Identify what the agent was trying to do when it got stuck
   - Preserve this context for post-restart briefing

3. SAFE RESTART SEQUENCE:
   - Use delete-agent agentName: "[AgentName]" to remove stuck agent
   - Use make-new-agent name: "[AgentName]" to recreate with same name
   - Restore context based on preserve setting: ${preserve}

4. CONTEXT RESTORATION:
   - ${preserve === 'history' ? 'Load full conversation history from .claude-agent-[name].json' : preserve === 'summary' ? 'Provide work summary from recent messages' : 'Fresh start with current project briefing only'}
   - Brief restarted agent on what they were working on when they got stuck
   - Restore any pending task assignments

5. TEAM NOTIFICATION:
   - ${notify ? 'Send chat update: "Agent [Name] has been restarted and is back online"' : 'Silent restart without team notification'}
   - Ensure restarted agents know their communication chains

CONTEXT PRESERVATION:
- History: ${preserve === 'history' ? 'Maintain full conversation logs' : 'Skip'}
- Summary: ${preserve === 'summary' ? 'Provide work summary to restarted agents' : 'Skip'}
- Project briefing: Always provide current project context

COMMUNICATION CONTINUITY:
- Maintain existing team communication chains
- Ensure restarted agents know their supervisor relationships
- Restore any pending task assignments

Execute restart with intelligent recovery and minimal workflow disruption.`;

    return this.createPromptResult(restartPrompt);
  }
}