#!/usr/bin/env npx tsx

import { promises as fs } from 'fs';
import { join } from 'path';

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  content: string;
  timestamp: string;
}

export interface AgentRegistry {
  getAgentByName(name: string): { query(prompt: string): void } | undefined;
}

class SharedChatStore {
  private static instance: SharedChatStore;
  private chatFilePath = join(process.cwd(), '.claude-chat.json');
  private chatMessages: ChatMessage[] = [];
  private chatMessageId = 0;
  private agentRegistry: AgentRegistry | null = null;

  private constructor() {
    this.loadChat();
  }

  static getInstance(): SharedChatStore {
    if (!SharedChatStore.instance) {
      SharedChatStore.instance = new SharedChatStore();
    }
    return SharedChatStore.instance;
  }

  // Set the agent registry (dependency injection)
  setAgentRegistry(registry: AgentRegistry): void {
    this.agentRegistry = registry;
  }

  async sendChatMessage(from: string, content: string, to?: string): Promise<ChatMessage> {
    this.chatMessageId++;
    const message: ChatMessage = {
      id: `chat_${this.chatMessageId}`,
      from,
      to,
      content,
      timestamp: new Date().toISOString()
    };
    
    this.chatMessages.push(message);
    await this.saveChat();
    
    // If this is a targeted message, notify the target agent
    if (to && this.agentRegistry) {
      const prompt = `You have a new message from ${from} in the shared chat. They said: "${content}". Please check the shared chat using read-chat and respond appropriately.`;
      
      const targetAgent = this.agentRegistry.getAgentByName(to);
      if (targetAgent) {
        // Use the agent's query method - it will queue if busy, or process if idle
        targetAgent.query(prompt);
      } else {
        console.log(`Could not deliver message to ${to} - agent not found in registry`);
      }
    }
    
    return message;
  }


  private isNotificationMessage(content: string): boolean {
    return content.includes('SPEC_COMPLETE:') || 
           content.includes('PHASE_COMPLETE:') || 
           content.includes('ready for review') ||
           content.includes('complete');
  }

  private generateNotificationPrompt(content: string, from: string): string {
    return `Hey, check your chat messages! ${from} has sent you something that needs attention.`;
  }

  private extractFeatureName(content: string): string {
    const match = content.match(/COMPLETE:\w+:(\w+)/);
    return match && match[1] ? match[1] : 'feature';
  }

  private extractPhaseNumber(content: string): string {
    const match = content.match(/PHASE_COMPLETE:(\d+):/);
    return match && match[1] ? match[1] : '1';
  }

  async getChatMessages(limit: number = 50, forAgent?: string): Promise<ChatMessage[]> {
    // Always reload from file to get latest messages
    await this.loadChat();
    
    let messages = [...this.chatMessages];
    
    if (forAgent) {
      messages = messages.filter(msg => 
        !msg.to || // Global message
        msg.to === forAgent || // Directed to this agent
        msg.from === forAgent // Sent by this agent
      );
    }
    
    return messages.slice(-limit);
  }

  private async loadChat(): Promise<void> {
    try {
      const data = await fs.readFile(this.chatFilePath, 'utf-8');
      const chatData = JSON.parse(data);
      this.chatMessages = chatData.messages || [];
      this.chatMessageId = chatData.lastMessageId || 0;
    } catch (error) {
      this.chatMessages = [];
      this.chatMessageId = 0;
    }
  }

  private async saveChat(): Promise<void> {
    try {
      const chatData = {
        messages: this.chatMessages,
        lastMessageId: this.chatMessageId,
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.chatFilePath, JSON.stringify(chatData, null, 2));
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  }
}

export const sharedChat = SharedChatStore.getInstance();