#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class CloneCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      url = '', 
      directory = 'auto', 
      branch = 'main', 
      depth = 0,
      setupTeam = true
    } = args;

    const existingTeam = this.detectExistingTeam();
    
    // Smart defaults
    const finalDirectory = directory === 'auto' ? this.extractRepoName(url) : directory;
    
    const clonePrompt = `REPOSITORY CLONE REQUEST:

Repository URL: ${url}
Target Directory: ${finalDirectory}
Branch: ${branch}
Clone Depth: ${depth === 0 ? 'Full history' : `Shallow clone (${depth} commits)`}
Setup Team: ${setupTeam}

CLONE WORKFLOW PROTOCOL:
1. PRE-CLONE VALIDATION:
   - Verify repository URL is accessible
   - Check target directory doesn't already exist
   - Ensure sufficient disk space for repository
   - Validate Git credentials and access permissions

2. CLONE EXECUTION:
   - Clone repository with specified parameters
   - Checkout target branch if different from default
   - Initialize submodules if present
   - Set up remote tracking configuration

3. POST-CLONE SETUP:
   ${this.getPostCloneSetup(setupTeam, finalDirectory)}

GIT COMMANDS TO EXECUTE:
\`\`\`bash
# Pre-clone validation
test ! -d "${finalDirectory}" || echo "Directory already exists"
git ls-remote "${url}" HEAD

# Clone repository
${this.getCloneCommand(url, finalDirectory, branch, depth)}

# Navigate to repository
cd "${finalDirectory}"

# Verify clone success
git status
git remote -v
git branch -a

${setupTeam ? `# Project initialization
npm install 2>/dev/null || pip install -r requirements.txt 2>/dev/null || echo "No package manager files found"

# Check for existing specs
ls -la specs/ 2>/dev/null || echo "No specs directory found"` : ''}
\`\`\`

REPOSITORY ANALYSIS:
- Project type detection from files and structure
- Existing documentation and setup instructions
- Development dependencies and build requirements
- Team collaboration tools and workflows

${setupTeam ? `TEAM DEPLOYMENT RECOMMENDATION:
After successful clone, consider:
1. Run /init to analyze codebase and create specs
2. Run /deploy to set up development team
3. Review existing issues with /bugs
4. Set up development workflow with team

AUTOMATIC TEAM SETUP:
- Analyze repository structure and complexity
- Recommend optimal team template based on project type
- Brief team on existing codebase and development practices
- Establish communication protocols for new project` : ''}

POST-CLONE CHECKLIST:
- [ ] Repository cloned successfully
- [ ] Dependencies installed and project buildable
- [ ] Team has access to repository and development environment
- [ ] Development workflow and contribution guidelines understood
- [ ] Initial project analysis and spec creation completed

Execute repository clone with comprehensive setup and team coordination.`;

    return this.createPromptResult(clonePrompt);
  }

  private extractRepoName(url: string): string {
    if (!url) return 'repository';
    
    // Extract repo name from GitHub URL
    const match = url.match(/\/([^\/]+?)(?:\.git)?$/);
    return match ? match[1] : 'repository';
  }

  private getCloneCommand(url: string, directory: string, branch: string, depth: number): string {
    let command = `git clone`;
    
    if (depth > 0) {
      command += ` --depth ${depth}`;
    }
    
    if (branch !== 'main') {
      command += ` --branch ${branch}`;
    }
    
    command += ` "${url}" "${directory}"`;
    
    return command;
  }

  private getPostCloneSetup(setupTeam: boolean, directory: string): string {
    if (!setupTeam) {
      return '   - Basic repository validation and structure analysis\n   - Check for README and setup instructions\n   - Verify repository integrity and remote configuration';
    }

    return `   - Comprehensive project analysis and documentation review
   - Development environment setup and dependency installation
   - Team coordination setup with communication protocols
   - Initial codebase assessment for team deployment planning
   
   TEAM INTEGRATION:
   - Change working directory to: ${directory}
   - Run project initialization and spec creation
   - Deploy appropriate team template based on project analysis
   - Establish development workflow and task assignment protocols`;
  }
}