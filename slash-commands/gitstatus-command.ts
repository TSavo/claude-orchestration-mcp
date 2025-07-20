#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class GitStatusCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      scope = 'all', 
      format = 'summary',
      includeRemote = true 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    const statusPrompt = `PROJECT STATUS REQUEST:

Scope: ${scope.toUpperCase()}
Format: ${format}
Include Remote: ${includeRemote}
Project: ${project.name}
Working Directory: ${project.directory}

STATUS ANALYSIS PROTOCOL:
1. GIT REPOSITORY STATUS:
   - Current branch and position relative to remote
   - Working directory status (modified, staged, untracked files)
   - Recent commit history and branch divergence
   - Remote tracking status and upstream configuration

2. TEAM STATUS OVERVIEW:
   ${this.getTeamStatusAnalysis(existingTeam.agents, scope)}

3. TEAM COMMUNICATION ANALYSIS:
   - Use read-chat agentName: "Orchestrator" limit: 50 to review recent team activity
   - Identify last status updates from each team member
   - Check for any unanswered questions or pending requests
   - Analyze communication patterns and team responsiveness

3. PROJECT HEALTH CHECK:
   - Spec completion and approval status
   - Recent development activity and velocity
   - Open issues and pull requests
   - Build and deployment status

4. BRANCH ANALYSIS:
   ${includeRemote ? '   - All local and remote branches with tracking status\n   - Branch ahead/behind analysis\n   - Stale branches requiring cleanup' : '   - Local branches only\n   - Current branch tracking status'}

GIT STATUS COMMANDS TO EXECUTE:
\`\`\`bash
# Core git status
git status --porcelain --branch
git log --oneline -10

# Branch information
git branch -vv
${includeRemote ? 'git branch -r' : ''}
git remote -v

# Repository health
git fsck --no-reflogs
git gc --prune=now

# Change analysis
git diff --stat
git diff --cached --stat

${includeRemote ? `# Remote comparison
git fetch origin
git log --oneline --graph --all -10` : ''}
\`\`\`

STATUS DASHBOARD:
${this.getStatusDashboard(format, scope)}

TEAM COORDINATION STATUS:
- Active team members: ${existingTeam.agents.join(', ') || 'None detected'}
- Team theme: ${existingTeam.theme}
- Available skills: ${existingTeam.skills.join(', ') || 'General development'}
- Communication health: Check chat activity and responsiveness

ACTIONABLE INSIGHTS:
${this.getActionableInsights(scope)}

RECOMMENDATIONS:
- Immediate actions required based on status
- Cleanup opportunities (stale branches, old files)
- Team coordination improvements
- Process optimization suggestions

Execute comprehensive status analysis with actionable recommendations.`;

    return this.createPromptResult(statusPrompt);
  }

  private getTeamStatusAnalysis(agents: string[], scope: string): string {
    if (agents.length === 0) {
      return '   - No active team detected - may need to assemble team\n   - Check for existing agent sessions and responsiveness\n   - Consider team deployment for active development';
    }

    const analyses = {
      'git': '   - Team member branch activity and commit patterns\n   - Individual contribution analysis\n   - Collaboration patterns and merge frequency',
      'agents': '   - Agent responsiveness and recent activity\n   - Task assignment and completion status\n   - Communication flow and timeout issues',
      'project': '   - Team workload distribution and capacity\n   - Spec assignment and completion progress\n   - Blocking issues and dependencies',
      'all': '   - Complete team health analysis across all dimensions\n   - Git activity, agent status, and project progress\n   - Team coordination effectiveness and bottlenecks'
    };
    
    return analyses[scope] || analyses['all'];
  }

  private getStatusDashboard(format: string, scope: string): string {
    const dashboards = {
      'summary': `📊 EXECUTIVE SUMMARY:
   - Repository: [Clean/Dirty] with [X] uncommitted changes
   - Branch: [current] ([ahead/behind] remote)
   - Team: [X] active agents, [theme] theme
   - Issues: [X] open, [X] critical
   - Recent: [X] commits in last 24h`,
      
      'detailed': `📋 DETAILED STATUS REPORT:
   - Git Repository Health and Branch Analysis
   - File Changes with Modification Details
   - Team Member Activity and Contribution Metrics
   - Issue and PR Status with Priority Assessment
   - Build and Deployment Pipeline Status`,
      
      'table': `┌─────────────────┬─────────────┬──────────────┐
│ Component       │ Status      │ Details      │
├─────────────────┼─────────────┼──────────────┤
│ Repository      │ [status]    │ [details]    │
│ Working Dir     │ [status]    │ [X] changes  │
│ Team            │ [status]    │ [X] agents   │
│ Issues          │ [status]    │ [X] open     │
└─────────────────┴─────────────┴──────────────┘`
    };
    
    return dashboards[format] || dashboards['summary'];
  }

  private getActionableInsights(scope: string): string {
    const insights = {
      'git': '- Uncommitted changes requiring attention\n- Branches needing merge or cleanup\n- Sync issues with remote repository',
      'agents': '- Silent agents requiring restart or attention\n- Overloaded agents needing work redistribution\n- Communication bottlenecks in team coordination',
      'project': '- Blocking issues preventing progress\n- Spec gaps requiring immediate attention\n- Resource allocation optimization opportunities',
      'all': '- Priority issues across all project dimensions\n- Team coordination improvements\n- Process optimization opportunities\n- Technical debt and cleanup tasks'
    };
    
    return insights[scope] || insights['all'];
  }
}