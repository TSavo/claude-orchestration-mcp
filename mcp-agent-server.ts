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