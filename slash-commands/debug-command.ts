#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class DebugCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      scope = 'all', 
      target = [], 
      depth = 'deep' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalTargets = target.length === 0 ? existingTeam.agents : target;
    
    const debugPrompt = `SYSTEM DIAGNOSTICS REQUEST:

Scope: ${scope.toUpperCase()}
Target Agents: ${finalTargets.join(', ') || 'All system agents'}
Debug Depth: ${depth}
Project: ${project.name}
Working Directory: ${project.directory}

DIAGNOSTIC PROTOCOL:
1. AGENT HEALTH CHECK:
${this.getAgentDiagnostics(finalTargets)}

2. COMMUNICATION SYSTEM ANALYSIS:
   - Check chat system functionality and message flow
   - Verify MCP tool connectivity and responsiveness
   - Test notification system and timeout mechanisms
   - Analyze message queue and delivery status

3. SYSTEM PERFORMANCE DIAGNOSTICS:
${this.getPerformanceDiagnostics(scope)}

4. ERROR ANALYSIS:
   - Review recent error logs and patterns
   - Identify recurring issues and their frequency
   - Analyze timeout events and agent failures
   - Check for system resource constraints

DEBUGGING TOOLS AND COMMANDS:
${this.getDebugCommands(scope, finalTargets)}

DIAGNOSTIC DEPTH: ${this.getDepthRequirements(depth)}

REMEDIATION GUIDANCE:
- For unresponsive agents: Use restart protocol with 90-second timeout
- For communication failures: Check chat system and MCP connectivity
- For performance issues: Analyze resource usage and bottlenecks
- For system errors: Review logs and implement specific fixes

EXPECTED OUTPUTS:
- Agent responsiveness report with specific status for each agent
- Communication system health assessment
- Performance metrics and bottleneck identification
- Specific remediation steps for identified issues

Execute comprehensive system diagnostics with detailed analysis and actionable solutions.`;

    return this.createPromptResult(debugPrompt);
  }

  private getAgentDiagnostics(targets: string[]): string {
    if (targets.length === 0) {
      return `   - Scan all active agents for responsiveness
   - Use get-last-messages for each agent to check recent activity
   - Send test messages using send-agent-command: "Please confirm you are responsive"
   - Monitor response times and identify silent/stuck agents`;
    }

    return `   - Check specific agents: ${targets.join(', ')}
   - For each target agent:
     * get-last-messages agentName: "[AgentName]" count: 10
     * send-agent-command agentName: "[AgentName]" command: "Status check - please respond"
     * Wait 90 seconds for response and log results
     * Check .claude-agent-[name].json for conversation health`;
  }

  private getPerformanceDiagnostics(scope: string): string {
    const diagnostics = {
      'agents': '   - Monitor agent response times and processing delays\n   - Check agent memory usage and conversation length\n   - Analyze agent workload distribution and capacity',
      'communication': '   - Test chat message delivery speed and reliability\n   - Check MCP tool invocation times and success rates\n   - Verify notification system timing and accuracy',
      'system': '   - Monitor overall system resource utilization\n   - Check file system performance and disk space\n   - Analyze process health and memory consumption',
      'performance': '   - Comprehensive performance profiling across all components\n   - Identify bottlenecks in agent communication and processing\n   - Measure system throughput and response characteristics',
      'all': '   - Complete system performance analysis\n   - Agent responsiveness and communication flow testing\n   - Resource utilization and capacity assessment\n   - End-to-end workflow timing and efficiency metrics'
    };
    
    return diagnostics[scope] || diagnostics['all'];
  }

  private getDebugCommands(scope: string, targets: string[]): string {
    const baseCommands = `Essential MCP debugging commands to execute:
   - get-last-messages agentName: "[AgentName]" count: 10 (for each agent)
   - send-agent-command agentName: "[AgentName]" command: "Please confirm responsive"
   - read-chat agentName: "Orchestrator" limit: 20 (check communication flow)`;

    const targetCommands = targets.length > 0 ? 
      `\n\nSpecific commands for target agents:\n${targets.map(agent => 
        `   - get-last-messages agentName: "${agent}" count: 15\n   - send-agent-command agentName: "${agent}" command: "Debug status check"`
      ).join('\n')}` : '';

    const scopeCommands = {
      'agents': '\n\nAgent-specific diagnostics:\n   - Test each agent with simple tasks\n   - Check agent history file integrity\n   - Verify agent configuration and capabilities',
      'communication': '\n\nCommunication diagnostics:\n   - send-chat from: "SYSTEM" content: "Communication test" to: each agent\n   - Monitor chat delivery and response patterns\n   - Test MCP tool connectivity',
      'system': '\n\nSystem-level diagnostics:\n   - Check file system permissions and space\n   - Monitor process health and resource usage\n   - Verify tmux session health and connectivity'
    };

    return baseCommands + targetCommands + (scopeCommands[scope] || '');
  }

  private getDepthRequirements(depth: string): string {
    const depths = {
      'surface': 'Quick health check focusing on immediate issues and agent responsiveness',
      'deep': 'Comprehensive analysis including performance metrics, error patterns, and system health',
      'comprehensive': 'Exhaustive diagnostics including historical analysis, capacity planning, and optimization recommendations'
    };
    
    return depths[depth] || depths['deep'];
  }
}