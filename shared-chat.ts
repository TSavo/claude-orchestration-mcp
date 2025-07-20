#!/usr/bin/env npx tsx

import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  content: string;
  timestamp: string;
}

export interface AgentLastNotification {
  [agentName: string]: string; // ISO timestamp of last notification
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
  private agentLastNotification: AgentLastNotification = {};
  private timeoutIntervalId: NodeJS.Timeout | null = null;
  private timeoutMinutes = 30; // configurable timeout in minutes

  private constructor() {
    this.loadChat();
    this.loadAgentNotifications();
    this.startTimeoutMonitoring();
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
    
    // Collect all agents that need to be notified (deduplicated)
    const agentsToNotify = new Set<string>();
    
    // Add targeted agent (from "to:")
    if (to) {
      agentsToNotify.add(to);
    }
    
    // Add @mentioned agents
    const mentions = this.extractMentions(content);
    mentions.forEach(agent => agentsToNotify.add(agent));
    
    // Send notifications to all unique agents
    for (const agentName of agentsToNotify) {
      // Update last notification timestamp
      this.agentLastNotification[agentName] = new Date().toISOString();
      
      // Determine notification type and prompt
      const isDirectTarget = to === agentName;
      const isMentioned = mentions.includes(agentName);
      
      let prompt: string;
      if (isDirectTarget && isMentioned) {
        prompt = `You have a direct message from ${from} and were also mentioned. They said: "${content}". Please check the shared chat using read-chat and respond appropriately.`;
      } else if (isDirectTarget) {
        prompt = `You have a new message from ${from} in the shared chat. They said: "${content}". Please check the shared chat using read-chat and respond appropriately.`;
      } else {
        prompt = `You were mentioned by ${from} in the shared chat. They said: "${content}". Please check the shared chat using read-chat and respond if relevant.`;
      }
      
      // Send notification
      if (agentName === 'Orchestrator') {
        await this.notifyOrchestrator(from, content);
      } else if (this.agentRegistry) {
        const targetAgent = this.agentRegistry.getAgentByName(agentName);
        if (targetAgent) {
          targetAgent.query(prompt);
        } else {
          console.log(`Could not notify agent ${agentName} - not found in registry`);
        }
      }
    }
    
    // Save notification timestamps if any agents were notified
    if (agentsToNotify.size > 0) {
      await this.saveAgentNotifications();
    }
    
    return message;
  }


