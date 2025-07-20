#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class PushCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      message = 'auto', 
      branch = 'current', 
      force = false, 
      scope = 'staged' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalMessage = message === 'auto' ? this.generateCommitMessage() : message;
    const finalBranch = branch === 'current' ? 'current working branch' : branch;
    
    const pushPrompt = `GIT PUSH WORKFLOW REQUEST:

Commit Message: ${finalMessage}
Target Branch: ${finalBranch}
Force Push: ${force}
Scope: ${scope}
Project: ${project.name}
Working Directory: ${project.directory}

GIT WORKFLOW PROTOCOL:
1. PRE-COMMIT VALIDATION:
   - Check working directory is clean or has staged changes
   - Verify no merge conflicts or rebase issues
   - Run quick syntax/lint checks if available
   - Ensure no secrets or sensitive data in changes

2. STAGING AND COMMIT PROCESS:
   ${this.getStagingProcess(scope)}
   
3. COMMIT MESSAGE GENERATION:
   ${finalMessage === 'auto' ? this.getAutoCommitMessage() : `Use provided message: "${finalMessage}"`}

4. PUSH EXECUTION:
   - Check current branch status and upstream configuration
   - Execute push with appropriate flags
   - Handle any push failures or conflicts
   - Verify successful push completion

GIT COMMANDS TO EXECUTE:
\`\`\`bash
# Pre-push validation
git status --porcelain
git diff --name-only HEAD

# Staging process
${this.getStagingCommands(scope)}

# Commit with message
git commit -m "${finalMessage}"

# Push to remote
${force ? 'git push --force-with-lease origin HEAD' : 'git push origin HEAD'}

# Verify push success
git log --oneline -1
git status
\`\`\`

SAFETY CHECKS:
- Verify no uncommitted critical changes left behind
- Check push was successful and branch is up to date
- Ensure team members are notified of significant changes
- Validate CI/CD pipeline triggers if applicable

TEAM COORDINATION:
- Notify team via chat about significant commits
- Update project tracking with completed work
- Coordinate with team if this affects shared branches
- Alert about any breaking changes or migrations

RISK MITIGATION:
${force ? '⚠️ FORCE PUSH ENABLED - Use with extreme caution\n- Verify no one else is working on this branch\n- Consider impact on shared history' : '✅ Safe push mode - no history rewriting'}

Execute git workflow with proper validation and team coordination.`;

    return this.createPromptResult(pushPrompt);
  }

  private getStagingProcess(scope: string): string {
    const processes = {
      'staged': '   - Use existing staged changes (git status to verify)\n   - Commit only what has been explicitly staged\n   - Preserve unstaged changes for future commits',
      'all': '   - Stage all modified files (git add -A)\n   - Include new, modified, and deleted files\n   - Commit entire working directory state',
      'modified': '   - Stage only modified files (git add -u)\n   - Exclude new untracked files\n   - Preserve untracked files in working directory',
      'interactive': '   - Use interactive staging (git add -p)\n   - Review each change before staging\n   - Allow selective staging of file portions'
    };
    
    return processes[scope] || processes['staged'];
  }

  private getStagingCommands(scope: string): string {
    const commands = {
      'staged': '# Use existing staged changes\ngit diff --cached --name-only',
      'all': 'git add -A',
      'modified': 'git add -u',
      'interactive': 'git add -p'
    };
    
    return commands[scope] || commands['staged'];
  }

  private generateCommitMessage(): string {
    return 'feat: Auto-generated commit from development team\n\nImplemented changes as part of current development cycle.\nReview commit details for specific modifications.';
  }

  private getAutoCommitMessage(): string {
    return `   - Analyze staged changes to determine commit type (feat/fix/docs/refactor)
   - Generate descriptive commit message based on file changes
   - Follow conventional commit format: type(scope): description
   - Include body with more details if significant changes detected`;
  }
}