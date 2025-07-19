#!/usr/bin/env npx tsx

import { claude } from '@instantlyeasy/claude-code-sdk-ts';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';

// ====================== PRACTICAL SESSION AGENT ======================

export interface SessionMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  duration?: number;
}

export type SDKMessage =
  // An assistant message
  | {
      type: "assistant";
      message: any; // from Anthropic SDK
      session_id: string;
    }

  // A user message
  | {
      type: "user";
      message: any; // from Anthropic SDK
      session_id: string;
    }

  // Emitted as the last message
  | {
      type: "result";
      subtype: "success";
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      result: string;
      session_id: string;
      total_cost_usd: number;
    }

  // Emitted as the last message, when we've reached the maximum number of turns
  | {
      type: "result";
      subtype: "error_max_turns" | "error_during_execution";
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      session_id: string;
      total_cost_usd: number;
    }

  // Emitted as the first message at the start of a conversation
  | {
      type: "system";
      subtype: "init";
      apiKeySource: string;
      cwd: string;
      session_id: string;
      tools: string[];
      mcp_servers: {
        name: string;
        status: string;
      }[];
      model: string;
      permissionMode: "default" | "acceptEdits" | "bypassPermissions" | "plan";
    };

export interface RawClaudeEvent {
  id: string;
  timestamp: Date;
  sessionId: string;
  messageId: string;
  event: SDKMessage;
}

export interface ChatMessage {
  id: string;
  from: string; // Agent name who sent the message
  to?: string; // Optional - specific agent this message is directed to
  content: string;
  timestamp: string;
}

export interface MessageStore {
  saveMessage(message: SessionMessage): Promise<void>;
  saveRawEvent(event: RawClaudeEvent): Promise<void>;
  getMessages(sessionId: string): Promise<SessionMessage[]>;
  getRawEvents(sessionId: string): Promise<RawClaudeEvent[]>;
  getAllSessions(): Promise<string[]>;
}

export interface SessionConfig {
  model?: 'sonnet' | 'haiku' | 'opus';
  tools?: string[];
  skipPermissions?: boolean;
  directory?: string;
  autoSave?: boolean;
  historyPath?: string;
  messageStore?: MessageStore;
  agentName?: string;
}

class DefaultMessageStore implements MessageStore {
  private messages: SessionMessage[] = [];
  private events: RawClaudeEvent[] = [];

  async saveMessage(message: SessionMessage): Promise<void> {
    this.messages.push(message);
  }

  async saveRawEvent(event: RawClaudeEvent): Promise<void> {
    this.events.push(event);
  }

  async getMessages(sessionId: string): Promise<SessionMessage[]> {
    return this.messages.filter(m => m.id.includes(sessionId));
  }

  async getRawEvents(sessionId: string): Promise<RawClaudeEvent[]> {
    return this.events.filter(e => e.sessionId === sessionId);
  }

  async getAllSessions(): Promise<string[]> {
    const sessions = new Set([
      ...this.messages.map(m => m.id.split('_')[0]).filter(Boolean),
      ...this.events.map(e => e.sessionId).filter(Boolean)
    ]);
    return Array.from(sessions).filter((s): s is string => Boolean(s));
  }
}

export class ClaudeSession extends EventEmitter {
  private config: Required<Omit<SessionConfig, 'messageStore' | 'agentName'>> & { agentName?: string };
  private messageStore: MessageStore;
  private history: SessionMessage[] = [];
  private sessionId: string;
  private claudeSessionId: string | null = null; // The actual Claude SDK session ID
  private messageCounter = 0;

  constructor(config: SessionConfig = {}) {
    super();
    
    this.config = {
      model: config.model || 'sonnet',
      tools: config.tools || [],
      skipPermissions: config.skipPermissions || true,
      directory: config.directory || process.cwd(),
      autoSave: config.autoSave || true,
      historyPath: config.historyPath || join(process.cwd(), '.claude-session.json'),
      agentName: config.agentName || undefined
    };

    this.messageStore = config.messageStore || new DefaultMessageStore();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.loadHistory();
    
    this.emit('session-started', { sessionId: this.sessionId });
  }

  // ====================== CONFIGURATION ======================

  withModel(model: 'sonnet' | 'haiku' | 'opus'): ClaudeSession {
    this.config.model = model;
    this.emit('config-changed', { type: 'model', value: model });
    return this;
  }

  allowTools(...tools: string[]): ClaudeSession {
    this.config.tools = [...this.config.tools, ...tools];
    this.emit('config-changed', { type: 'tools', value: this.config.tools });
    return this;
  }

