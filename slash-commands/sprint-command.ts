#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class SprintCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      duration = 'flexible', 
      focus = 'auto', 
      team = [], 
      specs = [] 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalTeam = team.length === 0 ? existingTeam.agents : team;
    const finalFocus = focus === 'auto' ? this.detectSprintFocus() : focus;
    const finalSpecs = specs.length === 0 ? 'auto-select ready specs' : specs.join(', ');
    
    const sprintPrompt = `SPRINT PLANNING REQUEST:

Duration: ${duration}
Focus Area: ${finalFocus}
Project: ${project.name} (${project.type})
Working Directory: ${project.directory}

SPRINT TEAM: ${finalTeam.join(', ') || 'All active team members'}

SPRINT PARAMETERS:
- Duration: ${duration === 'flexible' ? 'Adapt to work complexity' : duration}
- Primary Focus: ${finalFocus}
- Spec Selection: ${finalSpecs}
- Team Theme: ${existingTeam.theme}

SPRINT PLANNING PROTOCOL:
1. Review existing specs in specs/ directory and identify ready items
2. Prioritize specs based on dependencies and business value
3. Assign specs to team members based on skills and capacity
4. Create sprint backlog with clear success criteria
5. Establish daily check-in schedule via chat
6. Set sprint goals and definition of done

INTELLIGENT SPEC ASSIGNMENT:
- Analyze spec complexity and team member expertise
- Ensure balanced workload distribution
- Identify dependency chains and sequence work appropriately
- Create backup plans for blocked items

SPRINT COORDINATION:
- Use send-chat for all sprint communication
- Maintain communication chain protocols
- Regular progress updates from team to PM to Orchestrator
- Adapt sprint scope based on actual progress

Execute sprint planning with intelligent defaults and team-specific assignments.`;

    return this.createPromptResult(sprintPrompt);
  }

  private detectSprintFocus(): string {
    // Could analyze specs directory, recent git commits, etc.
    // For now, return sensible default
    const focuses = ['feature-completion', 'spec-creation', 'technical-debt', 'testing', 'documentation'];
    return focuses[0]; // Default to feature completion
  }
}