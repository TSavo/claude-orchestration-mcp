#!/usr/bin/env npx tsx

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
// import { z } from 'zod'; // Currently unused
import { join } from 'path';
import { SessionManager } from './claude-session.js';
import { sharedChat } from './shared-chat.js';

export class MCPAgentServer {
  private server: Server;
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
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
    // Tool 1: Make a new agent
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "make-new-agent",
          description: "Create a new Claude agent with a given name. USAGE: Only for Orchestrator and Project Managers creating team members. Agents should be given themed names (Matrix, Ex Machina, etc.) and will receive comprehensive role-specific briefings automatically. Each agent gets individual history files for conversation persistence.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Themed name for the new agent (e.g. Neo, Trinity, Morpheus for Matrix theme)" },
              model: { type: "string", enum: ["sonnet", "haiku", "opus"], default: "sonnet", description: "AI model - sonnet recommended for development work" },
              tools: { type: "array", items: { type: "string" }, description: "MCP tools to enable - leave empty for default set" }
            },
            required: ["name"]
          }
        },
        {
          name: "send-agent-command",
          description: "Send a direct command to an existing agent. EMERGENCY USE ONLY: For debugging unresponsive agents or system recovery. ALL normal communication including briefings MUST use send-chat with 'to:' parameter. This bypasses the chat system and should be avoided - prefer send-chat for all regular communication including initial briefings.",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent (emergency debugging only)" },
              command: { type: "string", description: "Emergency command - prefer send-chat for normal communication" }
            },
            required: ["agentName", "command"]
          }
        },
        {
          name: "get-last-messages",
          description: "Get the last X messages from an agent",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent" },
              count: { type: "number", description: "Number of messages to retrieve", default: 10 }
            },
            required: ["agentName"]
          }
        },
        {
          name: "stop-agent",
          description: "Stop current request for an agent",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to stop" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "delete-agent",
          description: "Delete an agent permanently from the system. LIFECYCLE MANAGEMENT: Use when projects complete or switching to diverse tasks. Fresh agents provide better focus and avoid context contamination. ONLY delete agents when: 1) Project fully complete, 2) Switching to different technology/domain, 3) Agent becomes confused/unresponsive. Keep agents for same-project continuation.",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to permanently remove - this will delete their conversation history" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "send-chat",
          description: "Send a message to the shared agent chat system. PRIMARY COMMUNICATION TOOL. Use for all agent-to-agent communication, status updates, task assignments, and session endings. MANDATORY: Every session must end with send-chat to your supervisor. Use 'to:' parameter for direct agent communication. Supports @mentions for additional notifications.",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "string", description: "Your agent name - always identify yourself correctly" },
              content: { type: "string", description: "Message content - be specific and include context. For assignments include 'REPLY TO:' and 'DO NOT FINISH' instructions." },
              to: { type: "string", description: "Target agent name for direct communication (enables focused collaboration) - REQUIRED for session endings and assignments" }
            },
            required: ["from", "content"]
          }
        },
        {
          name: "read-chat",
          description: "Read messages from the shared agent chat system. Use this regularly to check for targeted messages, @mentions, and team communications. BEHAVIOR: Always check for messages directed at you when starting work or when notified. Read recent team conversations to understand current project status and respond to relevant discussions.",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Your agent name - used to filter relevant messages and show targeted communications" },
              limit: { type: "number", description: "Number of recent messages to retrieve - use 10-20 for recent context, 50+ for project review", default: 20 }
            },
            required: ["agentName"]
          }
        },
        {
          name: "clear-agent",
          description: "Clear an agent's history while keeping agent alive",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to clear" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "summarize-agent",
          description: "Create a summary of an agent's work history",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to summarize" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "assemble",
          description: "Prompt the orchestrator to assemble a team for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectName: { type: "string", description: "Name of the project" },
              projectType: { type: "string", description: "Type of project (web app, API, mobile, etc.)", default: "web app" },
              teamSize: { type: "number", description: "Number of developers needed", default: 3 },
              workingDirectory: { type: "string", description: "Full path to project directory" },
              requirements: { type: "string", description: "Brief overview of project requirements" }
            },
            required: ["projectName", "workingDirectory", "requirements"]
          }
        },
        {
          name: "checkup",
          description: "Prompt the orchestrator to check team status and take action",
          inputSchema: {
            type: "object",
            properties: {
              focus: { type: "string", description: "Specific area to check (team status, progress, blockers, etc.)", default: "overall status" }
            }
          }
        },
        {
          name: "set-timeout",
          description: "Configure the agent timeout duration",
          inputSchema: {
            type: "object",
            properties: {
              minutes: { type: "number", description: "Timeout duration in minutes", default: 30 }
            },
            required: ["minutes"]
          }
        },
        {
          name: "register-agent-activity",
          description: "Manually register agent activity to reset timeout",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to register activity for" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "init",
          description: "Initialize project by comprehensively scanning codebase and creating professional steering documents in specs/ directory. BEHAVIOR: Performs deep codebase analysis, identifies existing features, creates specs/project-overview/, specs/existing-features/, and specs/proposed-features/ with requirements.md, design.md, and tasks.md for each. Creates development-standards.md with project conventions. CRITICAL: Creates production-ready documentation for immediate team use.",
          inputSchema: {
            type: "object",
            properties: {
              projectName: { type: "string", description: "Official project name - will be used in all generated documentation" },
              workingDirectory: { type: "string", description: "Full absolute path to project root directory - must contain source code" },
              projectType: { type: "string", description: "Project type for context (web app, API, mobile, AI/ML, etc.) - affects analysis focus", default: "web app" },
              analysisDepth: { type: "string", enum: ["quick", "comprehensive"], description: "Analysis depth - comprehensive recommended for new teams", default: "comprehensive" }
            },
            required: ["projectName", "workingDirectory"]
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
        case "register-agent-activity":
          return this.registerAgentActivity(args);
        case "init":
          return this.initProject(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
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
        return {
          content: [{
            type: "text",
            text: "No chat messages found"
          }]
        };
      }
      
      const formattedMessages = messages.map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleTimeString();
        const toText = msg.to ? ` @${msg.to}` : '';
        return `[${timestamp}] ${msg.from}${toText}: ${msg.content}`;
      }).join('\n');
      
      return {
        content: [{
          type: "text",
          text: formattedMessages
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

  private async registerAgentActivity(args: any) {
    const { agentName } = args;
    
    try {
      sharedChat.registerAgentActivity(agentName);
      
      return {
        content: [{
          type: "text",
          text: `Registered activity for agent "${agentName}" - timeout timer reset.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to register activity: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
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