  skipPermissions(skip = true): ClaudeSession {
    this.config.skipPermissions = skip;
    this.emit('config-changed', { type: 'skipPermissions', value: skip });
    return this;
  }

  inDirectory(directory: string): ClaudeSession {
    this.config.directory = directory;
    this.emit('config-changed', { type: 'directory', value: directory });
    return this;
  }

  // ====================== MESSAGING ======================

  private isProcessing = false;
  private messageQueue: string[] = [];

  // Convenience method for chaining
  onMessage(callback: (message: any) => void): ClaudeSession {
    this.on('message', callback);
    return this;
  }

  query(prompt: string): void {
    // Add to internal queue
    this.messageQueue.push(prompt);
    
    // If not processing, start processing
    if (!this.isProcessing) {
      this.processNextMessage();
    }
  }

  private async processNextMessage(): Promise<void> {
    if (this.messageQueue.length === 0 || this.isProcessing) {
      return;
    }

    const prompt = this.messageQueue.shift()!;
    this.isProcessing = true;

    const messageId = `msg_${++this.messageCounter}`;
    const contextPrompt = this.buildContextualPrompt(prompt);
    const startTime = Date.now();

    // Add user message to history
    const userMessage: SessionMessage = {
      id: messageId + '_user',
      type: 'user', 
      content: prompt,
      timestamp: new Date()
    };
    
    this.history.push(userMessage);
    this.emit('message-sent', userMessage);

    try {
      let claudeQuery = this.buildClaudeQuery();
      
      // If we have a session ID, use it for continuity
      if (this.claudeSessionId) {
        claudeQuery = claudeQuery.withSessionId(this.claudeSessionId);
      }
      
      const queryResult = claudeQuery.query(contextPrompt);
      
      // Use stream internally to capture all output
      let fullResponse = '';
      await queryResult.stream((chunk) => {
        // The SDK passes message event objects, not text chunks
        if (typeof chunk === 'object' && chunk.type === 'assistant' && chunk.content) {
          // Extract text from assistant messages
          const textContent = chunk.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('');
          
          if (textContent) {
            // Emit each chunk as it comes in
            this.emit('stream-chunk', { messageId, chunk: textContent });
            // Also emit as a message event for onMessage listeners
            this.emit('message', { 
              type: 'stream', 
              content: textContent,
              messageId 
            });
            fullResponse += textContent;
          }
        }
        // Ignore other message types (like 'result')
      });

      // Get the session ID
      const sessionId = await queryResult.getSessionId();
      
      // Register session if needed
      if (!this.claudeSessionId && sessionId) {
        this.claudeSessionId = sessionId;
        if (this.config.agentName) {
          const { sessionRegistry } = await import('./session-registry.ts');
          sessionRegistry.registerSession(this.claudeSessionId, this.config.agentName);
          console.log(`[DEBUG] Registered ${this.config.agentName} with session ${this.claudeSessionId}`);
        }
      }
      
      const duration = Date.now() - startTime;
      
      // Add assistant response to history
      const assistantMessage: SessionMessage = {
        id: messageId + '_assistant',
        type: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        duration
      };

      this.history.push(assistantMessage);
      this.emit('message-received', assistantMessage);
      // Also emit through the message event
      this.emit('message', {
        type: 'assistant',
        content: fullResponse,
        messageId,
        timestamp: assistantMessage.timestamp,
        duration
      });

      if (this.config.autoSave) {
        await this.saveHistory();
      }

      // Task completed
      this.isProcessing = false;
      
      // Check for more queued messages
      this.processNextMessage();

    } catch (error) {
      this.isProcessing = false;
      this.emit('error', { error, messageId });
    }
  }

  // ====================== CONTEXT MANAGEMENT ======================

  private buildContextualPrompt(prompt: string): string {
    // Check for targeted chat messages first
    let finalPrompt = prompt;
    if (this.config.agentName) {
      const targetedMessages = this.checkForTargetedMessages(this.config.agentName);
      if (targetedMessages.length > 0) {
        finalPrompt = `IMPORTANT: Before doing anything else, use the read-chat tool to check for ${targetedMessages.length} targeted messages directed at you, then respond appropriately to those messages. After that, proceed with: ${prompt}`;
      }
    }

    // Include recent conversation history for context
    const recentHistory = this.history.slice(-6); // Last 3 exchanges
    
    // If this is the first interaction and we have an agent name, include identity briefing
    if (recentHistory.length === 0 && this.config.agentName) {
      const briefing = `You are an AI agent named "${this.config.agentName}". This is your identity - remember it and use it when identifying yourself. You have access to MCP tools for inter-agent communication including read-chat and send-chat. When using these tools, always identify yourself as "${this.config.agentName}". You are part of a multi-agent orchestration system.\n\n`;
      finalPrompt = briefing + finalPrompt;
    }
    
    if (recentHistory.length === 0) {
      return finalPrompt;
    }

    let contextPrompt = "Previous conversation:\n";
    recentHistory.forEach(msg => {
      const role = msg.type === 'user' ? 'Human' : 'Assistant';
      contextPrompt += `${role}: ${msg.content}\n`;
    });
    
    contextPrompt += `\nHuman: ${finalPrompt}`;
    return contextPrompt;
  }

