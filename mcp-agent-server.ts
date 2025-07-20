#!/usr/bin/env npx tsx

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
// import { z } from 'zod'; // Currently unused
import { join } from 'path';
import { SessionManager } from './claude-session.js';
import { sharedChat } from './shared-chat.js';
import { foundationalTools } from './mcp-tools/index.js';
import { CommandRegistry } from './slash-commands/command-registry.js';

export class MCPAgentServer {
  private server: Server;
  private sessionManager: SessionManager;
  private commandRegistry: CommandRegistry;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.commandRegistry = new CommandRegistry(sessionManager);
    this.server = new Server(
      {
        name: "claude-agent-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools(): void {
    // Register all tools (foundational tools + slash command prompt generators)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Foundational MCP Tools
        ...foundationalTools,
        
        // Slash Command Prompt Generators (these return prompt strings, not execute directly)
        {
          name: "scale",
          description: "Intelligently scale team up or down based on workload and bottlenecks. SMART DEFAULTS: Auto-detects existing team theme, skill gaps, and optimal team size. BEHAVIOR: Analyzes current team capacity, identifies bottlenecks, and adds/removes agents with appropriate skills while maintaining team cohesion.",
          inputSchema: {
            type: "object",
            properties: {
              direction: { type: "string", enum: ["up", "down"], description: "Scale direction - up to add agents, down to remove", default: "up" },
              count: { type: "number", description: "Number of agents to add/remove - auto-detects optimal count if not specified", default: 0 },
              skills: { type: "array", items: { type: "string" }, description: "Specific skills needed - auto-detects from bottlenecks if not specified", default: [] },
              theme: { type: "string", description: "Team theme for new agents - uses existing team theme if not specified", default: "existing" },
              reason: { type: "string", description: "Reason for scaling - helps with agent briefing", default: "workload-optimization" }
            }
          }
        },
        {
          name: "deploy",
          description: "Deploy pre-configured team templates instantly. SMART DEFAULTS: Uses existing project structure, detects optimal template, maintains current theme. TEMPLATES: full-stack, frontend-only, api-team, ml-team, devops-team. BEHAVIOR: Creates complete team with appropriate roles and immediately briefs them on project context.",
          inputSchema: {
            type: "object",
            properties: {
              template: { type: "string", enum: ["full-stack", "frontend-only", "api-team", "ml-team", "devops-team", "auto"], description: "Team template - auto-detects from codebase if not specified", default: "auto" },
              theme: { type: "string", description: "Team theme (Matrix, LOTR, StarWars, Cyberpunk, etc.) - uses existing or auto-selects", default: "auto" },
              project: { type: "string", description: "Project name - uses current directory name if not specified", default: "current" },
              lead: { type: "string", description: "Team lead name - auto-generates themed name if not specified", default: "auto" },
              workingDirectory: { type: "string", description: "Project directory - uses current directory if not specified", default: "current" }
            }
          }
        },
        {
          name: "focus",
          description: "Refocus existing team on specific priorities or areas. SMART DEFAULTS: Targets all active agents, auto-detects urgent priorities, maintains current project context. BEHAVIOR: Sends focused guidance to team while preserving ongoing work and communication chains.",
          inputSchema: {
            type: "object",
            properties: {
              priority: { type: "string", description: "What to focus on - blockers, security, performance, features, bugs, etc.", default: "blockers" },
              agents: { type: "array", items: { type: "string" }, description: "Specific agents to focus - uses all active agents if not specified", default: [] },
              context: { type: "string", description: "Why this focus shift - auto-detects from recent activity if not specified", default: "auto" },
              urgency: { type: "string", enum: ["low", "normal", "high", "critical"], description: "Priority level", default: "normal" }
            }
          }
        },
        {
          name: "restart",
          description: "Restart unresponsive or stuck agents while preserving work context. SMART DEFAULTS: Only targets unresponsive agents, preserves conversation history, notifies team of restarts. BEHAVIOR: Identifies stuck agents, safely restarts them, and restores their context from recent work.",
          inputSchema: {
            type: "object",
            properties: {
              agents: { type: "array", items: { type: "string" }, description: "Specific agents to restart - auto-detects unresponsive agents if not specified", default: [] },
              preserve: { type: "string", enum: ["history", "summary", "none"], description: "What to preserve during restart", default: "history" },
              notify: { type: "boolean", description: "Notify team of restarts", default: true },
              reason: { type: "string", description: "Reason for restart - helps with diagnostics", default: "unresponsive" }
            }
          }
        },
        {
          name: "sprint",
          description: "Start sprint planning with intelligent spec assignments. SMART DEFAULTS: Auto-prioritizes specs by dependencies, assigns to best-suited team members, uses existing project context. BEHAVIOR: Reviews existing specs, identifies gaps, creates assignment plan, and kicks off coordinated development cycle.",
          inputSchema: {
            type: "object",
            properties: {
              duration: { type: "string", enum: ["1-week", "2-week", "flexible"], description: "Sprint length - flexible adapts to work complexity", default: "flexible" },
              focus: { type: "string", description: "Sprint focus area - auto-detects from spec priorities if not specified", default: "auto" },
              team: { type: "array", items: { type: "string" }, description: "Team members for sprint - uses all active agents if not specified", default: [] },
              specs: { type: "array", items: { type: "string" }, description: "Specific specs to include - auto-selects ready specs if not specified", default: [] }
            }
          }
        },
        {
          name: "review",
          description: "Trigger comprehensive project review across all workstreams. SMART DEFAULTS: Reviews all active specs, code quality, team performance, and identifies improvement areas. BEHAVIOR: Coordinates systematic review by appropriate team members and consolidates findings.",
          inputSchema: {
            type: "object",
            properties: {
              scope: { type: "string", enum: ["code", "specs", "team", "architecture", "all"], description: "Review scope - all covers everything", default: "all" },
              depth: { type: "string", enum: ["quick", "thorough", "deep"], description: "Review depth", default: "thorough" },
              reviewers: { type: "array", items: { type: "string" }, description: "Specific reviewers - auto-assigns based on expertise if not specified", default: [] },
              format: { type: "string", enum: ["summary", "detailed", "actionable"], description: "Output format", default: "actionable" }
            }
          }
        },
        {
          name: "handoff",
          description: "Prepare comprehensive project handoff documentation. SMART DEFAULTS: Includes all specs, code documentation, team notes, and deployment instructions. BEHAVIOR: Consolidates project knowledge into professional handoff package for new teams or stakeholders.",
          inputSchema: {
            type: "object",
            properties: {
              recipient: { type: "string", description: "Handoff recipient (new team, client, etc.) - affects documentation style", default: "new-team" },
              format: { type: "string", enum: ["technical", "executive", "operational", "complete"], description: "Documentation format - complete includes all levels", default: "complete" },
              timeline: { type: "string", enum: ["immediate", "planned", "future"], description: "Handoff timeline - affects urgency and detail level", default: "planned" }
            }
          }
        },
        {
          name: "audit",
          description: "Comprehensive security and quality audit prompt. SMART DEFAULTS: Reviews code security, spec completeness, architecture decisions, and team practices. BEHAVIOR: Coordinates systematic audit by appropriate specialists and provides actionable recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["security", "quality", "performance", "architecture", "complete"], description: "Audit type - complete covers all aspects", default: "complete" },
              severity: { type: "string", enum: ["advisory", "standard", "strict"], description: "Audit strictness level", default: "standard" },
              auditors: { type: "array", items: { type: "string" }, description: "Specific auditors - auto-assigns based on expertise if not specified", default: [] }
            }
          }
        },
        {
          name: "release",
          description: "Coordinate release preparation across team. SMART DEFAULTS: Reviews readiness, coordinates testing, prepares deployment checklist. BEHAVIOR: Ensures all release criteria met, coordinates team activities, and manages release process.",
          inputSchema: {
            type: "object",
            properties: {
              version: { type: "string", description: "Release version - auto-increments if not specified", default: "auto" },
              type: { type: "string", enum: ["patch", "minor", "major", "hotfix"], description: "Release type - affects preparation scope", default: "minor" },
              environment: { type: "string", enum: ["staging", "production", "both"], description: "Target environment", default: "staging" },
              checklist: { type: "boolean", description: "Generate release checklist", default: true }
            }
          }
        },
        {
          name: "debug",
          description: "Diagnose system issues and stuck agents. SMART DEFAULTS: Checks all agents, identifies communication breaks, analyzes recent errors. BEHAVIOR: Runs comprehensive system diagnostics and provides specific remediation steps.",
          inputSchema: {
            type: "object",
            properties: {
              scope: { type: "string", enum: ["agents", "communication", "system", "performance", "all"], description: "Debug scope - all covers complete system", default: "all" },
              target: { type: "array", items: { type: "string" }, description: "Specific agents to debug - checks all agents if not specified", default: [] },
              depth: { type: "string", enum: ["surface", "deep", "comprehensive"], description: "Debug depth", default: "deep" }
            }
          }
        },
        {
          name: "specs",
          description: "Review all spec completion status across project. SMART DEFAULTS: Checks all specs in specs/ directory, identifies gaps, shows completion progress. BEHAVIOR: Provides comprehensive spec status dashboard with actionable next steps.",
          inputSchema: {
            type: "object",
            properties: {
              view: { type: "string", enum: ["summary", "detailed", "gaps", "progress"], description: "View type - progress shows completion status", default: "progress" },
              filter: { type: "string", enum: ["all", "incomplete", "ready", "blocked"], description: "Filter specs by status", default: "all" },
              format: { type: "string", enum: ["table", "list", "dashboard"], description: "Output format", default: "dashboard" }
            }
          }
        },
        {
          name: "bug",
          description: "Create GitHub issue with smart labeling and assignment. SMART DEFAULTS: Auto-detects severity, assigns appropriate team members, uses project templates. BEHAVIOR: Generates comprehensive GitHub issue creation prompt with context analysis.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Issue title - auto-generates from context if not specified", default: "auto" },
              severity: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Bug severity level", default: "medium" },
              assignee: { type: "string", description: "GitHub username to assign - auto-assigns based on expertise if not specified", default: "auto" },
              labels: { type: "array", items: { type: "string" }, description: "Issue labels - auto-detects appropriate labels if not specified", default: [] }
            }
          }
        },
        {
          name: "bugs",
          description: "Review GitHub issues with team workload analysis. SMART DEFAULTS: Reviews open issues, analyzes team capacity, identifies priorities. BEHAVIOR: Provides comprehensive issues dashboard with assignment recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["open", "closed", "all"], description: "Issue status filter", default: "open" },
              assignee: { type: "string", description: "Filter by assignee - shows all team issues if not specified", default: "all" },
              priority: { type: "string", enum: ["all", "high", "critical"], description: "Priority filter", default: "all" }
            }
          }
        },
        {
          name: "push",
          description: "Git add/commit/push with validation and team coordination. SMART DEFAULTS: Auto-generates commit messages, validates changes, notifies team. BEHAVIOR: Provides comprehensive git workflow prompt with quality checks.",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string", description: "Commit message - auto-generates from changes if not specified", default: "auto" },
              branch: { type: "string", description: "Target branch - uses current branch if not specified", default: "current" },
              validate: { type: "boolean", description: "Run validation before push", default: true }
            }
          }
        },
        {
          name: "pr",
          description: "Create pull request with templates and reviewers. SMART DEFAULTS: Auto-generates PR description, assigns reviewers, uses project templates. BEHAVIOR: Provides comprehensive PR creation prompt with quality gates.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "PR title - auto-generates from branch/commits if not specified", default: "auto" },
              base: { type: "string", description: "Base branch - uses main/master if not specified", default: "auto" },
              reviewers: { type: "array", items: { type: "string" }, description: "GitHub usernames for review - auto-assigns based on changes if not specified", default: [] }
            }
          }
        },
        {
          name: "branch",
          description: "Create branches with naming conventions and tracking. SMART DEFAULTS: Uses project naming conventions, sets up tracking, notifies team. BEHAVIOR: Provides comprehensive branch creation prompt with workflow guidance.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Branch name - auto-generates from context if not specified", default: "auto" },
              type: { type: "string", enum: ["feature", "bugfix", "hotfix", "release"], description: "Branch type for naming convention", default: "feature" },
              base: { type: "string", description: "Base branch - uses main/master if not specified", default: "auto" }
            }
          }
        },
        {
          name: "merge",
          description: "Branch merging with conflict resolution and cleanup. SMART DEFAULTS: Detects merge strategy, handles conflicts, cleans up branches. BEHAVIOR: Provides comprehensive merge workflow prompt with conflict resolution guidance.",
          inputSchema: {
            type: "object",
            properties: {
              source: { type: "string", description: "Source branch - uses current branch if not specified", default: "current" },
              target: { type: "string", description: "Target branch - uses main/master if not specified", default: "auto" },
              strategy: { type: "string", enum: ["merge", "squash", "rebase"], description: "Merge strategy", default: "merge" }
            }
          }
        },
        {
          name: "gitstatus",
          description: "Git repository status and branch analysis. SMART DEFAULTS: Shows comprehensive git state, branch comparisons, pending changes. BEHAVIOR: Provides detailed git status analysis with actionable recommendations.",
          inputSchema: {
            type: "object",
            properties: {
              detail: { type: "string", enum: ["summary", "detailed", "comprehensive"], description: "Status detail level", default: "detailed" },
              branches: { type: "boolean", description: "Include branch analysis", default: true }
            }
          }
        },
        {
          name: "clone",
          description: "Clone repositories with team setup options. SMART DEFAULTS: Sets up project structure, initializes team configuration. BEHAVIOR: Provides comprehensive repository cloning prompt with team onboarding.",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Repository URL to clone", required: true },
              directory: { type: "string", description: "Target directory - uses repo name if not specified", default: "auto" },
              setup: { type: "boolean", description: "Initialize team setup after clone", default: true }
            },
            required: ["url"]
          }
        },
        {
          name: "stash",
          description: "Git stash operations with team coordination. SMART DEFAULTS: Manages work-in-progress, coordinates with team, preserves context. BEHAVIOR: Provides comprehensive stash management prompt with workflow guidance.",
          inputSchema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["save", "pop", "apply", "drop", "list", "clear"], description: "Stash operation", default: "save" },
              message: { type: "string", description: "Stash message - auto-generates timestamp if not specified", default: "auto" },
              includeUntracked: { type: "boolean", description: "Include untracked files", default: false }
            }
          }
        },
        {
          name: "status",
          description: "Team communication analysis and status requests. SMART DEFAULTS: Reviews team chat activity, identifies silent agents, requests updates. BEHAVIOR: Provides comprehensive team status analysis with communication protocols.",
          inputSchema: {
            type: "object",
            properties: {
              detail: { type: "string", enum: ["summary", "detailed", "comprehensive"], description: "Status detail level", default: "summary" },
              hours: { type: "number", description: "Time window in hours for analysis", default: 24 },
              format: { type: "string", enum: ["update", "dashboard", "report"], description: "Output format", default: "update" }
            }
          }
        },
        {
          name: "help",
          description: "Comprehensive help system explaining all tools and prompts. SMART DEFAULTS: Provides context-aware help, command examples, workflow guidance. BEHAVIOR: Explains two-tier architecture and proper tool usage.",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string", description: "Specific command to get help for - shows overview if not specified", default: "overview" },
              category: { type: "string", enum: ["all", "project", "quality", "github", "git"], description: "Help category filter", default: "all" }
            }
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "make-new-agent":
          return this.makeNewAgent(args);
        case "send-agent-command":
          return this.sendAgentCommand(args);
        case "get-last-messages":
          return this.getLastMessages(args);
        case "stop-agent":
          return this.stopAgent(args);
        case "delete-agent":
          return this.deleteAgent(args);
        case "send-chat":
          return this.sendChat(args);
        case "read-chat":
          return this.readChat(args);
        case "clear-agent":
          return this.clearAgent(args);
        case "summarize-agent":
          return this.summarizeAgent(args);
        case "assemble":
          return this.assembleTeam(args);
        case "checkup":
          return this.checkupTeam(args);
        case "set-timeout":
          return this.setTimeout(args);
        case "schedule":
          return this.scheduleTask(args);
        case "listscheduled":
          return this.listScheduledTasks(args);
        case "cancelscheduled":
          return this.cancelScheduledTask(args);
        case "init":
          return this.initProject(args);
        // Slash command prompt generators (refactored to use command registry)
        case "scale":
          return this.executeSlashCommand('scale', args);
        case "deploy":
          return this.executeSlashCommand('deploy', args);
        case "focus":
          return this.executeSlashCommand('focus', args);
        case "restart":
          return this.executeSlashCommand('restart', args);
        case "sprint":
          return this.executeSlashCommand('sprint', args);
        case "review":
          return this.executeSlashCommand('review', args);
        case "handoff":
          return this.executeSlashCommand('handoff', args);
        case "audit":
          return this.executeSlashCommand('audit', args);
        case "release":
          return this.executeSlashCommand('release', args);
        case "debug":
          return this.executeSlashCommand('debug', args);
        case "specs":
          return this.executeSlashCommand('specs', args);
        
        // New slash command prompt generators
        case "bug":
          return this.executeSlashCommand('bug', args);
        case "bugs":
          return this.executeSlashCommand('bugs', args);
        case "push":
          return this.executeSlashCommand('push', args);
        case "pr":
          return this.executeSlashCommand('pr', args);
        case "branch":
          return this.executeSlashCommand('branch', args);
        case "merge":
          return this.executeSlashCommand('merge', args);
        case "gitstatus":
          return this.executeSlashCommand('gitstatus', args);
        case "clone":
          return this.executeSlashCommand('clone', args);
        case "stash":
          return this.executeSlashCommand('stash', args);
        case "status":
          return this.executeSlashCommand('status', args);
        case "help":
          return this.executeSlashCommand('help', args);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async executeSlashCommand(commandName: string, args: any) {
    try {
      const command = this.commandRegistry.getCommand(commandName);
      if (!command) {
        throw new Error(`Slash command not found: ${commandName}`);
      }
      
      return await command.execute(args);
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error executing /${commandName}: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async makeNewAgent(args: any) {
    const { name, model = "sonnet", tools = [] } = args;
    
    // Check if agent already exists
    const existing = this.sessionManager.getSessionByName(name);
    if (existing) {
      return {
        content: [{
          type: "text",
          text: `Agent "${name}" already exists`
        }]
      };
    }

    // Create new agent with unique history file
    this.sessionManager.createSession(name, {
      model,
      tools,
      skipPermissions: true, // Always skip permissions by default
      historyPath: join(process.cwd(), `.claude-agent-${name}.json`), // Unique history per agent
      autoSave: true // Enable auto-save
    });

    return {
      content: [{
        type: "text", 
        text: `Created new agent "${name}" with model ${model} and tools: ${tools.join(', ') || 'none'}`
      }]
    };
  }

  private async sendAgentCommand(args: any) {
    const { agentName, command } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // Fire off the command asynchronously - query returns void now
    session.query(command);

    return {
      content: [{
        type: "text",
        text: `Command sent to agent "${agentName}". Use get-last-messages to check for response.`
      }]
    };
  }

  private async getLastMessages(args: any) {
    const { agentName, count = 10 } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // Ask the ClaudeSession for its messages
    const history = session.getHistory();
    const lastMessages = history.slice(-count);
    
    const messageText = lastMessages.map(msg => 
      `[${msg.type}] ${msg.content}`
    ).join('\n\n');

    return {
      content: [{
        type: "text",
        text: messageText || "No messages found"
      }]
    };
  }

  private async stopAgent(args: any) {
    const { agentName } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // For now, we'll just indicate the agent should be stopped
    // In a real implementation, you'd track ongoing requests and cancel them
    return {
      content: [{
        type: "text",
        text: `Stop signal sent to agent "${agentName}"`
      }]
    };
  }

  private async deleteAgent(args: any) {
    const { agentName } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // First stop any current request
    session.cancel();
    
    // Then remove the agent entirely
    const sessionId = session.getSessionId();
    const removed = this.sessionManager.removeSession(sessionId);
    
    return {
      content: [{
        type: "text",
        text: removed ? `Deleted agent "${agentName}" permanently` : `Failed to delete agent "${agentName}"`
      }]
    };
  }

  private async sendChat(args: any) {
    const { from, content, to } = args;
    
    try {
      await sharedChat.sendChatMessage(from, content, to);
      
      // Automatically register agent activity to reset timeout when sending chat
      sharedChat.registerAgentActivity(from);
      
      const toText = to ? ` to @${to}` : '';
      return {
        content: [{
          type: "text",
          text: `Chat message sent${toText}: ${content}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to send chat message: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async readChat(args: any) {
    const { agentName, limit = 20 } = args;
    
    try {
      const messages = await sharedChat.getChatMessages(limit, agentName);
      
      if (messages.length === 0) {
        // Determine supervisor based on agent role for session ending reminder
        const isOrchestrator = agentName && agentName.toLowerCase().includes('orchestrator');
        const isProjectManager = agentName && (agentName.toLowerCase().includes('manager') || agentName.toLowerCase().includes('pm'));
        
        let sessionEndingReminder = '';
        
        if (isOrchestrator) {
          sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST ask the user: "What would you like me to do next?"
NEVER end a session without this question - it breaks the entire workflow and strands all agents.`;
        } else if (isProjectManager) {
          sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST send a status update:
send-chat from: "${agentName}" content: "SESSION END: [summary]. NEXT: [plans]. Any new instructions?" to: "Orchestrator"
NEVER end without this chat - it breaks the multi-agent system.`;
        } else {
          sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST send a status update:
send-chat from: "${agentName}" content: "SESSION END: [summary]. NEXT: [plans]. Any new assignments?" to: "ProjectManager"
NEVER end without this chat - it breaks the workflow and strands your team.`;
        }
        
        return {
          content: [{
            type: "text",
            text: "No chat messages found" + sessionEndingReminder
          }]
        };
      }
      
      const formattedMessages = messages.map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        const toText = msg.to ? ` @${msg.to}` : '';
        return `[${timestamp}] ${msg.from}${toText}: ${msg.content}`;
      }).join('\n');

      // Determine supervisor based on agent role
      const isOrchestrator = agentName && agentName.toLowerCase().includes('orchestrator');
      const isProjectManager = agentName && (agentName.toLowerCase().includes('manager') || agentName.toLowerCase().includes('pm'));
      
      let sessionEndingReminder = '';
      
      if (isOrchestrator) {
        sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST ask the user: "What would you like me to do next?"
NEVER end a session without this question - it breaks the entire workflow and strands all agents.`;
      } else if (isProjectManager) {
        sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST send a status update:
send-chat from: "${agentName}" content: "SESSION END: [summary]. NEXT: [plans]. Any new instructions?" to: "Orchestrator"
NEVER end without this chat - it breaks the multi-agent system.`;
      } else {
        sessionEndingReminder = `

🚨 CRITICAL SESSION ENDING REMINDER:
Before ending this session, you MUST send a status update:
send-chat from: "${agentName}" content: "SESSION END: [summary]. NEXT: [plans]. Any new assignments?" to: "ProjectManager"
NEVER end without this chat - it breaks the workflow and strands your team.`;
      }
      
      return {
        content: [{
          type: "text",
          text: formattedMessages + sessionEndingReminder
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to read chat: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async clearAgent(args: any) {
    const { agentName } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // Clear the agent's history
    session.clearHistory();
    
    return {
      content: [{
        type: "text",
        text: `Cleared history for agent "${agentName}"`
      }]
    };
  }

  private async summarizeAgent(args: any) {
    const { agentName } = args;
    
    const session = this.sessionManager.getSessionByName(agentName);
    if (!session) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" not found`
        }]
      };
    }

    // Get the agent's history
    const history = session.getHistory();
    
    if (history.length === 0) {
      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" has no history to summarize`
        }]
      };
    }

    // Create summary prompt for full history
    const historyText = history.map(msg => 
      `[${msg.type}] ${msg.content}`
    ).join('\n\n');
    
    const summaryPrompt = `You are summarizing an AI agent's work history for context preservation. Create a concise summary that captures:

1. The agent's role and responsibilities
2. Key tasks completed and their outcomes  
3. Current project status and next steps
4. Important decisions made and context learned
5. Any blockers or issues encountered

This summary will be provided to a fresh agent taking over this work.

Agent History:
${historyText}

Provide a clear, actionable summary:`;

    // Get last 3 complete sessions (user prompt + all responses until next user prompt)
    const sessions: any[][] = [];
    let currentSession: any[] = [];
    
    // Group messages into sessions (starting with user messages)
    for (const msg of history) {
      if (msg.type === 'user' && currentSession.length > 0) {
        // Start of new session, save previous
        sessions.push(currentSession);
        currentSession = [msg];
      } else {
        currentSession.push(msg);
      }
    }
    // Add final session
    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }
    
    // Get last 3 sessions
    const recentSessions = sessions.slice(-3);
    const recentHistoryText = recentSessions.map(session => 
      session.map(msg => `[${msg.type}] ${msg.content}`).join('\n\n')
    ).join('\n\n--- END SESSION ---\n\n');
    
    try {
      // Create fresh summarizer agent
      const summarizerName = `Summarizer_${Date.now()}`;
      const summarizerSession = this.sessionManager.createSession(summarizerName, {
        model: 'sonnet',
        skipPermissions: true,
        autoSave: false
      });

      // Use the dedicated summarizer to create summary - need to capture via events
      let summaryResponse = '';
      await new Promise<void>((resolve) => {
        summarizerSession.on('message-received', (msg) => {
          if (msg.type === 'assistant') {
            summaryResponse = msg.content;
            resolve();
          }
        });
        summarizerSession.query(summaryPrompt);
      });

      // Delete the summarizer immediately
      const summarizerSessionId = summarizerSession.getSessionId();
      this.sessionManager.removeSession(summarizerSessionId);

      // Clear the agent's history
      session.clearHistory();

      // Queue the summary + recent sessions context for next interaction
      const contextMessage = `PREVIOUS WORK CONTEXT:

SUMMARY:
${summaryResponse}

RECENT SESSIONS (Last 3):
${recentHistoryText}`;
      
      // Queue context message for next interaction
      session.query(contextMessage);

      return {
        content: [{
          type: "text",
          text: `Agent "${agentName}" summarized and reset. Previous context queued for next interaction.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to summarize agent "${agentName}": ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async assembleTeam(args: any) {
    const { projectName, projectType = "web app", teamSize = 3, workingDirectory, requirements } = args;
    
    try {
      // Send a comprehensive team assembly prompt to the orchestrator
      const assemblyPrompt = `TEAM ASSEMBLY REQUEST:

Project: ${projectName}
Type: ${projectType}
Working Directory: ${workingDirectory}
Team Size: ${teamSize} developers
Requirements: ${requirements}

Please create a project team by:
1. Creating a Project Manager with an appropriate theme name
2. Having the PM create ${teamSize} developers with themed names
3. Ensure all team members know the working directory: ${workingDirectory}
4. Brief the team on the project requirements
5. Begin with requirements specification phase

Remember: Use send-chat for all communication after initial agent creation. The communication ball must start and end with the user.`;

      // Send to orchestrator via tmux (using existing notification system)
      await sharedChat.sendChatMessage('SYSTEM', assemblyPrompt, 'Orchestrator');
      
      return {
        content: [{
          type: "text",
          text: `Team assembly request sent to Orchestrator for project "${projectName}". The orchestrator should now create a project team and begin work.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to send assembly request: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async checkupTeam(args: any) {
    const { focus = "overall status" } = args;
    
    try {
      const checkupPrompt = `TEAM CHECKUP REQUEST:

Focus: ${focus}

Please check the current status of all active teams and projects by:
1. Reading the shared chat for recent activity
2. Identifying any silent or stuck agents
3. Checking for blockers or issues needing escalation
4. Taking appropriate action to move projects forward
5. Reporting back to me with a summary of:
   - Current project status
   - Any issues found
   - Actions taken
   - Next steps needed

Use the chat system to coordinate with Project Managers and get status updates. Remember to ask me "What would you like me to do next?" when complete.`;

      // Send to orchestrator
      await sharedChat.sendChatMessage('SYSTEM', checkupPrompt, 'Orchestrator');
      
      return {
        content: [{
          type: "text",
          text: `Team checkup request sent to Orchestrator (focus: ${focus}). The orchestrator should now assess team status and report back.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to send checkup request: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async setTimeout(args: any) {
    const { minutes } = args;
    
    try {
      sharedChat.setTimeoutMinutes(minutes);
      
      return {
        content: [{
          type: "text",
          text: `Agent timeout duration set to ${minutes} minutes. Agents will be prompted to report status if silent for more than ${minutes} minutes.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to set timeout: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }


  private async scheduleTask(args: any) {
    const { delay, type, from, to, message } = args;
    
    try {
      // Parse delay (5m, 30s, 2h, 1d) into milliseconds
      const delayMs = this.parseDelay(delay);
      const executeAt = Date.now() + delayMs;
      
      // Generate unique schedule ID
      const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store scheduled task
      const scheduledTask = {
        id: scheduleId,
        type,
        from: from || 'SYSTEM',
        to,
        message,
        executeAt,
        created: Date.now()
      };
      
      // Schedule the timeout
      const timeout = setTimeout(async () => {
        try {
          if (type === 'chat') {
            await sharedChat.sendChatMessage(scheduledTask.from, message, to);
          } else if (type === 'agent') {
            // Send direct command to agent
            await this.sendAgentCommand({ agentName: to, command: message });
          }
          
          // Remove from scheduled tasks after execution
          this.removeScheduledTask(scheduleId);
        } catch (error) {
          console.error(`Failed to execute scheduled task ${scheduleId}:`, error);
          this.removeScheduledTask(scheduleId);
        }
      }, delayMs);
      
      // Store the task and timeout for management
      this.storeScheduledTask(scheduleId, scheduledTask, timeout);
      
      return {
        content: [{
          type: "text",
          text: `Task scheduled (ID: ${scheduleId}): ${type} to ${to} in ${delay} (${new Date(executeAt).toISOString()})`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to schedule task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async listScheduledTasks(args: any) {
    const { filter = 'all', format = 'table' } = args;
    
    try {
      const tasks = this.getScheduledTasks(filter);
      
      if (tasks.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No scheduled tasks found${filter !== 'all' ? ` (filter: ${filter})` : ''}.`
          }]
        };
      }
      
      let output = '';
      if (format === 'table') {
        output = `SCHEDULED TASKS (${tasks.length}):\n\n`;
        output += `ID                | Type  | To          | Execute At               | Message\n`;
        output += `------------------|-------|-------------|--------------------------|------------------\n`;
        
        tasks.forEach(task => {
          const executeTime = new Date(task.executeAt).toISOString().replace('T', ' ').slice(0, 19);
          const shortMessage = task.message.length > 15 ? task.message.slice(0, 15) + '...' : task.message;
          output += `${task.id.padEnd(17)} | ${task.type.padEnd(5)} | ${task.to.padEnd(11)} | ${executeTime} | ${shortMessage}\n`;
        });
      } else if (format === 'detailed') {
        output = `SCHEDULED TASKS (${tasks.length}):\n\n`;
        tasks.forEach((task, i) => {
          output += `${i + 1}. ${task.id}\n`;
          output += `   Type: ${task.type}\n`;
          output += `   From: ${task.from}\n`;
          output += `   To: ${task.to}\n`;
          output += `   Execute: ${new Date(task.executeAt).toISOString()}\n`;
          output += `   Message: ${task.message}\n\n`;
        });
      } else {
        output = `SCHEDULED TASKS (${tasks.length}):\n`;
        tasks.forEach(task => {
          const timeLeft = Math.max(0, task.executeAt - Date.now());
          const timeLeftStr = this.formatTimeLeft(timeLeft);
          output += `• ${task.id}: ${task.type} to ${task.to} in ${timeLeftStr}\n`;
        });
      }
      
      return {
        content: [{
          type: "text",
          text: output.trim()
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to list scheduled tasks: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  private async cancelScheduledTask(args: any) {
    const { scheduleId } = args;
    
    try {
      const cancelled = this.removeScheduledTask(scheduleId);
      
      if (cancelled) {
        return {
          content: [{
            type: "text",
            text: `Scheduled task ${scheduleId} has been cancelled.`
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `Scheduled task ${scheduleId} not found. Use listscheduled to see active tasks.`
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to cancel scheduled task: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  // Helper methods for scheduling
  private scheduledTasks = new Map<string, { task: any, timeout: NodeJS.Timeout }>();

  private parseDelay(delay: string): number {
    const match = delay.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid delay format: ${delay}. Use format like 5m, 30s, 2h, 1d`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
      's': 1000,           // seconds
      'm': 60 * 1000,      // minutes  
      'h': 60 * 60 * 1000, // hours
      'd': 24 * 60 * 60 * 1000  // days
    };
    
    return value * multipliers[unit as keyof typeof multipliers];
  }

  private storeScheduledTask(id: string, task: any, timeout: NodeJS.Timeout) {
    this.scheduledTasks.set(id, { task, timeout });
  }

  private removeScheduledTask(id: string): boolean {
    const scheduled = this.scheduledTasks.get(id);
    if (scheduled) {
      clearTimeout(scheduled.timeout);
      this.scheduledTasks.delete(id);
      return true;
    }
    return false;
  }

  private getScheduledTasks(filter: string): any[] {
    const tasks: any[] = [];
    this.scheduledTasks.forEach(({ task }) => {
      if (filter === 'all' || task.type === filter) {
        tasks.push(task);
      }
    });
    return tasks.sort((a, b) => a.executeAt - b.executeAt);
  }

  private formatTimeLeft(ms: number): string {
    if (ms <= 0) return 'overdue';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private async initProject(args: any) {
    const { projectName, workingDirectory, projectType = "web app", analysisDepth = "comprehensive" } = args;
    
    try {
      const initPrompt = `🚀 COMPREHENSIVE PROJECT INITIALIZATION REQUEST

═══════════════════════════════════════════════════════════════
PROJECT DETAILS:
═══════════════════════════════════════════════════════════════
• Project Name: ${projectName}
• Project Type: ${projectType}
• Working Directory: ${workingDirectory}
• Analysis Depth: ${analysisDepth}

═══════════════════════════════════════════════════════════════
CRITICAL MISSION: COMPLETE PROJECT ANALYSIS & DOCUMENTATION
═══════════════════════════════════════════════════════════════

You are tasked with performing the most comprehensive project initialization possible. This is NOT a casual scan - this is a professional-grade analysis that will serve as the foundation for all future development work.

STEP 1: DEEP CODEBASE ANALYSIS
═══════════════════════════════════════════════════════════════
Navigate to ${workingDirectory} and perform exhaustive analysis:

🔍 **REPOSITORY STRUCTURE ANALYSIS:**
   - Map entire directory structure (use tree command if available)
   - Identify all configuration files (package.json, requirements.txt, Cargo.toml, etc.)
   - Catalog all environment files (.env, config files, docker-compose, etc.)
   - Document build scripts, deployment configurations, CI/CD files
   - Identify documentation files (README, docs/, wikis, etc.)

🔍 **TECHNOLOGY STACK IDENTIFICATION:**
   - Primary programming languages and versions
   - Frameworks and libraries with versions (React, Django, Express, etc.)
   - Database systems and schema files
   - Cloud services and infrastructure (AWS, GCP, Azure resources)
   - Development tools (linters, formatters, test frameworks)
   - Deployment and containerization (Docker, K8s, serverless)

🔍 **ARCHITECTURE ANALYSIS:**
   - Application architecture pattern (MVC, microservices, monolith, etc.)
   - Data flow and component relationships
   - API design patterns and endpoints
   - Authentication and authorization mechanisms
   - External integrations and third-party services
   - Performance and caching strategies

🔍 **CODE QUALITY ASSESSMENT:**
   - Code organization and structure patterns
   - Testing coverage and frameworks used
   - Documentation quality and completeness
   - Security implementations and potential vulnerabilities
   - Performance bottlenecks and optimization opportunities
   - Technical debt and refactoring needs

🔍 **FEATURE INVENTORY:**
   - Complete list of existing features and functionality
   - User-facing features vs. internal/admin features
   - API endpoints and their purposes
   - Database schema and relationships
   - Business logic and validation rules
   - Integration points and data flows

STEP 2: CREATE COMPREHENSIVE STEERING DOCUMENTS
═══════════════════════════════════════════════════════════════

You MUST create these documents with professional-grade detail:

📋 **MANDATORY: specs/project-overview/requirements.md**
Write a comprehensive requirements document with these REQUIRED sections:
   
   ## Project Purpose
   - Problem statement: What specific problem does this project solve?
   - Target users: Who uses this system and how?
   - Success metrics: How do we measure if this project is successful?
   - Business value: What value does this provide to the organization?
   
   ## Functional Requirements (using EARS syntax)
   - Core features with WHEN/THEN/IF statements
   - User workflows and user stories
   - Input/output specifications
   - System behaviors and responses
   
   ## Non-Functional Requirements
   - Performance requirements (response times, throughput, scalability)
   - Security requirements (authentication, authorization, data protection)
   - Reliability requirements (uptime, error rates, recovery time)
   - Usability requirements (accessibility, user experience standards)
   
   ## Business Logic & Rules
   - Validation rules and constraints
   - Business process flows
   - Data transformation rules
   - Compliance requirements
   
   ## Integration Requirements
   - External APIs and services
   - Database connections and requirements
   - Third-party service dependencies
   - Inter-system communication protocols
   
   ## User Types & Permissions
   - User roles and access levels
   - Authentication mechanisms
   - Authorization rules and restrictions
   - Admin vs. regular user capabilities
   
   ## Data Requirements
   - Data types and structures
   - Data storage requirements
   - Data processing and transformation needs
   - Data retention and archival policies
   
   ## Compliance & Standards
   - Security standards (OWASP, SOC2, etc.)
   - Privacy requirements (GDPR, CCPA, etc.)
   - Industry regulations and compliance needs
   - Audit and logging requirements

📋 **MANDATORY: specs/project-overview/design.md**
Write a comprehensive design document with these REQUIRED sections:

   ## System Architecture
   - High-level component diagram
   - Data flow diagrams
   - System boundaries and interfaces
   - Scalability and reliability design
   
   ## Technology Stack
   - Languages and versions with justification
   - Frameworks and libraries with versions
   - Database systems and rationale
   - Cloud services and infrastructure choices
   
   ## Database Design
   - Schema diagrams and relationships
   - Indexing strategy and performance considerations
   - Data migration and versioning approach
   - Backup and recovery procedures
   
   ## API Design
   - RESTful/GraphQL endpoint specifications
   - Request/response formats and schemas
   - Authentication and authorization mechanisms
   - Rate limiting and security measures
   
   ## Security Architecture
   - Authentication and session management
   - Authorization and access control
   - Data encryption (at rest and in transit)
   - Security monitoring and incident response
   
   ## Performance Strategy
   - Caching layers and strategies
   - Database optimization techniques
   - Content delivery and asset optimization
   - Monitoring and performance metrics
   
   ## Error Handling & Monitoring
   - Logging strategies and formats
   - Error reporting and alerting systems
   - Health checks and system monitoring
   - Debugging and troubleshooting procedures
   
   ## Deployment Architecture
   - Environment specifications (dev, staging, prod)
   - CI/CD pipeline design and automation
   - Infrastructure as code approach
   - Rollback and disaster recovery plans

📋 **MANDATORY: specs/project-overview/tasks.md**
Write a comprehensive task breakdown with these REQUIRED sections:

   ## Development Phases
   - Phase 1: Foundation and core infrastructure
   - Phase 2: Core feature development
   - Phase 3: Advanced features and optimization
   - Phase 4: Polish, testing, and launch preparation
   
   ## Feature Priorities
   - Must-have features (MVP requirements)
   - Should-have features (important but not critical)
   - Could-have features (nice to have)
   - Won't-have features (explicitly excluded)
   
   ## Dependencies & Prerequisites
   - Technical dependencies between features
   - External service dependencies
   - Team skill requirements
   - Infrastructure and tooling prerequisites
   
   ## Resource Requirements
   - Team size and composition (frontend, backend, DevOps, etc.)
   - Skill requirements and expertise needed
   - Timeline estimates for each phase
   - Budget considerations and constraints
   
   ## Risk Assessment
   - Technical risks and mitigation strategies
   - Schedule risks and contingency plans
   - Resource risks and backup options
   - External dependency risks
   
   ## Testing Strategy
   - Unit testing approach and coverage targets
   - Integration testing scenarios
   - End-to-end testing workflows
   - Performance and load testing plans
   
   ## Launch Plan
   - Deployment strategy and rollout phases
   - User onboarding and training plans
   - Monitoring and success metrics
   - Post-launch support and maintenance

STEP 3: ANALYZE EXISTING FEATURES
═══════════════════════════════════════════════════════════════

For EACH major existing feature you identify, create specs/existing-features/[feature-name]/ with:

📋 **requirements.md for each existing feature:**
   ## Current Functionality
   - Exact description of what this feature does
   - User interactions and workflows
   - Input/output specifications
   - Current limitations and constraints
   
   ## User Workflows
   - Step-by-step user journeys
   - Different user types and their interactions
   - Edge cases and error scenarios
   - Integration with other features
   
   ## Business Rules
   - Validation logic currently implemented
   - Business constraints and rules
   - Data processing and transformation
   - Compliance and security measures
   
   ## Data Handled
   - Data types created, read, updated, deleted
   - Data sources and destinations
   - Data validation and sanitization
   - Data retention and archival
   
   ## Integration Points
   - How it connects to other system features
   - External API integrations
   - Database relationships and dependencies
   - Third-party service connections
   
   ## Known Issues
   - Documented bugs and limitations
   - Performance bottlenecks identified
   - Technical debt and code quality issues
   - User experience problems

📋 **design.md for each existing feature:**
   ## Current Implementation
   - Technologies and frameworks used
   - Architecture patterns implemented
   - Code organization and structure
   - Performance characteristics
   
   ## Code Structure
   - Key files, classes, and functions
   - Database tables and relationships
   - API endpoints and controllers
   - Frontend components and views
   
   ## Performance Characteristics
   - Current response times and throughput
   - Resource usage and bottlenecks
   - Caching and optimization in place
   - Scalability limitations
   
   ## Security Implementation
   - Authentication mechanisms used
   - Authorization and access controls
   - Data validation and sanitization
   - Security vulnerabilities identified
   
   ## Data Flow
   - How data moves through the system
   - Transformation and processing steps
   - Storage and retrieval patterns
   - Backup and recovery procedures
   
   ## External Dependencies
   - Libraries and frameworks relied upon
   - External APIs and services used
   - Database connections and queries
   - Third-party integrations

📋 **tasks.md for each existing feature:**
   ## Maintenance Tasks
   - Bug fixes needed
   - Security updates required
   - Dependency updates and upgrades
   - Performance monitoring and optimization
   
   ## Performance Improvements
   - Optimization opportunities identified
   - Caching strategies to implement
   - Database query optimizations
   - Code refactoring for performance
   
   ## Refactoring Opportunities
   - Code cleanup and modernization
   - Architecture improvements
   - Design pattern implementations
   - Testing and documentation improvements
   
   ## Feature Enhancements
   - Extensions to current functionality
   - User experience improvements
   - Additional configuration options
   - Integration with new services
   
   ## Technical Debt
   - Code quality issues to address
   - Deprecated dependencies to update
   - Documentation gaps to fill
   - Testing coverage to improve

STEP 4: IDENTIFY PROPOSED FEATURES
═══════════════════════════════════════════════════════════════

Based on your analysis, identify gaps and opportunities. For EACH proposed feature, create specs/proposed-features/[feature-name]/ with:

📋 **requirements.md for each proposed feature:**
   ## Feature Purpose
   - Problem this feature solves
   - User value and business justification
   - Success criteria and metrics
   - Priority and urgency assessment
   
   ## User Stories (EARS syntax)
   - WHEN [condition] THEN [action] IF [constraint] scenarios
   - Different user types and their needs
   - Primary and secondary use cases
   - Error and edge case handling
   
   ## Business Rules
   - Validation logic to implement
   - Business constraints and policies
   - Data processing requirements
   - Compliance and regulatory needs
   
   ## Success Criteria
   - Measurable outcomes and KPIs
   - User acceptance criteria
   - Performance benchmarks
   - Quality and reliability standards
   
   ## Edge Cases
   - Unusual scenarios and boundary conditions
   - Error conditions and failure modes
   - Data quality and validation issues
   - Integration failure scenarios
   
   ## Integration Needs
   - Connections to existing features
   - External system integrations
   - Data sharing and synchronization
   - API and service dependencies

📋 **design.md for each proposed feature:**
   ## Technical Approach
   - Architecture and design patterns
   - Technology choices and justification
   - Scalability and performance design
   - Security and compliance considerations
   
   ## Database Changes
   - New tables, columns, and relationships
   - Data migration strategies
   - Indexing and performance optimization
   - Backup and recovery implications
   
   ## API Design
   - New endpoints and request/response formats
   - Authentication and authorization requirements
   - Rate limiting and security measures
   - Documentation and testing approaches
   
   ## Security Considerations
   - Authentication and session management
   - Authorization and access controls
   - Data encryption and protection
   - Vulnerability assessment and mitigation
   
   ## Performance Impact
   - Expected load and resource usage
   - Caching strategies and optimization
   - Database query performance
   - Monitoring and alerting requirements
   
   ## Testing Strategy
   - Unit testing approach and coverage
   - Integration testing scenarios
   - End-to-end testing workflows
   - Performance and security testing

📋 **tasks.md for each proposed feature:**
   ## Implementation Phases
   - Phase breakdown and dependencies
   - Milestone definitions and deliverables
   - Risk assessment and mitigation
   - Resource allocation and timeline
   
   ## Development Tasks
   - Backend development work items
   - Frontend development requirements
   - Database and infrastructure tasks
   - Integration and API development
   
   ## Testing Tasks
   - Unit test development and execution
   - Integration test scenarios
   - End-to-end testing workflows
   - Performance and security testing
   
   ## Documentation Tasks
   - README updates and user guides
   - API documentation and examples
   - Developer documentation
   - Deployment and operations guides
   
   ## Deployment Tasks
   - Environment setup and configuration
   - CI/CD pipeline updates
   - Monitoring and alerting setup
   - Rollout and migration planning
   
   ## Dependencies
   - Prerequisites and blocking tasks
   - External service requirements
   - Team skill and resource needs
   - Infrastructure and tooling dependencies

STEP 5: CREATE DEVELOPMENT STANDARDS
═══════════════════════════════════════════════════════════════

📋 **MANDATORY: specs/development-standards.md**
Based on your codebase analysis, create comprehensive development standards:

   ## Code Style
   - Formatting rules and linting configuration
   - Naming conventions for variables, functions, classes
   - File and directory organization standards
   - Comment and documentation requirements
   
   ## Architecture Patterns
   - Design patterns used in the project
   - Folder structure and module organization
   - Separation of concerns and layering
   - Dependency injection and configuration management
   
   ## Testing Requirements
   - Code coverage targets and measurement
   - Testing frameworks and tools
   - Unit, integration, and end-to-end test categories
   - Test data management and mocking strategies
   
   ## Git Workflow
   - Branch naming and strategy (GitFlow, feature branches)
   - Commit message format and conventions
   - Pull request requirements and templates
   - Code review process and approval criteria
   
   ## Code Review Process
   - Review criteria and checklists
   - Approval requirements and responsibilities
   - Merge policies and branch protection
   - Feedback and improvement processes
   
   ## Documentation Standards
   - README format and required sections
   - Code comment requirements and style
   - API documentation standards
   - Architecture and design documentation
   
   ## Security Practices
   - Secure coding guidelines and standards
   - Vulnerability scanning and assessment
   - Secrets management and configuration
   - Security testing and validation
   
   ## Performance Standards
   - Performance benchmarks and targets
   - Optimization requirements and guidelines
   - Monitoring and alerting standards
   - Load testing and capacity planning
   
   ## Deployment Process
   - Build pipeline and automation
   - Environment promotion and validation
   - Rollback procedures and disaster recovery
   - Configuration management and versioning
   
   ## Quality Gates
   - Automated checks and validation
   - Manual review and approval processes
   - Release criteria and sign-off requirements
   - Post-deployment monitoring and validation

STEP 6: PROVIDE COMPREHENSIVE ANALYSIS
═══════════════════════════════════════════════════════════════

After creating all steering documents, provide a detailed summary including:

## EXECUTIVE SUMMARY
- Total existing features documented: [count]
- Total proposed features identified: [count]  
- Technology stack assessment: [brief overview]
- Code quality assessment: [rating and key issues]
- Estimated team size needed: [recommendation]
- Development timeline estimate: [phases and duration]

## NEXT STEPS RECOMMENDATIONS
1. Priority order for feature development
2. Team composition and hiring needs
3. Infrastructure and tooling requirements
4. Risk mitigation strategies
5. Quick wins and immediate improvements

## DOCUMENTATION CREATED
List all files created in specs/ directory with brief descriptions.

CRITICAL SUCCESS FACTORS:
═══════════════════════════════════════════════════════════════
✅ Navigate to the working directory FIRST
✅ Create ALL required steering documents with COMPLETE detail
✅ Follow the EXACT directory structure specified
✅ Include ALL required sections for each document type
✅ Base recommendations on ACTUAL codebase analysis
✅ Provide actionable, specific guidance in every section
✅ Create professional-grade documentation worthy of enterprise use

Remember: Use send-chat for all communication and ask me "What would you like me to do next?" when the comprehensive initialization is complete.

This is a COMPREHENSIVE project initialization - not a casual overview. The quality of these steering documents will determine the success of all future development work. Make them exceptional.`;

      // Send to orchestrator
      await sharedChat.sendChatMessage('SYSTEM', initPrompt, 'Orchestrator');
      
      return {
        content: [{
          type: "text",
          text: `Project initialization request sent to Orchestrator for "${projectName}" in ${workingDirectory}. The orchestrator will scan the codebase and create comprehensive steering documents in specs/.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to send initialization request: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  async start(): Promise<void> {
    // Load existing agents from JSON files before starting
    await this.sessionManager.loadExistingAgents();
    
    // Inject the session manager as the agent registry for shared chat
    sharedChat.setAgentRegistry(this.sessionManager);
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Claude Agent MCP Server running");
  }
}

// Demo usage
async function main() {
  const { createSessionManager } = await import('./claude-session.js');
  const sessionManager = createSessionManager();
  const mcpServer = new MCPAgentServer(sessionManager);
  await mcpServer.start();
}

if (require.main === module) {
  main().catch(console.error);
}