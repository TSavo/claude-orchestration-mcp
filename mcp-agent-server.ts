#!/usr/bin/env npx tsx

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { join } from 'path';
import { SessionManager, ClaudeSession } from './claude-session.js';
import { sharedChat, ChatMessage } from './shared-chat.js';

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
          description: "Create a new Claude agent with a given name",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name for the new agent" },
              model: { type: "string", enum: ["sonnet", "haiku", "opus"], default: "sonnet" },
              tools: { type: "array", items: { type: "string" }, description: "Tools to enable" }
            },
            required: ["name"]
          }
        },
        {
          name: "send-agent-command",
          description: "Send a command to an existing agent",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent" },
              command: { type: "string", description: "Command to send" }
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
          description: "Delete an agent permanently",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent to delete" }
            },
            required: ["agentName"]
          }
        },
        {
          name: "send-chat",
          description: "Send a message to the shared agent chat",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "string", description: "Name of the agent sending the message" },
              content: { type: "string", description: "Chat message content" },
              to: { type: "string", description: "Optional: specific agent to direct the message to" }
            },
            required: ["from", "content"]
          }
        },
        {
          name: "read-chat",
          description: "Read messages from the shared agent chat",
          inputSchema: {
            type: "object",
            properties: {
              agentName: { type: "string", description: "Name of the agent reading chat (for filtering)" },
              limit: { type: "number", description: "Number of recent messages to retrieve", default: 20 }
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
    const session = this.sessionManager.createSession(name, {
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
      const message = await sharedChat.sendChatMessage(from, content, to);
      
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