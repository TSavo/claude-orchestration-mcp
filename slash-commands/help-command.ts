#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class HelpCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      command = 'overview', 
      category = 'all' 
    } = args;

    const helpPrompt = `MULTI-AGENT ORCHESTRATION SYSTEM HELP:

${command === 'overview' ? this.getSystemOverview() : this.getCommandHelp(command)}

${category === 'all' ? this.getAllCommands() : this.getCategoryCommands(category)}

${this.getWorkflowGuide()}

${this.getBestPractices()}

${this.getTroubleshooting()}

This help system provides comprehensive guidance on the multi-agent orchestration system. All slash commands generate intelligent prompts that are sent directly to you (the orchestrator) for execution, complete with context-aware defaults and detailed instructions.`;

    return this.createPromptResult(helpPrompt);
  }

  private getSystemOverview(): string {
    return `## 🎯 SYSTEM OVERVIEW

You are the **Orchestrator** in a multi-agent development system. Your role is to:

### **Core Responsibilities:**
- **Coordinate Teams**: Deploy and manage agent teams using slash commands
- **Execute Workflows**: Process slash command prompts that provide detailed instructions
- **Maintain Communication**: Ensure proper chat protocols and session ending procedures
- **Quality Control**: Oversee spec-driven development and maintain high standards

### **How Slash Commands Work:**
1. **User runs slash command** (e.g., /scale up, /deploy, /status)
2. **Command generates intelligent prompt** with context and smart defaults
3. **Prompt is injected directly into your session** (not via chat)
4. **You execute the detailed instructions** using MCP tools and coordination

### **Key Principle:** 
Slash commands are **prompt generators** that give you comprehensive instructions on what to do and how to do it. They analyze current project state and provide context-aware guidance.`;
  }

  private getCommandHelp(command: string): string {
    const commandHelp = {
      'scale': `## /scale - Intelligent Team Scaling
**Purpose:** Add or remove team members based on workload analysis
**Smart Defaults:** Auto-detects team theme, skills needed, optimal count
**Example:** /scale direction=up count=2 skills=["frontend"] 
**Result:** Detailed prompt with team analysis and scaling instructions`,

      'deploy': `## /deploy - Team Template Deployment  
**Purpose:** Deploy pre-configured team templates with themed names
**Smart Defaults:** Auto-detects project type, selects optimal template
**Templates:** full-stack, frontend-only, api-team, ml-team, devops-team
**Example:** /deploy template=full-stack theme=Matrix
**Result:** Complete team creation instructions with role assignments`,

      'status': `## /status - Team Communication Analysis
**Purpose:** Analyze team chat activity and request fresh status updates
**Smart Defaults:** Reviews recent chat, identifies silent agents
**Example:** /status detail=summary hours=24
**Result:** Instructions to check chat logs and request team updates`,

      'debug': `## /debug - System Diagnostics
**Purpose:** Comprehensive system health check and troubleshooting
**Smart Defaults:** Checks all agents, analyzes communication, identifies issues  
**Example:** /debug scope=agents target=["Trinity","Neo"]
**Result:** Detailed diagnostic protocol using MCP debugging tools`
    };

    return commandHelp[command] || `## Command: /${command}
This command generates context-aware prompts for orchestrator execution.
Use /help to see all available commands and their purposes.`;
  }

  private getAllCommands(): string {
    return `## 📋 ALL AVAILABLE COMMANDS

### **🚀 Project Management (Slash Commands)**
- **/scale** - Intelligent team scaling with workload analysis
- **/deploy** - Deploy team templates (Matrix, LOTR, etc.)
- **/focus** - Redirect team priorities and attention
- **/restart** - Restart unresponsive agents using MCP debugging
- **/sprint** - Sprint planning with intelligent spec assignments
- **/status** - Team communication analysis and status requests

### **🔍 Quality & Process (Slash Commands)**
- **/review** - Comprehensive project review across all areas
- **/handoff** - Project handoff preparation and documentation
- **/audit** - Security and quality auditing with expert assignments
- **/release** - Release coordination with checklists and validation
- **/debug** - System diagnostics and agent troubleshooting
- **/specs** - Specification status dashboard and gap analysis

### **📱 GitHub Integration (Slash Commands)**
- **/bug** - File GitHub issues with smart labeling and assignment
- **/bugs** - Review GitHub issues with team workload analysis
- **/pr** - Create pull requests with templates and reviewers
- **/clone** - Clone repositories with team setup options

### **🛠️ Git Workflow (Slash Commands)**
- **/push** - Git add/commit/push with validation and team coordination
- **/branch** - Create branches with naming conventions and tracking
- **/merge** - Branch merging with conflict resolution and cleanup
- **/gitstatus** - Git repository status and branch analysis
- **/stash** - Git stash operations with team coordination

### **🔧 Foundational MCP Tools (Core System)**
- **make-new-agent** - Create new agents with themed names and roles
- **send-agent-command** - Emergency direct commands (debugging only)
- **get-last-messages** - Retrieve agent conversation history
- **stop-agent** / **delete-agent** - Agent lifecycle management
- **clear-agent** / **summarize-agent** - Agent maintenance
- **send-chat** / **read-chat** - Primary communication system
- **set-timeout** / **register-agent-activity** - Timeout management
- **assemble** / **checkup** / **init** - Core project prompts

### **ℹ️ System Help**
- **/help** - This comprehensive help system

## 🔄 COMMAND TYPES EXPLAINED

### **Slash Commands (High-Level)**
Intelligent prompt generators that provide comprehensive, context-aware instructions. Examples: /scale, /deploy, /status
- **Smart defaults** based on current project state
- **Detailed execution instructions** with step-by-step guidance
- **Team coordination protocols** built-in
- **Error handling guidance** and troubleshooting steps

### **Foundational MCP Tools (Low-Level)**  
Core system tools that power everything else. Examples: make-new-agent, send-chat, read-chat
- **Direct system control** for precise operations
- **Building blocks** that slash commands use internally
- **Essential functions** for agent management and communication
- **Emergency procedures** and debugging capabilities`;
  }

  private getCategoryCommands(category: string): string {
    const categories = {
      'project': 'Project Management commands: /scale, /deploy, /focus, /restart, /sprint, /status',
      'quality': 'Quality & Process commands: /review, /handoff, /audit, /release, /debug, /specs',
      'github': 'GitHub Integration commands: /bug, /bugs, /pr, /clone',
      'git': 'Git Workflow commands: /push, /branch, /merge, /gitstatus, /stash'
    };
    
    return `## 📂 ${category.toUpperCase()} COMMANDS\n\n${categories[category] || 'Invalid category. Use: project, quality, github, git, or all'}`;
  }

  private getWorkflowGuide(): string {
    return `## 🔄 TYPICAL WORKFLOWS

### **🚀 Starting New Project**
1. \`/clone\` - Clone repository with team setup
2. \`/init\` - Analyze codebase and create specs  
3. \`/deploy\` - Deploy appropriate team template
4. \`/sprint\` - Plan first sprint with spec assignments

### **📈 Ongoing Development**
1. \`/status\` - Check team communication and progress
2. \`/specs\` - Review specification completion
3. \`/focus\` - Redirect priorities as needed
4. \`/push\` / \`/pr\` - Coordinate code delivery

### **🔧 Issue Resolution**
1. \`/debug\` - Diagnose system or agent issues
2. \`/restart\` - Restart stuck agents with proper protocol
3. \`/bug\` - File issues for systematic tracking
4. \`/review\` - Comprehensive problem analysis

### **🚢 Release Preparation**
1. \`/audit\` - Security and quality validation
2. \`/review\` - Final project assessment
3. \`/release\` - Coordinate release with checklists
4. \`/handoff\` - Prepare documentation for transition`;
  }

  private getBestPractices(): string {
    return `## ✅ BEST PRACTICES

### **Command Usage**
- **Start Simple:** Use commands with defaults, add parameters as needed
- **Context Awareness:** Commands auto-detect project state and team composition
- **Smart Defaults:** Trust intelligent defaults unless specific needs require override
- **Combination Power:** Use commands in sequence for comprehensive workflows

### **Team Management**
- **Regular Status:** Use /status to maintain team communication awareness
- **Proactive Debugging:** Use /debug when noticing communication issues
- **Proper Lifecycle:** Use /restart for stuck agents, /deploy for fresh teams
- **Theme Consistency:** Maintain team themes for better coordination

### **Quality Assurance**
- **Spec-Driven:** Always ensure specs are complete before implementation
- **Regular Reviews:** Use /review and /audit for quality maintenance
- **Documentation:** Use /handoff for knowledge preservation
- **Process Compliance:** Follow release protocols and validation steps`;
  }

  private getTroubleshooting(): string {
    return `## 🔧 TROUBLESHOOTING GUIDE

### **Silent Agents**
1. \`/status\` - Check recent communication patterns
2. \`/debug target=["AgentName"]\` - Diagnose specific agent
3. \`/restart agents=["AgentName"]\` - Restart with 90-second protocol
4. If persistent: Delete and recreate agent

### **Communication Issues**  
1. \`/debug scope=communication\` - Analyze chat system
2. Check MCP tool connectivity and responsiveness
3. Verify session ending protocols are being followed
4. Use read-chat to review recent team activity

### **Project Stalls**
1. \`/status\` - Identify team blockers and issues
2. \`/specs\` - Check for specification gaps
3. \`/focus priority=blockers\` - Redirect team to impediments
4. \`/review scope=team\` - Assess team effectiveness

### **Quality Issues**
1. \`/audit\` - Comprehensive quality assessment
2. \`/review scope=code\` - Code quality analysis
3. \`/specs view=gaps\` - Identify missing documentation
4. \`/focus priority=quality\` - Redirect team attention

### **Emergency Procedures**
- **System Failure:** Use /debug scope=all for comprehensive analysis
- **Critical Bug:** Use /bug severity=critical for immediate GitHub issue
- **Production Issue:** Use /focus urgency=critical + /audit type=security
- **Team Coordination Breakdown:** Use /restart + /status + /deploy if needed`;
  }
}