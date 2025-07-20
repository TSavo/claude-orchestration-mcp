#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class StatusCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      detail = 'summary', 
      hours = 24, 
      format = 'update' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    const statusPrompt = `TEAM STATUS REQUEST:

Detail Level: ${detail}
Time Window: Last ${hours} hours
Format: ${format}
Project: ${project.name}
Team: ${existingTeam.agents.join(', ') || 'No active team detected'}

TEAM STATUS PROTOCOL:
1. COMMUNICATION ANALYSIS:
   - Use read-chat agentName: "Orchestrator" limit: 50 to review recent team activity
   - Identify last status updates from each team member
   - Check for any unanswered questions or pending requests
   - Analyze communication patterns and team responsiveness
   - Look for agents who haven't reported in ${hours}+ hours

2. INDIVIDUAL AGENT STATUS CHECK:
   ${this.getAgentStatusChecks(existingTeam.agents)}

3. PROJECT PROGRESS ASSESSMENT:
   - Review recent chat for completed tasks and milestones
   - Identify current blockers and impediments mentioned by team
   - Check for any urgent issues or escalations
   - Assess overall team velocity and productivity

4. TEAM COORDINATION ANALYSIS:
   - Evaluate communication chain effectiveness
   - Check if all agents are following session ending protocols
   - Identify any communication gaps or silent periods
   - Review team responsiveness to assignments and questions

CHAT ANALYSIS COMMANDS:
\`\`\`bash
# Read recent team communications
read-chat agentName: "Orchestrator" limit: 50

# Check specific agent status if concerning patterns found
${existingTeam.agents.map(agent => `get-last-messages agentName: "${agent}" count: 10`).join('\n')}

# Test agent responsiveness if needed
${existingTeam.agents.map(agent => `send-agent-command agentName: "${agent}" command: "Please provide current status update"`).join('\n')}
\`\`\`

STATUS UPDATE REQUEST:
Based on communication analysis, request fresh status updates from team:

"TEAM STATUS REQUEST: All team members please provide current status update including:
1. What you're currently working on
2. Progress since last update  
3. Any blockers or issues
4. Expected completion timeline
5. What you plan to work on next

Please respond within 15 minutes with your status. Use the format:
send-chat from: '[YourName]' content: 'STATUS: [current work]. PROGRESS: [what completed]. BLOCKERS: [any issues]. NEXT: [plans].' to: 'Orchestrator'"

EXPECTED RESPONSES:
- Each team member should respond with current status
- ProjectManagers should provide team-wide updates  
- Developers should report specific task progress
- Any silent agents should be flagged for restart protocol

ESCALATION TRIGGERS:
- Any agent silent for ${hours}+ hours without explanation
- Agents not responding to direct status requests
- Communication chain breaks or protocol violations
- Critical blockers mentioned without resolution timeline

Execute comprehensive team status analysis with communication review and fresh updates.`;

    return this.createPromptResult(statusPrompt);
  }

  private getAgentStatusChecks(agents: string[]): string {
    if (agents.length === 0) {
      return '   - No active agents detected - consider team deployment\n   - Check for dormant agent sessions that need activation\n   - Evaluate if new team assembly is required';
    }

    return `   For each team member (${agents.join(', ')}):
   - Check their last chat activity and status reports
   - Use get-last-messages to review recent work activity
   - Send direct status request if no recent communication
   - Flag any agents showing signs of being stuck or unresponsive
   - Verify agents are following proper session ending protocols`;
  }
}