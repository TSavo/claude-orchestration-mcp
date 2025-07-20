#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class FocusCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      priority = 'blockers', 
      agents = [], 
      context = 'auto', 
      urgency = 'normal' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalAgents = agents.length === 0 ? existingTeam.agents : agents;
    const finalContext = context === 'auto' ? this.detectContext(priority) : context;
    
    const focusPrompt = `TEAM FOCUS REDIRECT:

Priority: ${priority.toUpperCase()}
Urgency: ${urgency.toUpperCase()}
Project: ${project.name}
Working Directory: ${project.directory}

TARGET AGENTS: ${finalAgents.join(', ') || 'All active team members'}

FOCUS PARAMETERS:
- New Priority: ${priority}
- Context: ${finalContext}
- Urgency Level: ${urgency}
- Scope: ${this.getFocusScope(priority)}

FOCUS DIRECTIVE:
${this.getFocusDirective(priority, urgency, finalContext)}

COMMUNICATION PROTOCOL:
1. Send focused guidance to specified agents via chat
2. Maintain existing work context and communication chains
3. Provide specific actionable steps for priority area
4. Set clear success criteria and check-in schedules
5. Preserve ongoing work while shifting attention

CURRENT TEAM STATUS:
Active agents: ${existingTeam.agents.length}
Current skills: ${existingTeam.skills.join(', ') || 'general development'}
Theme: ${existingTeam.theme}

Execute focus redirect with clear guidance and maintained productivity.`;

    return this.createPromptResult(focusPrompt);
  }

  private detectContext(priority: string): string {
    const contexts = {
      'blockers': 'Workflow impediments need immediate resolution',
      'security': 'Security vulnerabilities require attention',
      'performance': 'Performance bottlenecks affecting user experience',
      'features': 'Feature development acceleration needed',
      'bugs': 'Critical bug fixes take priority',
      'specs': 'Specification completion required',
      'testing': 'Test coverage and quality assurance focus',
      'deployment': 'Release preparation and deployment readiness'
    };
    
    return contexts[priority] || 'Project priority shift required';
  }

  private getFocusScope(priority: string): string {
    const scopes = {
      'blockers': 'Identify and resolve immediate impediments',
      'security': 'Audit code, dependencies, and infrastructure',
      'performance': 'Profile, optimize, and benchmark improvements',
      'features': 'Complete priority features and user stories',
      'bugs': 'Triage, fix, and test critical issues',
      'specs': 'Complete requirements, design, and task specifications',
      'testing': 'Improve test coverage and quality metrics',
      'deployment': 'Prepare release checklist and deployment process'
    };
    
    return scopes[priority] || 'General project improvement';
  }

  private getFocusDirective(priority: string, urgency: string, context: string): string {
    const urgencyModifier = urgency === 'critical' ? 'IMMEDIATE ACTION REQUIRED' : 
                           urgency === 'high' ? 'HIGH PRIORITY' : 
                           urgency === 'low' ? 'WHEN TIME PERMITS' : 'STANDARD PRIORITY';
    
    const directives = {
      'blockers': `${urgencyModifier}: Stop current work and identify what's blocking progress. Report specific impediments and propose solutions.`,
      'security': `${urgencyModifier}: Conduct security review of recent changes. Check for vulnerabilities, audit dependencies, review access controls.`,
      'performance': `${urgencyModifier}: Profile application performance, identify bottlenecks, and implement optimizations. Measure before/after metrics.`,
      'features': `${urgencyModifier}: Focus on completing priority features. Review specs, implement efficiently, ensure quality standards.`,
      'bugs': `${urgencyModifier}: Triage bug reports, fix critical issues first, ensure comprehensive testing of fixes.`,
      'specs': `${urgencyModifier}: Complete all pending specifications. Ensure requirements, design, and task docs are thorough and approved.`,
      'testing': `${urgencyModifier}: Increase test coverage, improve test quality, automate testing processes where possible.`,
      'deployment': `${urgencyModifier}: Prepare for release. Update deployment scripts, documentation, and coordinate release checklist.`
    };
    
    return directives[priority] || `${urgencyModifier}: Shift focus to ${priority} as new team priority. ${context}`;
  }
}