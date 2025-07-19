import * as fs from 'fs';
import * as path from 'path';

interface SessionRegistry {
  [agentName: string]: string; // agentName -> current sessionId
}

interface ChatNotifications {
  [agentName: string]: string[]; // agentName -> unread message IDs
}

const REGISTRY_FILE = path.join(__dirname, '.session-registry.json');
const NOTIFICATIONS_FILE = path.join(__dirname, '.chat-notifications.json');

export class SessionRegistryManager {
  private registry: SessionRegistry = {};
  private notifications: ChatNotifications = {};

  constructor() {
    this.loadRegistry();
    this.loadNotifications();
  }

  private loadRegistry(): void {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const data = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        this.registry = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load session registry:', error instanceof Error ? error.message : String(error));
      this.registry = {};
    }
  }

  private saveRegistry(): void {
    try {
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(this.registry, null, 2));
    } catch (error) {
      console.error('Failed to save session registry:', error instanceof Error ? error.message : String(error));
    }
  }

  private loadNotifications(): void {
    try {
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        this.notifications = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error instanceof Error ? error.message : String(error));
      this.notifications = {};
    }
  }

  private saveNotifications(): void {
    try {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.notifications, null, 2));
    } catch (error) {
      console.error('Failed to save notifications:', error instanceof Error ? error.message : String(error));
    }
  }

  // Register a session ID with an agent name
  registerSession(sessionId: string, agentName: string): void {
    this.registry[agentName] = sessionId;
    this.saveRegistry();
    console.log(`Registered agent ${agentName} -> session ${sessionId}`);
  }

  // Get agent name from session ID
  getAgentName(sessionId: string): string | undefined {
    // Search through the registry to find which agent has this session ID
    for (const [agentName, currentSessionId] of Object.entries(this.registry)) {
      if (currentSessionId === sessionId) {
        return agentName;
      }
    }
    return undefined;
  }

  // Get session by agent name - returns ClaudeSession if found
  getSessionByAgentName(agentName: string): any {
    // This needs to coordinate with the session manager
    // For now, return null - the actual implementation should be in the session manager
    return null;
  }

  // Extract agent name from tool context (when we can't determine it directly)
  extractAgentFromContext(hookData: any): string | undefined {
    // Method 1: Check if there are existing agent files that match this session
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Look for .claude-agent-*.json files
      const files = fs.readdirSync(hookData.cwd || '.');
      const agentFiles = files.filter((file: string) => file.startsWith('.claude-agent-') && file.endsWith('.json'));
      
      for (const file of agentFiles) {
        try {
          const agentData = JSON.parse(fs.readFileSync(path.join(hookData.cwd || '.', file), 'utf-8'));
          if (agentData.claudeSessionId === hookData.session_id) {
            // Extract agent name from filename
            const agentName = file.replace('.claude-agent-', '').replace('.json', '');
            return agentName;
          }
        } catch (e) {
          // Skip invalid files
        }
      }
    } catch (e) {
      // Directory read failed, continue with other methods
    }

    // Method 2: Try to extract from transcript path
    const transcriptPath = hookData.transcript_path;
    if (transcriptPath) {
      // Look for agent name patterns in path
      const pathMatch = transcriptPath.match(/agent-(\w+)/i);
      if (pathMatch) {
        return pathMatch[1];
      }
    }

    // Method 3: Try to extract from working directory or tool parameters
    const cwd = hookData.cwd;
    if (cwd && cwd.includes('agent')) {
      const cwdMatch = cwd.match(/agent[_-](\w+)/i);
      if (cwdMatch) {
        return cwdMatch[1];
      }
    }

    // Default fallback - use session ID as name
    return `Agent_${hookData.session_id.substring(0, 8)}`;
  }

  // Add notification for an agent
  addNotification(agentName: string, messageId: string): void {
    if (!this.notifications[agentName]) {
      this.notifications[agentName] = [];
    }
    
    if (!this.notifications[agentName].includes(messageId)) {
      this.notifications[agentName].push(messageId);
      this.saveNotifications();
      console.log(`Added notification for ${agentName}: ${messageId}`);
    }
  }

  // Check if agent has unread notifications
  hasUnreadNotifications(agentName: string): boolean {
    return Boolean(this.notifications[agentName] && this.notifications[agentName].length > 0);
  }

  // Get unread notification count
  getUnreadCount(agentName: string): number {
    return this.notifications[agentName] ? this.notifications[agentName].length : 0;
  }

  // Mark notifications as read for an agent
  markNotificationsRead(agentName: string): void {
    if (this.notifications[agentName]) {
      const count = this.notifications[agentName].length;
      this.notifications[agentName] = [];
      this.saveNotifications();
      console.log(`Marked ${count} notifications as read for ${agentName}`);
    }
  }

  // Check for targeted messages in chat
  checkForTargetedMessages(agentName: string): string[] {
    try {
      const chatFile = path.join(__dirname, '.claude-chat.json');
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
        .map((msg: any) => msg.id || `${msg.timestamp}_${msg.from}`)
        .filter((msgId: string) => {
          // Only return messages that haven't been notified yet
          return !this.notifications[agentName] || !this.notifications[agentName].includes(msgId);
        });
    } catch (error) {
      console.error('Failed to check targeted messages:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
}

// Singleton instance
export const sessionRegistry = new SessionRegistryManager();