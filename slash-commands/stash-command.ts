#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class StashCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      action = 'save', 
      message = 'auto', 
      includeUntracked = false,
      index = 0
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    // Smart defaults
    const finalMessage = message === 'auto' ? `Work in progress - ${new Date().toISOString().slice(0, 16)}` : message;
    
    const stashPrompt = `GIT STASH REQUEST:

Action: ${action.toUpperCase()}
Message: ${finalMessage}
Include Untracked: ${includeUntracked}
Stash Index: ${index}
Project: ${project.name}
Working Directory: ${project.directory}

STASH WORKFLOW PROTOCOL:
1. PRE-STASH VALIDATION:
   - Check current working directory status
   - Verify there are changes to stash (for save operations)
   - Confirm stash exists (for pop/apply operations)
   - Review stash list for context

2. STASH OPERATION EXECUTION:
   ${this.getStashOperation(action, finalMessage, includeUntracked, index)}

3. POST-STASH VERIFICATION:
   - Verify working directory status after operation
   - Confirm stash was created/applied/removed as expected
   - Check for any conflicts or issues
   - Update team on significant stash operations

GIT COMMANDS TO EXECUTE:
\`\`\`bash
# Pre-operation status
git status --porcelain
git stash list

# Execute stash operation
${this.getStashCommands(action, finalMessage, includeUntracked, index)}

# Verify operation
git status
git stash list
\`\`\`

STASH MANAGEMENT:
${this.getStashManagement(action)}

TEAM COORDINATION:
- Notify team if stashing work that affects shared branches
- Document significant stashes for future reference
- Coordinate with team if stash contains collaborative work
- Ensure proper communication about temporary work storage

BEST PRACTICES:
- Use descriptive messages for stashes to aid future recovery
- Regularly clean up old stashes to maintain repository hygiene
- Consider creating feature branches instead of long-term stashing
- Communicate with team about stashed work that may affect them

Execute git stash operation with proper validation and team coordination.`;

    return this.createPromptResult(stashPrompt);
  }

  private getStashOperation(action: string, message: string, includeUntracked: boolean, index: number): string {
    const operations = {
      'save': `   - Save current working directory changes to stash
   - Use message: "${message}"
   - ${includeUntracked ? 'Include untracked files in stash' : 'Exclude untracked files'}
   - Clear working directory to clean state`,
      
      'pop': `   - Apply stash@{${index}} and remove it from stash list
   - Restore changes to working directory
   - Handle any merge conflicts if they occur
   - Update stash list after successful pop`,
      
      'apply': `   - Apply stash@{${index}} but keep it in stash list
   - Restore changes to working directory without removing stash
   - Allow for reuse of stash in multiple contexts
   - Handle any merge conflicts if they occur`,
      
      'drop': `   - Remove stash@{${index}} from stash list permanently
   - Permanently delete the stashed changes
   - Cannot be recovered after dropping
   - Clean up stash list organization`,
      
      'list': `   - Display all current stashes with indices and messages
   - Show stash creation dates and branch context
   - Help identify which stashes are still relevant
   - Provide overview of stashed work across project`,
      
      'clear': `   - Remove ALL stashes from the repository
   - Permanently delete all stashed changes
   - Reset stash list to empty state
   - Use with extreme caution - cannot be undone`
    };
    
    return operations[action] || operations['save'];
  }

  private getStashCommands(action: string, message: string, includeUntracked: boolean, index: number): string {
    const commands = {
      'save': `git stash push ${includeUntracked ? '-u ' : ''}-m "${message}"`,
      'pop': `git stash pop stash@{${index}}`,
      'apply': `git stash apply stash@{${index}}`,
      'drop': `git stash drop stash@{${index}}`,
      'list': 'git stash list --oneline',
      'clear': 'git stash clear'
    };
    
    return commands[action] || commands['save'];
  }

  private getStashManagement(action: string): string {
    if (action === 'save') {
      return `- Stash created for temporary work storage
- Use 'git stash pop' to restore when ready to continue
- Consider creating feature branch if work will be long-term
- Document stash purpose for team awareness`;
    } else if (action === 'pop' || action === 'apply') {
      return `- Work restored from stash storage
- Review restored changes before committing
- Resolve any conflicts that may have occurred
- Continue development from where you left off`;
    } else if (action === 'clear' || action === 'drop') {
      return `- Stash storage cleaned up
- Ensure no important work was accidentally removed
- Consider backing up significant stashes before cleanup
- Maintain clean stash list for better organization`;
    } else {
      return `- Stash list reviewed for current project status
- Identify stashes that may need action or cleanup
- Coordinate with team about shared or blocking stashes
- Plan stash resolution and cleanup strategy`;
    }
  }
}