  private checkForTargetedMessages(agentName: string): string[] {
    try {
      const chatFile = join(process.cwd(), '.claude-chat.json');
      const fs = require('fs');
      if (!fs.existsSync(chatFile)) {
        return [];
      }

      const chatData = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
      const messages = chatData.messages || [];

      return messages
        .filter((msg: any) => {
          // Check direct targeting
          if (msg.to === agentName) return true;
          
          // Check @mentions
          if (msg.content && msg.content.includes(`@${agentName}`)) return true;
          
          return false;
        })
        .map((msg: any) => msg.id || `${msg.timestamp}_${msg.from}`);
    } catch (error) {
      console.error('Failed to check targeted messages:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private buildClaudeQuery() {
    let query = claude().withModel(this.config.model);

    if (this.config.tools.length > 0) {
      query = query.allowTools(...(this.config.tools as any));
    }

    if (this.config.skipPermissions) {
      query = query.skipPermissions();
    }

    if (this.config.directory !== process.cwd()) {
      query = query.inDirectory(this.config.directory);
    }

    return query;
  }

  // ====================== HISTORY MANAGEMENT ======================

  getHistory(): SessionMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.emit('history-cleared');
  }

  async saveHistory(): Promise<void> {
    try {
      const data = {
        sessionId: this.sessionId,
        claudeSessionId: this.claudeSessionId,
        config: this.config,
        history: this.history,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeFile(this.config.historyPath, JSON.stringify(data, null, 2));
      this.emit('history-saved', { path: this.config.historyPath, count: this.history.length });
    } catch (error) {
      this.emit('error', { error, operation: 'save-history' });
    }
  }

  public async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.config.historyPath, 'utf-8');
      const saved = JSON.parse(data);
      
      if (saved.history) {
        this.history = saved.history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Restore Claude session ID if it exists
        if (saved.claudeSessionId) {
          this.claudeSessionId = saved.claudeSessionId;
        }
        
        this.emit('history-loaded', { count: this.history.length });
      }
    } catch (error) {
      // File doesn't exist, start fresh
      this.history = [];
    }
  }

  // ====================== STATUS ======================

  getSessionId(): string {
    return this.sessionId;
  }

  cancel(): void {
    // Cancel any ongoing operations
    this.isProcessing = false;
    this.emit('cancelled');
  }

  async getRawEvents(sessionId?: string): Promise<RawClaudeEvent[]> {
    const targetSessionId = sessionId || this.sessionId;
    return this.messageStore.getRawEvents(targetSessionId);
  }

  async getAllSessions(): Promise<string[]> {
    return this.messageStore.getAllSessions();
  }

  async replayEvents(sessionId?: string): Promise<RawClaudeEvent[]> {
    return this.getRawEvents(sessionId);
  }

  getStatus(): {
    sessionId: string;
    config: SessionConfig;
    messageCount: number;
    lastActivity?: Date;
  } {
    const lastMessage = this.history[this.history.length - 1];
    
    return {
      sessionId: this.sessionId,
      config: { ...this.config },
      messageCount: this.history.length,
      lastActivity: lastMessage?.timestamp
    };
  }
}

// ====================== SESSION MANAGER ======================

export interface SessionInfo {
  id: string;
  name: string;
  created: Date;
  lastActivity: Date;
  messageCount: number;
  model: string;
}

import { AgentRegistry } from './shared-chat.js';

export class SessionManager implements AgentRegistry {
  private sessions = new Map<string, ClaudeSession>();
  private sessionInfo = new Map<string, SessionInfo>();

  createSession(name: string, config?: SessionConfig): ClaudeSession {
    // Pass the agent name into the config
    const configWithName = { ...config, agentName: name };
    const session = new ClaudeSession(configWithName);
    const sessionId = session.getSessionId();
    
    this.sessions.set(sessionId, session);
    this.sessionInfo.set(sessionId, {
      id: sessionId,
      name,
      created: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      model: config?.model || 'sonnet'
    });

    // Track session activity
    session.on('message-received', () => {
      const info = this.sessionInfo.get(sessionId);
      if (info) {
        info.lastActivity = new Date();
        info.messageCount++;
      }
    });

    return session;
  }

