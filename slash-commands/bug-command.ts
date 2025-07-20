#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class BugCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      title = 'auto', 
      severity = 'medium', 
      assignee = 'auto', 
      labels = [], 
      description = 'auto' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalTitle = title === 'auto' ? 'Auto-generated bug report from development team' : title;
    const finalAssignee = assignee === 'auto' ? this.selectBugAssignee(severity, existingTeam.agents) : assignee;
    const finalLabels = labels.length === 0 ? this.generateBugLabels(severity, project.type) : labels;
    const finalDescription = description === 'auto' ? 'Please provide detailed bug description' : description;
    
    const bugPrompt = `GITHUB ISSUE CREATION REQUEST:

Issue Type: Bug Report
Title: ${finalTitle}
Severity: ${severity}
Project: ${project.name} (${project.type})
Working Directory: ${project.directory}

GITHUB ISSUE PROTOCOL:
1. ISSUE CREATION using GitHub CLI:
   - Use: gh issue create --title "${finalTitle}" --body "[detailed description]"
   - Add labels: ${finalLabels.join(', ')}
   - Assign to: ${finalAssignee}
   - Set project and milestone if applicable

2. BUG REPORT TEMPLATE:
   **Bug Description:**
   ${finalDescription}
   
   **Severity:** ${severity}
   
   **Environment:**
   - Project: ${project.name}
   - Type: ${project.type}
   - Directory: ${project.directory}
   - Team: ${existingTeam.agents.join(', ')}
   
   **Steps to Reproduce:**
   [To be filled based on current context]
   
   **Expected Behavior:**
   [To be described]
   
   **Actual Behavior:**
   [To be described]
   
   **Additional Context:**
   - Reporter: Development team
   - Detection method: ${this.getDetectionMethod(severity)}
   - Impact assessment: ${this.getImpactAssessment(severity)}

3. ISSUE METADATA:
   - Labels: ${finalLabels.join(', ')}
   - Assignee: ${finalAssignee}
   - Priority: ${this.getPriorityLevel(severity)}
   - Team notification: ${existingTeam.theme} team

4. TEAM COORDINATION:
   - Notify assigned team member via chat
   - Update project tracking with new issue
   - Assess impact on current sprint/work
   - Determine if immediate attention required

GITHUB COMMANDS TO EXECUTE:
\`\`\`bash
# Create the issue
gh issue create \\
  --title "${finalTitle}" \\
  --body "$(cat <<'EOF'
[Generated bug report with template above]
EOF
)" \\
  --label "${finalLabels.join(',')}" \\
  --assignee "${finalAssignee}"

# Link to project if applicable
gh issue edit [issue-number] --add-project "[project-name]"
\`\`\`

FOLLOW-UP ACTIONS:
- Send chat notification to assigned team member
- Update team on bug severity and priority
- Coordinate immediate response if critical
- Track resolution progress and updates

Execute GitHub issue creation with comprehensive bug documentation and team coordination.`;

    return this.createPromptResult(bugPrompt);
  }

  private selectBugAssignee(severity: string, agents: string[]): string {
    if (agents.length === 0) return 'auto';
    
    // For critical bugs, assign to lead/senior
    if (severity === 'critical' || severity === 'high') {
      const lead = agents.find(agent => 
        agent.toLowerCase().includes('lead') || 
        agent.toLowerCase().includes('senior')
      );
      if (lead) return lead;
    }
    
    // Default to first available agent
    return agents[0] || 'auto';
  }

  private generateBugLabels(severity: string, projectType: string): string[] {
    const labels = ['bug'];
    
    // Add severity label
    labels.push(`severity:${severity}`);
    
    // Add project type label
    if (projectType.includes('React')) labels.push('frontend');
    else if (projectType.includes('API')) labels.push('backend');
    else if (projectType.includes('Node')) labels.push('javascript');
    else if (projectType.includes('Python')) labels.push('python');
    
    // Add priority based on severity
    if (severity === 'critical') labels.push('priority:urgent');
    else if (severity === 'high') labels.push('priority:high');
    else labels.push('priority:normal');
    
    return labels;
  }

  private getDetectionMethod(severity: string): string {
    const methods = {
      'critical': 'Production monitoring or user reports',
      'high': 'Testing or code review',
      'medium': 'Development team discovery',
      'low': 'Code analysis or routine testing'
    };
    
    return methods[severity] || methods['medium'];
  }

  private getImpactAssessment(severity: string): string {
    const impacts = {
      'critical': 'System down or major functionality broken',
      'high': 'Significant feature impact or user experience degradation',
      'medium': 'Moderate functionality issue with workarounds available',
      'low': 'Minor issue with minimal user impact'
    };
    
    return impacts[severity] || impacts['medium'];
  }

  private getPriorityLevel(severity: string): string {
    const priorities = {
      'critical': 'P0 - Immediate fix required',
      'high': 'P1 - Fix within 24 hours',
      'medium': 'P2 - Fix within current sprint',
      'low': 'P3 - Fix when convenient'
    };
    
    return priorities[severity] || priorities['medium'];
  }
}