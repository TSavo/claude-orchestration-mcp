#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class MergeCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      source = 'current', 
      target = 'main', 
      strategy = 'merge', 
      deleteAfter = true,
      squash = false
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalSource = source === 'current' ? 'current branch' : source;
    
    const mergePrompt = `BRANCH MERGE REQUEST:

Source Branch: ${finalSource}
Target Branch: ${target}
Merge Strategy: ${strategy}
Delete After Merge: ${deleteAfter}
Squash Commits: ${squash}
Project: ${project.name}
Working Directory: ${project.directory}

MERGE WORKFLOW PROTOCOL:
1. PRE-MERGE VALIDATION:
   - Verify both branches exist and are up to date
   - Check for merge conflicts before proceeding
   - Ensure all tests pass on source branch
   - Confirm source branch work is complete and reviewed

2. MERGE PREPARATION:
   - Fetch latest changes from remote
   - Update target branch (${target}) to latest
   - Rebase or merge source branch with target if needed
   - Run final validation tests

3. MERGE EXECUTION:
   ${this.getMergeStrategy(strategy, squash)}

4. POST-MERGE CLEANUP:
   ${deleteAfter ? `   - Delete source branch locally and remotely
   - Clean up any associated feature flags or temporary configs
   - Update project tracking and issue status` : '   - Keep source branch for future reference\n   - Branch remains available for additional work'}

GIT COMMANDS TO EXECUTE:
\`\`\`bash
# Pre-merge validation
git fetch origin
git status --porcelain

# Update target branch
git checkout ${target}
git pull origin ${target}

# Check for conflicts
git merge-tree $(git merge-base ${finalSource === 'current branch' ? 'HEAD' : finalSource} ${target}) ${finalSource === 'current branch' ? 'HEAD' : finalSource} ${target}

# Execute merge based on strategy
${this.getMergeCommands(strategy, finalSource, target, squash)}

${deleteAfter ? `# Cleanup source branch
git branch -d ${finalSource === 'current branch' ? '$(git rev-parse --abbrev-ref HEAD)' : finalSource}
git push origin --delete ${finalSource === 'current branch' ? '$(git rev-parse --abbrev-ref HEAD)' : finalSource}` : ''}

# Verify merge success
git log --oneline -5
git status
\`\`\`

MERGE SAFETY CHECKS:
- Verify no conflicts exist before merge
- Ensure source branch is fully tested
- Confirm target branch is clean and up to date
- Validate merge doesn't break existing functionality

TEAM COORDINATION:
- Notify team of merge completion and any impacts
- Update project tracking with merged features
- Communicate any breaking changes or migrations needed
- Coordinate deployment if merging to release branch

CONFLICT RESOLUTION:
If conflicts detected:
1. Abort merge and notify team
2. Coordinate conflict resolution with source branch owner
3. Ensure proper testing after conflict resolution
4. Re-attempt merge after conflicts are resolved

Execute merge with comprehensive validation and team coordination.`;

    return this.createPromptResult(mergePrompt);
  }

  private getMergeStrategy(strategy: string, squash: boolean): string {
    const strategies = {
      'merge': squash ? 
        '   - Squash all commits into single commit for clean history\n   - Preserve original commit messages in squash commit body\n   - Create merge commit linking branches' :
        '   - Standard merge preserving commit history\n   - Create merge commit with both branch histories\n   - Maintain full development timeline',
      'rebase': '   - Rebase source branch onto target to create linear history\n   - Replay source commits on top of target branch\n   - No merge commit created - clean linear timeline',
      'fast-forward': '   - Fast-forward merge if possible (no divergent changes)\n   - Simply move target branch pointer forward\n   - Only works when target has no new commits'
    };
    
    return strategies[strategy] || strategies['merge'];
  }

  private getMergeCommands(strategy: string, source: string, target: string, squash: boolean): string {
    const sourceRef = source === 'current branch' ? 'HEAD' : source;
    
    if (strategy === 'rebase') {
      return `# Rebase strategy
git checkout ${sourceRef}
git rebase ${target}
git checkout ${target}
git merge ${sourceRef}`;
    } else if (strategy === 'fast-forward') {
      return `# Fast-forward strategy
git merge --ff-only ${sourceRef}`;
    } else {
      // Standard merge
      const squashFlag = squash ? '--squash' : '';
      return `# Standard merge strategy
git merge ${squashFlag} ${sourceRef}`;
    }
  }
}