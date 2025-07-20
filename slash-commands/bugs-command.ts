#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class BugsCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      state = 'open', 
      label = 'all', 
      assignee = 'all', 
      limit = 20,
      format = 'table'
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    const bugsPrompt = `GITHUB ISSUES REVIEW REQUEST:

State: ${state}
Label Filter: ${label}
Assignee Filter: ${assignee}
Limit: ${limit}
Format: ${format}
Project: ${project.name}
Working Directory: ${project.directory}

GITHUB ISSUES ANALYSIS PROTOCOL:
1. ISSUE RETRIEVAL using GitHub CLI:
   - Use: gh issue list --state ${state} --limit ${limit}
   ${label !== 'all' ? `   - Filter by label: --label "${label}"` : ''}
   ${assignee !== 'all' ? `   - Filter by assignee: --assignee "${assignee}"` : ''}
   - Include metadata: --json number,title,state,labels,assignees,createdAt,updatedAt

2. ISSUE ANALYSIS:
   - Categorize issues by severity and priority
   - Identify stale issues requiring attention
   - Group by assignee and current workload
   - Highlight critical issues needing immediate action

3. TEAM WORKLOAD ASSESSMENT:
   - Map issues to current team members: ${existingTeam.agents.join(', ')}
   - Identify unassigned critical issues
   - Assess team capacity for new bug fixes
   - Highlight blocking issues affecting current work

4. PRIORITY MATRIX:
   - Critical/High priority issues requiring immediate attention
   - Medium priority issues for current sprint planning
   - Low priority issues for backlog management
   - Stale issues needing closure or escalation

GITHUB COMMANDS TO EXECUTE:
\`\`\`bash
# List issues with filters
gh issue list \\
  --state ${state} \\
  --limit ${limit} \\
  ${label !== 'all' ? `--label "${label}" \\` : ''}
  ${assignee !== 'all' ? `--assignee "${assignee}" \\` : ''}
  --json number,title,state,labels,assignees,createdAt,updatedAt

# Get detailed view of critical issues
gh issue list --label "severity:critical" --state open --json number,title,body,labels

# Check team-specific assignments
${existingTeam.agents.map(agent => `gh issue list --assignee "${agent}" --state open`).join('\n')}
\`\`\`

OUTPUT FORMAT: ${this.getOutputFormat(format)}

ACTIONABLE ANALYSIS:
- Issues requiring immediate team attention
- Workload distribution across team members
- Stale issues needing resolution or closure
- Critical blockers affecting current development
- Recommendations for issue triage and assignment

TEAM COORDINATION:
- Notify team members of their assigned issues
- Escalate critical unassigned issues
- Update team on overall bug status and trends
- Coordinate bug fix priorities with current sprint work

Execute comprehensive GitHub issues review with team workload analysis and actionable priorities.`;

    return this.createPromptResult(bugsPrompt);
  }

  private getOutputFormat(format: string): string {
    const formats = {
      'table': 'Formatted table with columns: Number, Title, Severity, Assignee, Age, Status',
      'list': 'Ordered list with issue summaries and priority indicators',
      'dashboard': 'Comprehensive dashboard with charts, metrics, and trend analysis',
      'summary': 'Executive summary with key metrics and critical issue highlights'
    };
    
    return formats[format] || formats['table'];
  }
}