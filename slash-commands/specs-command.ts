#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class SpecsCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      view = 'progress', 
      filter = 'all', 
      format = 'dashboard' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    const specsPrompt = `SPECIFICATION STATUS REVIEW:

View Type: ${view.toUpperCase()}
Filter: ${filter}
Format: ${format}
Project: ${project.name}
Working Directory: ${project.directory}

SPECS ANALYSIS PROTOCOL:
1. SPECS DIRECTORY SCAN:
   - Scan specs/ directory for all specification files
   - Identify spec categories: project-overview, existing-features, proposed-features
   - Check for requirements.md, design.md, and tasks.md in each spec folder
   - Analyze spec completion status and quality

2. COMPLETION ASSESSMENT:
${this.getCompletionAnalysis(view, filter)}

3. QUALITY VALIDATION:
   - Check EARS syntax compliance in requirements.md files
   - Verify design completeness and implementation feasibility
   - Validate task breakdown with proper checkbox tracking
   - Assess spec approval status and PM review completion

4. GAP IDENTIFICATION:
   - Identify missing specifications for existing features
   - Find incomplete spec phases (missing design or tasks files)
   - Highlight specs requiring PM or stakeholder approval
   - Note dependencies between specs that affect implementation order

5. PROGRESS TRACKING:
${this.getProgressTracking(format)}

TEAM CONTEXT:
Current team: ${existingTeam.agents.join(', ')}
Skills available: ${existingTeam.skills.join(', ') || 'general development'}
Theme: ${existingTeam.theme}

ACTIONABLE OUTPUTS:
${this.getActionableOutputs(view, filter)}

SPEC QUALITY CRITERIA:
- Requirements: EARS syntax, clear acceptance criteria, user stories
- Design: Technical architecture, implementation approach, code examples
- Tasks: Hierarchical breakdown, checkbox tracking, time estimates

Execute comprehensive specs analysis with detailed status reporting and next steps.`;

    return this.createPromptResult(specsPrompt);
  }

  private getCompletionAnalysis(view: string, filter: string): string {
    const analyses = {
      'summary': '   - High-level overview of spec completion rates\n   - Count of complete vs incomplete specs\n   - Identification of critical gaps',
      'detailed': '   - File-by-file analysis of each specification\n   - Line-by-line completeness assessment\n   - Quality scoring for each spec component',
      'gaps': '   - Focus specifically on missing or incomplete specifications\n   - Identify features lacking proper documentation\n   - Highlight approval bottlenecks and blockers',
      'progress': '   - Completion percentage for each spec phase\n   - Task checkbox completion tracking\n   - Implementation readiness assessment\n   - Team assignment and ownership mapping'
    };
    
    const filterModifier = {
      'incomplete': ' (Focus only on incomplete or partial specs)',
      'ready': ' (Focus only on specs ready for implementation)',
      'blocked': ' (Focus only on specs waiting for approval or blocked)',
      'all': ' (Include all specs regardless of status)'
    };
    
    return (analyses[view] || analyses['progress']) + (filterModifier[filter] || '');
  }

  private getProgressTracking(format: string): string {
    const tracking = {
      'table': '   - Generate tabular view with columns: Spec Name, Requirements %, Design %, Tasks %, Status\n   - Sort by completion percentage and priority\n   - Include assigned team member and estimated effort',
      'list': '   - Create ordered list of specs with completion indicators\n   - Use visual markers (✓, ⚠, ✗) for status representation\n   - Include brief description and next steps for each spec',
      'dashboard': '   - Comprehensive dashboard with multiple views\n   - Progress bars for each spec phase completion\n   - Status indicators and trend analysis\n   - Team workload distribution and capacity planning'
    };
    
    return tracking[format] || tracking['dashboard'];
  }

  private getActionableOutputs(view: string, filter: string): string {
    const baseOutputs = `- Prioritized list of specs requiring immediate attention
- Team member assignments for incomplete specifications
- Dependency analysis showing spec implementation order
- Timeline recommendations for spec completion`;

    const viewOutputs = {
      'gaps': '\n- Specific missing specifications that need creation\n- Templates and examples for rapid spec development\n- Resource allocation recommendations for gap filling',
      'progress': '\n- Completion percentage dashboard with trend analysis\n- Bottleneck identification and resolution strategies\n- Capacity planning for upcoming spec work',
      'detailed': '\n- Quality improvement recommendations for each spec\n- Specific editing tasks and improvement opportunities\n- Best practice examples and templates'
    };

    const filterOutputs = {
      'blocked': '\n- Escalation procedures for approval bottlenecks\n- Alternative approaches to unblock stalled specs\n- Stakeholder communication templates',
      'ready': '\n- Implementation priority recommendations\n- Team assignment suggestions for ready specs\n- Coordination protocols for parallel development'
    };

    return baseOutputs + (viewOutputs[view] || '') + (filterOutputs[filter] || '');
  }
}