#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class ReviewCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      scope = 'all', 
      depth = 'thorough', 
      reviewers = [], 
      format = 'actionable' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalReviewers = reviewers.length === 0 ? this.selectOptimalReviewers(scope, existingTeam.agents) : reviewers;
    
    const reviewPrompt = `PROJECT REVIEW REQUEST:

Scope: ${scope.toUpperCase()}
Depth: ${depth}
Format: ${format}
Project: ${project.name} (${project.type})
Working Directory: ${project.directory}

REVIEW TEAM: ${finalReviewers.join(', ') || 'Auto-assigned based on expertise'}

REVIEW PARAMETERS:
${this.getReviewScope(scope)}

REVIEW PROTOCOL:
1. Assign review tasks to appropriate team members based on expertise
2. Conduct systematic review according to scope and depth requirements
3. Document findings in ${format} format
4. Identify improvement opportunities and action items
5. Provide specific recommendations with priority levels
6. Create follow-up task assignments based on findings

DEPTH REQUIREMENTS:
${this.getDepthRequirements(depth)}

OUTPUT FORMAT:
${this.getFormatRequirements(format)}

CURRENT PROJECT CONTEXT:
Team: ${existingTeam.agents.join(', ')}
Skills available: ${existingTeam.skills.join(', ') || 'general development'}
Project type: ${project.type}

Execute comprehensive review with expert assignments and actionable outcomes.`;

    return this.createPromptResult(reviewPrompt);
  }

  private selectOptimalReviewers(scope: string, availableAgents: string[]): string[] {
    // Simple logic - in real implementation would match skills to scope
    if (scope === 'code' || scope === 'architecture') {
      return availableAgents.filter(agent => 
        agent.toLowerCase().includes('senior') || 
        agent.toLowerCase().includes('lead') ||
        availableAgents.indexOf(agent) < 2 // First 2 agents as fallback
      );
    }
    return availableAgents; // Use all for comprehensive reviews
  }

  private getReviewScope(scope: string): string {
    const scopes = {
      'code': '- Code quality, patterns, and maintainability\n- Security vulnerabilities and best practices\n- Performance optimization opportunities\n- Documentation completeness',
      'specs': '- Specification completeness and clarity\n- Requirements traceability\n- Design consistency and feasibility\n- Task breakdown accuracy',
      'team': '- Team productivity and collaboration\n- Communication effectiveness\n- Workload distribution\n- Skill gaps and development needs',
      'architecture': '- System design and scalability\n- Technology choices and dependencies\n- Integration patterns and APIs\n- Infrastructure and deployment strategy',
      'all': '- Complete project assessment across all areas\n- Code quality and architecture review\n- Specification and documentation audit\n- Team performance and process evaluation'
    };
    
    return scopes[scope] || scopes['all'];
  }

  private getDepthRequirements(depth: string): string {
    const depths = {
      'quick': '- High-level assessment focusing on critical issues\n- Rapid identification of major problems\n- Summary-level recommendations',
      'thorough': '- Detailed analysis of all components\n- Comprehensive issue identification\n- Specific improvement recommendations with examples',
      'deep': '- Exhaustive examination with detailed analysis\n- Root cause analysis for identified issues\n- Comprehensive action plan with implementation guidance'
    };
    
    return depths[depth] || depths['thorough'];
  }

  private getFormatRequirements(format: string): string {
    const formats = {
      'summary': '- Executive summary with key findings\n- High-level recommendations\n- Priority matrix for improvements',
      'detailed': '- Comprehensive report with analysis\n- Detailed findings with evidence\n- Step-by-step improvement plans',
      'actionable': '- Specific action items with owners\n- Implementation timelines and priorities\n- Success criteria and measurement methods'
    };
    
    return formats[format] || formats['actionable'];
  }
}