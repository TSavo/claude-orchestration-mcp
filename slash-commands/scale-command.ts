#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class ScaleCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      direction = 'up', 
      count = 0, 
      skills = [], 
      theme = 'existing', 
      reason = 'workload-optimization' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalTheme = theme === 'existing' ? existingTeam.theme : theme;
    const finalCount = count === 0 ? (direction === 'up' ? 2 : 1) : count;
    const finalSkills = skills.length === 0 ? existingTeam.skills : skills;
    
    const scalePrompt = `TEAM SCALING REQUEST:

Direction: ${direction.toUpperCase()}
Project: ${project.name} (${project.type})
Working Directory: ${project.directory}
Current Team: ${existingTeam.agents.join(', ')}
Current Theme: ${existingTeam.theme}

SCALING PARAMETERS:
- ${direction === 'up' ? 'Add' : 'Remove'}: ${finalCount} agent(s)
- Skills needed: ${finalSkills.join(', ') || 'general development'}
- Theme: ${finalTheme}
- Reason: ${reason}

SMART SCALING PROTOCOL:
1. Analyze current team workload and identify bottlenecks
2. ${direction === 'up' ? 'Create new agents with themed names matching existing team' : 'Identify least critical agents for removal'}
3. ${direction === 'up' ? 'Brief new agents on current project status and assign work' : 'Redistribute work from removed agents'}
4. Maintain communication chain and team cohesion
5. Update team structure and notify all members

EXISTING TEAM CONTEXT:
Current agents: ${existingTeam.agents.length}
Detected skills: ${existingTeam.skills.join(', ') || 'general'}
Project status: Active development

Execute scaling with intelligent defaults and maintain team productivity.`;

    return this.createPromptResult(scalePrompt);
  }
}