  private async notifyOrchestrator(from: string, content: string): Promise<void> {
    try {
      // Check if orchestrator session exists
      const sessionFile = join(process.cwd(), '.orchestrator-session');
      let orchestratorSession = 'orchestrator:0'; // default
      
      try {
        orchestratorSession = await fs.readFile(sessionFile, 'utf-8');
        orchestratorSession = orchestratorSession.trim();
      } catch (e) {
        // Use default if file doesn't exist
        console.log('Using default orchestrator session: orchestrator:0');
      }
      
      // Inject read-chat command to orchestrator
      const command = `read-chat agentName: 'Orchestrator' limit: 10`;
      
      // Send the command
      await execAsync(`tmux send-keys -t ${orchestratorSession} "${command}"`);
      
      // Wait for UI to register (same timing as send-claude-message.sh)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send Enter
      await execAsync(`tmux send-keys -t ${orchestratorSession} Enter`);
      
      console.log(`Notified orchestrator in ${orchestratorSession} about message from ${from}`);
    } catch (error) {
      console.error('Failed to notify orchestrator via tmux:', error);
      console.log('Make sure orchestrator is running in tmux session');
    }
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

  private extractMentions(content: string): string[] {
    // Extract @AgentName mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const agentName = match[1];
      if (!mentions.includes(agentName)) {
        mentions.push(agentName);
      }
    }
    
    return mentions;
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
      
      // Load agent notifications from chat file if they exist (backward compatibility)
      if (chatData.agentLastNotification) {
        this.agentLastNotification = chatData.agentLastNotification;
      }
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
        agentLastNotification: this.agentLastNotification,
        lastUpdated: new Date().toISOString()
      };
      await fs.writeFile(this.chatFilePath, JSON.stringify(chatData, null, 2));
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  }

  private async saveAgentNotifications(): Promise<void> {
    // Save agent notification timestamps separately for performance
    try {
      const notificationData = {
        agentLastNotification: this.agentLastNotification,
        lastUpdated: new Date().toISOString()
      };
      const notificationPath = join(process.cwd(), '.agent-notifications.json');
      await fs.writeFile(notificationPath, JSON.stringify(notificationData, null, 2));
    } catch (error) {
      console.error('Failed to save agent notifications:', error);
    }
  }

  private async loadAgentNotifications(): Promise<void> {
    try {
      const notificationPath = join(process.cwd(), '.agent-notifications.json');
      const data = await fs.readFile(notificationPath, 'utf-8');
      const notificationData = JSON.parse(data);
      this.agentLastNotification = notificationData.agentLastNotification || {};
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.agentLastNotification = {};
    }
  }

  private startTimeoutMonitoring(): void {
    // Run timeout check every 5 minutes
    this.timeoutIntervalId = setInterval(() => {
      this.checkForTimeoutAgents();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    console.log(`Started agent timeout monitoring (${this.timeoutMinutes} minute timeout, checking every 5 minutes)`);
  }

  private async checkForTimeoutAgents(): Promise<void> {
    const now = new Date();
    const timeoutThresholdMs = this.timeoutMinutes * 60 * 1000;

    for (const [agentName, lastNotificationTime] of Object.entries(this.agentLastNotification)) {
      const lastNotified = new Date(lastNotificationTime);
      const timeSinceLastNotification = now.getTime() - lastNotified.getTime();

      if (timeSinceLastNotification > timeoutThresholdMs) {
        console.log(`Agent ${agentName} has been silent for ${Math.floor(timeSinceLastNotification / 1000 / 60)} minutes, sending timeout prompt`);
        await this.sendTimeoutPrompt(agentName);
        
        // Update notification time to prevent spam
        this.agentLastNotification[agentName] = now.toISOString();
        await this.saveAgentNotifications();
      }
    }
  }

  private async sendTimeoutPrompt(agentName: string): Promise<void> {
    let timeoutPrompt: string;
    
    if (agentName === 'Orchestrator') {
      timeoutPrompt = `⏰ TIMEOUT ALERT: You haven't been active in chat for ${this.timeoutMinutes}+ minutes. Please ask the user "What would you like me to do next?" to continue the session and keep the system alive.`;
      
      // Send to orchestrator via tmux
      await this.notifyOrchestrator('SYSTEM', timeoutPrompt);
    } else {
      // Determine supervisor based on agent type
      const supervisor = this.getSupervisorForAgent(agentName);
      
      timeoutPrompt = `⏰ TIMEOUT ALERT: You haven't been active in chat for ${this.timeoutMinutes}+ minutes. Please report your current status to your supervisor:

send-chat from: "${agentName}" content: "STATUS: [what I'm currently working on]. PROGRESS: [current progress]. NEXT: [what I plan to do next]. Any new assignments?" to: "${supervisor}"

This keeps the workflow alive and prevents the system from stalling.`;

      // Send via agent registry
      if (this.agentRegistry) {
        const targetAgent = this.agentRegistry.getAgentByName(agentName);
        if (targetAgent) {
          targetAgent.query(timeoutPrompt);
          console.log(`Sent timeout prompt to ${agentName}`);
        } else {
          console.log(`Could not send timeout prompt to ${agentName} - agent not found in registry`);
        }
      }
    }
  }

  private getSupervisorForAgent(agentName: string): string {
    // Simple heuristic - if name contains "Manager" or "PM", supervisor is Orchestrator
    // Otherwise, supervisor is ProjectManager
    if (agentName.toLowerCase().includes('manager') || agentName.toLowerCase().includes('pm')) {
      return 'Orchestrator';
    }
    return 'ProjectManager';
  }

  // Method to configure timeout duration
  setTimeoutMinutes(minutes: number): void {
    this.timeoutMinutes = minutes;
    console.log(`Agent timeout updated to ${minutes} minutes`);
  }

  // Method to manually register an agent notification (useful for initial setup)
  registerAgentActivity(agentName: string): void {
    this.agentLastNotification[agentName] = new Date().toISOString();
    this.saveAgentNotifications();
  }

  // Cleanup method
  destroy(): void {
    if (this.timeoutIntervalId) {
      clearInterval(this.timeoutIntervalId);
      this.timeoutIntervalId = null;
    }
  }
}

export const sharedChat = SharedChatStore.getInstance();