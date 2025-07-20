#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class BranchCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      name = 'auto', 
      from = 'main', 
      checkout = true, 
      push = false,
      type = 'feature'
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalName = name === 'auto' ? this.generateBranchName(type) : name;
    
    const branchPrompt = `BRANCH CREATION REQUEST:

Branch Name: ${finalName}
Source Branch: ${from}
Auto Checkout: ${checkout}
Push to Remote: ${push}
Branch Type: ${type}
Project: ${project.name}
Working Directory: ${project.directory}

BRANCH WORKFLOW PROTOCOL:
1. PRE-BRANCH VALIDATION:
   - Check current working directory is clean
   - Verify source branch exists and is up to date
   - Ensure no uncommitted changes that would be lost
   - Confirm branch name follows naming conventions

2. BRANCH CREATION PROCESS:
   - Fetch latest changes from remote
   - Switch to source branch (${from}) and pull latest
   - Create new branch from source
   - ${checkout ? 'Automatically checkout new branch' : 'Stay on current branch'}
   - ${push ? 'Push new branch to remote with upstream tracking' : 'Keep branch local only'}

3. BRANCH NAMING CONVENTION:
   ${this.getBranchNaming(type, finalName)}

GIT COMMANDS TO EXECUTE:
\`\`\`bash
# Pre-branch validation
git status --porcelain
git fetch origin

# Update source branch
git checkout ${from}
git pull origin ${from}

# Create new branch
git checkout -b ${finalName}

${push ? `# Push to remote with upstream
git push -u origin ${finalName}` : '# Branch created locally only'}

# Verify branch creation
git branch --show-current
git status
\`\`\`

BRANCH CONTEXT:
- Purpose: ${this.getBranchPurpose(type)}
- Naming pattern: ${this.getNamingPattern(type)}
- Team coordination: ${this.getTeamCoordination(type, existingTeam.agents)}

TEAM NOTIFICATION:
- Notify team via chat about new branch creation
- Share branch purpose and expected work scope
- Coordinate if multiple team members will work on branch
- Set expectations for merge timeline

NEXT STEPS:
- Begin work on branch-specific tasks
- Commit changes regularly with descriptive messages
- Keep branch updated with ${from} to avoid conflicts
- Prepare for PR creation when work is complete

Execute branch creation with proper validation and team coordination.`;

    return this.createPromptResult(branchPrompt);
  }

  private generateBranchName(type: string): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefixes = {
      'feature': `feature/dev-work-${timestamp}`,
      'bugfix': `bugfix/issue-fix-${timestamp}`,
      'hotfix': `hotfix/critical-fix-${timestamp}`,
      'release': `release/v${timestamp}`,
      'experiment': `experiment/test-${timestamp}`
    };
    
    return prefixes[type] || prefixes['feature'];
  }

  private getBranchNaming(type: string, name: string): string {
    const conventions = {
      'feature': `   - Format: feature/description-or-ticket\n   - Example: feature/user-authentication, feature/JIRA-123\n   - Generated: ${name}`,
      'bugfix': `   - Format: bugfix/issue-description\n   - Example: bugfix/login-error, bugfix/issue-456\n   - Generated: ${name}`,
      'hotfix': `   - Format: hotfix/critical-issue\n   - Example: hotfix/security-patch, hotfix/production-down\n   - Generated: ${name}`,
      'release': `   - Format: release/version-number\n   - Example: release/v1.2.0, release/2024-q1\n   - Generated: ${name}`,
      'experiment': `   - Format: experiment/test-description\n   - Example: experiment/new-architecture, experiment/performance-test\n   - Generated: ${name}`
    };
    
    return conventions[type] || conventions['feature'];
  }

  private getBranchPurpose(type: string): string {
    const purposes = {
      'feature': 'New feature development and implementation',
      'bugfix': 'Bug fixes and issue resolution',
      'hotfix': 'Critical production fixes requiring immediate deployment',
      'release': 'Release preparation and version management',
      'experiment': 'Experimental work and proof-of-concepts'
    };
    
    return purposes[type] || purposes['feature'];
  }

  private getNamingPattern(type: string): string {
    const patterns = {
      'feature': 'feature/[description]',
      'bugfix': 'bugfix/[issue-description]', 
      'hotfix': 'hotfix/[critical-issue]',
      'release': 'release/[version]',
      'experiment': 'experiment/[test-name]'
    };
    
    return patterns[type] || patterns['feature'];
  }

  private getTeamCoordination(type: string, agents: string[]): string {
    if (type === 'hotfix') {
      return 'Notify all team members immediately - critical fix in progress';
    } else if (type === 'release') {
      return 'Coordinate with entire team - release branch affects everyone';
    } else {
      return `Standard coordination - notify ${agents.slice(0, 2).join(' and ')} of new development branch`;
    }
  }
}