  getSession(sessionId: string): ClaudeSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByName(name: string): ClaudeSession | undefined {
    for (const [id, info] of this.sessionInfo) {
      if (info.name === name) {
        return this.sessions.get(id);
      }
    }
    return undefined;
  }

  // Implement AgentRegistry interface
  getAgentByName(name: string): { query(prompt: string): void } | undefined {
    return this.getSessionByName(name);
  }

  listSessions(): SessionInfo[] {
    return Array.from(this.sessionInfo.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  renameSession(sessionId: string, newName: string): boolean {
    const info = this.sessionInfo.get(sessionId);
    if (info) {
      info.name = newName;
      return true;
    }
    return false;
  }

  removeSession(sessionId: string): boolean {
    const removed = this.sessions.delete(sessionId);
    this.sessionInfo.delete(sessionId);
    return removed;
  }

  getSessionInfo(sessionId: string): SessionInfo | undefined {
    return this.sessionInfo.get(sessionId);
  }

  findSessions(query: string): SessionInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.listSessions().filter(info => 
      info.name.toLowerCase().includes(lowerQuery) ||
      info.id.toLowerCase().includes(lowerQuery)
    );
  }

  async loadExistingAgents(directory: string = process.cwd()): Promise<void> {
    const fs = await import('fs/promises');
    const { join } = await import('path');
    
    try {
      // Find all .claude-agent-*.json files
      const files = await fs.readdir(directory);
      const agentFiles = files.filter(file => file.startsWith('.claude-agent-') && file.endsWith('.json'));
      
      for (const file of agentFiles) {
        try {
          const agentName = file.replace('.claude-agent-', '').replace('.json', '');
          const filePath = join(directory, file);
          
          // Check if agent is already loaded
          if (this.getSessionByName(agentName)) {
            continue;
          }
          
          // Read the agent file to get config
          const data = await fs.readFile(filePath, 'utf-8');
          const saved = JSON.parse(data);
          
          if (saved.config) {
            // Create session with the same config
            const session = new ClaudeSession({
              agentName,
              model: saved.config.model || 'sonnet',
              tools: saved.config.tools || [],
              directory: saved.config.directory || directory,
              historyPath: filePath,
              autoSave: saved.config.autoSave !== false
            });
            
            // Load the history
            await session.loadHistory();
            
            // Add to session manager
            const sessionId = session.getSessionId();
            this.sessions.set(sessionId, session);
            this.sessionInfo.set(sessionId, {
              id: sessionId,
              name: agentName,
              created: new Date(saved.lastUpdated || Date.now()),
              lastActivity: new Date(saved.lastUpdated || Date.now()),
              messageCount: saved.history?.length || 0,
              model: saved.config.model || 'sonnet'
            });
            
            console.log(`Loaded existing agent: ${agentName}`);
          }
        } catch (error) {
          console.error(`Failed to load agent from ${file}:`, error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      console.error('Failed to load existing agents:', error instanceof Error ? error.message : String(error));
    }
  }
}

// ====================== CONVENIENCE FACTORY ======================

export function createSession(config?: SessionConfig): ClaudeSession {
  return new ClaudeSession(config);
}

export function createSessionManager(): SessionManager {
  return new SessionManager();
}

// ====================== DEMO ======================

async function demoClaudeSession() {
  console.log('🎭 Claude Session Demo\n');

  const session = createSession()
    .withModel('sonnet')
    .skipPermissions();

  // Event listeners
  session.on('session-started', ({ sessionId }) => {
    console.log(`🆕 Session started: ${sessionId}`);
  });

  session.on('message-sent', (message) => {
    console.log(`📤 User: ${message.content.slice(0, 60)}...`);
  });

  session.on('message-received', (message) => {
    console.log(`📥 Assistant: ${message.content.slice(0, 60)}...`);
    if (message.duration) {
      console.log(`   ⏱️  Duration: ${message.duration}ms`);
    }
  });

  try {
    console.log('=== Test: Transparent Session Management ===');
    
    // Demo removed - would need complete rewrite for event-based API
    
    console.log('\n=== Session Status ===');
    console.log(JSON.stringify(session.getStatus(), null, 2));

  } catch (error) {
    console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
  }
}

// Uncomment to run demo
// demoClaudeSession();