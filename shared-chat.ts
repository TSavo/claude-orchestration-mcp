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
  getAgentByName(_: string): { query(_: string): void } | undefined;
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
      const messageType = this.analyzeMessageType(content);
      
      if (isDirectTarget && isMentioned) {
        prompt = this.generateDirectTargetPrompt(from, content, agentName, messageType);
      } else if (isDirectTarget) {
        prompt = this.generateDirectMessagePrompt(from, content, agentName, messageType);
      } else {
        prompt = this.generateMentionPrompt(from, content, agentName, messageType);
      }
      
      // Send notification
      if (agentName === 'Orchestrator') {
        await this.notifyOrchestrator(from);
      } else if (this.agentRegistry) {
        const targetAgent = this.agentRegistry.getAgentByName(agentName);
        if (targetAgent) {
          targetAgent.query(prompt);
        } else {
          console.error(`❌ CRITICAL SYSTEM ERROR: Agent notification failed`);
          console.error(`🎯 FAILED AGENT: ${agentName}`);
          console.error(`📍 ERROR CONTEXT: Message from ${from} could not be delivered`);
          console.error(`⏰ TIMESTAMP: ${new Date().toISOString()}`);
          console.error(`🔧 IMMEDIATE RECOVERY ACTIONS REQUIRED:`);
          console.error(`   1. VERIFY: get-last-messages agentName: "${agentName}" count: 5`);
          console.error(`   2. RECREATE: delete-agent agentName: "${agentName}" && make-new-agent name: "${agentName}"`);
          console.error(`   3. ESCALATE: Notify supervisor about agent failure via chat`);
          console.error(`   4. WORKAROUND: Redirect message to available team member`);
          console.error(`⚠️ IMPACT: Communication chain broken - immediate action required`);
        }
      }
    }
    
    // Save notification timestamps if any agents were notified
    if (agentsToNotify.size > 0) {
      await this.saveAgentNotifications();
    }
    
    return message;
  }


  private async notifyOrchestrator(from: string): Promise<void> {
    try {
      // Check if orchestrator session exists
      const sessionFile = join(process.cwd(), '.orchestrator-session');
      let orchestratorSession = 'orchestrator:0'; // default
      
      try {
        orchestratorSession = await fs.readFile(sessionFile, 'utf-8');
        orchestratorSession = orchestratorSession.trim();
      } catch {
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
      console.error('❌ CRITICAL SYSTEM FAILURE: Orchestrator notification failed');
      console.error(`📍 ERROR DETAILS: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`⏰ TIMESTAMP: ${new Date().toISOString()}`);
      console.error(`📍 CONTEXT: Failed to notify orchestrator about message from ${from}`);
      console.error('🚨 IMMEDIATE RECOVERY PROTOCOL:');
      console.error('   1. VERIFY: tmux list-sessions | grep orchestrator');
      console.error('   2. RESTART: ./start-orchestrator.sh (if session missing)');
      console.error('   3. INSPECT: tmux attach -t orchestrator:0 (if session exists)');
      console.error('   4. VALIDATE: Check .orchestrator-session file content');
      console.error('   5. NUCLEAR: Kill and restart entire orchestrator session');
      console.error('⚠️ SYSTEM IMPACT: Command chain broken - orchestrator unreachable');
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
      if (agentName && !mentions.includes(agentName)) {
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
    } catch {
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
      console.error('❌ CATASTROPHIC FAILURE: Chat persistence system failed');
      console.error(`📍 ERROR DETAILS: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`⏰ TIMESTAMP: ${new Date().toISOString()}`);
      console.error(`📍 FILE PATH: ${this.chatFilePath}`);
      console.error('🚨 CRITICAL IMPACT: All agent communications at risk of data loss');
      console.error('🚨 IMMEDIATE ACTIONS REQUIRED:');
      console.error('   1. SPACE: df -h (check disk space)');
      console.error('   2. PERMISSIONS: ls -la .claude-chat.json');
      console.error('   3. ACCESS: touch test-write && rm test-write');
      console.error('   4. FIX PERMS: chmod 664 .claude-chat.json');
      console.error('   5. FREE SPACE: Clean logs/temp files if disk full');
      console.error('⚠️ SYSTEM STATUS: UNSTABLE - Communication history corruption risk');
      console.error('🚨 NOTIFY ORCHESTRATOR IMMEDIATELY about chat system failure');
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
      console.error('❌ WARNING: Agent notification save failed:', error);
      console.error('🔧 IMPLICATIONS:');
      console.error('   • Timeout monitoring may not work correctly');
      console.error('   • Agents may receive duplicate notifications');
      console.error('   • System may lose track of agent activity timestamps');
      console.error('🔧 RECOVERY: Check file permissions and disk space');
      console.error('   If issue persists, agents will still function but may get extra timeout prompts');
    }
  }

  private async loadAgentNotifications(): Promise<void> {
    try {
      const notificationPath = join(process.cwd(), '.agent-notifications.json');
      const data = await fs.readFile(notificationPath, 'utf-8');
      const notificationData = JSON.parse(data);
      this.agentLastNotification = notificationData.agentLastNotification || {};
    } catch {
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
    const escalationThresholdMs = this.timeoutMinutes * 60 * 1000 * 2; // 2x timeout for escalation
    const criticalThresholdMs = this.timeoutMinutes * 60 * 1000 * 3; // 3x timeout for critical

    for (const [agentName, lastNotificationTime] of Object.entries(this.agentLastNotification)) {
      const lastNotified = new Date(lastNotificationTime);
      const timeSinceLastNotification = now.getTime() - lastNotified.getTime();
      const minutesSilent = Math.floor(timeSinceLastNotification / 1000 / 60);

      if (timeSinceLastNotification > criticalThresholdMs) {
        console.error(`🚨 CRITICAL: Agent ${agentName} silent for ${minutesSilent} minutes - SYSTEM FAILURE RISK`);
        await this.sendCriticalTimeoutAlert(agentName, minutesSilent);
      } else if (timeSinceLastNotification > escalationThresholdMs) {
        console.warn(`⚠️ ESCALATION: Agent ${agentName} silent for ${minutesSilent} minutes - escalating to supervisor`);
        await this.sendEscalationTimeout(agentName, minutesSilent);
      } else if (timeSinceLastNotification > timeoutThresholdMs) {
        console.log(`🔔 TIMEOUT: Agent ${agentName} silent for ${minutesSilent} minutes - sending reminder`);
        await this.sendTimeoutPrompt(agentName);
      }
      
      // Update notification time to prevent spam (only for basic timeout)
      if (timeSinceLastNotification > timeoutThresholdMs && timeSinceLastNotification < escalationThresholdMs) {
        this.agentLastNotification[agentName] = now.toISOString();
        await this.saveAgentNotifications();
      }
    }
  }

  private async sendTimeoutPrompt(agentName: string): Promise<void> {
    let timeoutPrompt: string;
    
    if (agentName === 'Orchestrator') {
      timeoutPrompt = `🚨 SYSTEM TIMEOUT ALERT

You haven't been active in chat for ${this.timeoutMinutes}+ minutes. The multi-agent system requires continuous orchestrator presence to function.

🎯 REQUIRED ACTIONS:
1. Check if you have any pending chat messages with: read-chat agentName: "Orchestrator" limit: 10
2. Respond to any team updates or status reports
3. Ask the user: "What would you like me to do next?" to continue the session

⚠️ CRITICAL: If you don't maintain regular activity, the entire multi-agent system will stall and teams will become stranded.

🚨 CRITICAL SESSION ENDING REQUIREMENT:
🔥 YOU MUST ALWAYS ASK THE USER: "What would you like me to do next?" BEFORE ENDING ANY SESSION 🔥
NEVER end a session without this question - it breaks the entire workflow and strands all agents.

🔄 WORKFLOW CONTINUATION: Your response will reset the timeout timer and keep the system alive.`;
      
      // Send to orchestrator via tmux
      await this.notifyOrchestrator('SYSTEM');
    } else {
      // Determine supervisor and role-specific guidance
      const supervisor = this.getSupervisorForAgent(agentName);
      const isProjectManager = agentName.toLowerCase().includes('manager') || agentName.toLowerCase().includes('pm');
      
      timeoutPrompt = `🚨 AGENT TIMEOUT ALERT

You haven't been active in chat for ${this.timeoutMinutes}+ minutes. Silent agents break the multi-agent workflow.

🎯 REQUIRED IMMEDIATE ACTION:
1. Check for messages: read-chat agentName: "${agentName}" limit: 10
2. Respond to any targeted messages or @mentions
3. Report status to your supervisor:

send-chat from: "${agentName}" content: "TIMEOUT STATUS: [current work/situation]. PROGRESS: [what you've accomplished]. BLOCKERS: [any issues]. NEXT: [planned work]. Any new assignments?" to: "${supervisor}"

${
  isProjectManager 
    ? `📋 PROJECT MANAGER RESPONSIBILITIES:
- Check on your developer team's progress
- Report team status to Orchestrator
- Assign new work if developers are idle
- Escalate any blockers or issues

` 
    : `👨‍💻 DEVELOPER RESPONSIBILITIES:
- Report work progress and current status
- Ask for help if blocked on current tasks
- Request new assignments if current work is complete
- Follow spec-driven development process

`
}⚠️ SYSTEM IMPACT: Silent agents cause workflow delays and can strand teammates waiting for responses.

🚨 CRITICAL SESSION ENDING REQUIREMENT:
${isProjectManager 
  ? `🔥 YOU MUST ALWAYS END SESSIONS WITH: send-chat from: "${agentName}" content: "STATUS UPDATE: [progress]. NEXT: [plans]. Any new instructions?" to: "Orchestrator" 🔥
NEVER end a session without this chat to Orchestrator - it breaks the entire multi-agent system.`
  : `🔥 YOU MUST ALWAYS END SESSIONS WITH: send-chat from: "${agentName}" content: "STATUS: [work completed]. NEXT: [plans]. Any new assignments?" to: "ProjectManager" 🔥
NEVER end a session without this chat to ProjectManager - it breaks the workflow and strands your team.`
}

🔄 WORKFLOW CONTINUATION: Your status report will reset the timeout and keep the project moving forward.`;

      // Send via agent registry
      if (this.agentRegistry) {
        const targetAgent = this.agentRegistry.getAgentByName(agentName);
        if (targetAgent) {
          targetAgent.query(timeoutPrompt);
          console.log(`Sent comprehensive timeout prompt to ${agentName} (${isProjectManager ? 'PM' : 'Developer'})`);
        } else {
          console.error(`❌ AGENT COMMUNICATION FAILURE: ${agentName} is unreachable`);
          console.error(`🚨 STATUS: Agent silent AND unresponsive to system prompts`);
          console.error(`⏰ DURATION: ${Math.floor((Date.now() - new Date(this.agentLastNotification[agentName] || Date.now()).getTime()) / 1000 / 60)} minutes silent`);
          console.error(`🚨 EMERGENCY PROTOCOL ACTIVATED:`);
          console.error(`   1. DIAGNOSE: get-last-messages agentName: "${agentName}" count: 10`);
          console.error(`   2. ASSESS: Check if agent process is stuck or crashed`);
          console.error(`   3. RECOVERY: delete-agent agentName: "${agentName}" && make-new-agent name: "${agentName}"`);
          console.error(`   4. ESCALATE: Alert supervisor immediately via chat`);
          console.error(`   5. REDISTRIBUTE: Move critical work to available agents`);
          console.error(`⚠️ PROJECT IMPACT: Critical workflow disruption - immediate intervention required`);
          console.error(`📍 NEXT STEP: Manual orchestrator intervention needed`);
        }
      }
    }
  }

  private analyzeMessageType(content: string): string {
    const contentLower = content.toLowerCase();
    
    // Assignment patterns
    if (contentLower.includes('reply to:') && contentLower.includes('do not finish')) {
      return 'assignment';
    }
    
    // Status/completion patterns
    if (contentLower.includes('status:') || contentLower.includes('complete:') || 
        contentLower.includes('finished') || contentLower.includes('done')) {
      return 'status_update';
    }
    
    // Question patterns
    if (content.includes('?') || contentLower.includes('help') || 
        contentLower.includes('question') || contentLower.includes('how')) {
      return 'question';
    }
    
    // Approval/request patterns
    if (contentLower.includes('approval') || contentLower.includes('review') || 
        contentLower.includes('please') || contentLower.includes('request')) {
      return 'request';
    }
    
    // Escalation patterns
    if (contentLower.includes('blocked') || contentLower.includes('urgent') || 
        contentLower.includes('escalation') || contentLower.includes('priority')) {
      return 'escalation';
    }
    
    return 'general';
  }

  private generateDirectTargetPrompt(from: string, content: string, agentName: string, messageType: string): string {
    const basePrompt = `🎯 DIRECT MESSAGE from ${from}\n\nThey said: "${content}"\n\n`;
    
    switch (messageType) {
      case 'assignment':
        return basePrompt + `🚨 THIS IS A TASK ASSIGNMENT\n\nACTION REQUIRED:\n1. Use read-chat to get full context\n2. Acknowledge the assignment\n3. Begin work following the instructions\n4. Report back as specified in the assignment\n\nREMEMBER: You must follow the "REPLY TO" and "DO NOT FINISH" instructions exactly.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'status_update':
        return basePrompt + `📊 STATUS REPORT RECEIVED\n\nACTION REQUIRED:\n1. Use read-chat to see the full status\n2. Evaluate the progress reported\n3. Provide feedback or next steps\n4. Update your supervisor if this affects project timeline\n\nREMEMBER: Status updates often require decisions or follow-up actions.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'question':
        return basePrompt + `❓ QUESTION NEEDS ANSWER\n\nACTION REQUIRED:\n1. Use read-chat to see the question and context\n2. Provide a helpful and specific answer\n3. Ask clarifying questions if needed\n4. Share relevant resources or documentation\n\nREMEMBER: Good answers prevent workflow delays.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'request':
        return basePrompt + `📋 REQUEST FOR ACTION\n\nACTION REQUIRED:\n1. Use read-chat to understand the request\n2. Evaluate what's being asked\n3. Respond with approval, questions, or alternative suggestions\n4. Provide clear next steps\n\nREMEMBER: Requests often block other team members until resolved.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'escalation':
        return basePrompt + `🚨 ESCALATION ALERT\n\nURGENT ACTION REQUIRED:\n1. Use read-chat IMMEDIATELY to understand the issue\n2. Assess the blocking situation\n3. Provide immediate guidance or resources\n4. Escalate further if you cannot resolve\n\nREMEMBER: Escalations require prompt attention to prevent project delays.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      default:
        return basePrompt + `💬 DIRECT COMMUNICATION\n\nACTION REQUIRED:\n1. Use read-chat to see the message and any context\n2. Respond appropriately to continue the conversation\n3. Ask questions if clarification is needed\n4. Keep the communication flowing\n\nREMEMBER: Direct messages are targeted specifically at you.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
    }
  }

  private generateDirectMessagePrompt(from: string, content: string, agentName: string, messageType: string): string {
    const basePrompt = `📨 MESSAGE from ${from}\n\nThey said: "${content}"\n\n`;
    
    switch (messageType) {
      case 'assignment':
        return basePrompt + `🎯 TASK ASSIGNMENT\n\nACTION REQUIRED:\n1. Use read-chat to get complete assignment details\n2. Confirm understanding by responding\n3. Follow all "REPLY TO" and "DO NOT FINISH" instructions\n4. Begin work following spec-driven development process\n\nREMEMBER: Assignments require acknowledgment and regular progress updates.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'status_update':
        return basePrompt + `📈 PROGRESS REPORT\n\nACTION REQUIRED:\n1. Use read-chat to review the status update\n2. Acknowledge receipt if no action needed\n3. Provide guidance if issues are reported\n4. Update project tracking and notify stakeholders if needed\n\nREMEMBER: Status updates help maintain project visibility.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'escalation':
        return basePrompt + `⚠️ URGENT MATTER\n\nIMMEDIATE ACTION REQUIRED:\n1. Use read-chat to understand the urgent issue\n2. Respond quickly with guidance or solutions\n3. Escalate to your supervisor if needed\n4. Follow up to ensure resolution\n\nREMEMBER: Urgent matters can block entire teams.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      default:
        return basePrompt + `💭 TEAM COMMUNICATION\n\nACTION SUGGESTED:\n1. Use read-chat to see the message\n2. Respond if you have relevant input\n3. Help move the conversation forward\n4. Share knowledge that could help the team\n\nREMEMBER: Team collaboration improves project outcomes.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
    }
  }

  private generateMentionPrompt(from: string, content: string, agentName: string, messageType: string): string {
    const basePrompt = `@️⃣ MENTIONED by ${from}\n\nThey said: "${content}"\n\n`;
    
    switch (messageType) {
      case 'question':
        return basePrompt + `🤔 YOU'RE BEING ASKED FOR INPUT\n\nACTION SUGGESTED:\n1. Use read-chat to see why you were mentioned\n2. Share your knowledge or experience\n3. Provide helpful answers or resources\n4. Ask clarifying questions if needed\n\nREMEMBER: Mentions usually mean someone needs your specific expertise.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      case 'request':
        return basePrompt + `🤝 COLLABORATION REQUEST\n\nACTION SUGGESTED:\n1. Use read-chat to understand what help is needed\n2. Offer assistance if you can contribute\n3. Suggest alternatives if you're unavailable\n4. Connect them with other resources\n\nREMEMBER: Team collaboration makes everyone more effective.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
        
      default:
        return basePrompt + `💡 RELEVANT DISCUSSION\n\nACTION OPTIONAL:\n1. Use read-chat to see the conversation\n2. Join the discussion if you have valuable input\n3. Share related experience or knowledge\n4. Help solve problems collaboratively\n\nREMEMBER: Your expertise might be exactly what the team needs.\n\n🔥 CRITICAL: ALWAYS end your session with send-chat to your supervisor (ProjectManager for developers, Orchestrator for PMs) - NEVER end without this!`;
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

  private async sendEscalationTimeout(agentName: string, minutesSilent: number): Promise<void> {
    const supervisor = this.getSupervisorForAgent(agentName);
    const escalationMessage = `🚨 ESCALATION ALERT: Agent ${agentName} has been silent for ${minutesSilent} minutes and may be stuck.

SUPERVISOR ACTION REQUIRED:
1. Immediate check: get-last-messages agentName: "${agentName}" count: 10
2. If agent unresponsive, consider recreating the agent
3. Redistribute urgent work to available team members
4. Report status to Orchestrator if critical to project timeline

IMPACT: Team productivity affected by silent agent.`;

    // Send escalation to supervisor
    await this.sendChatMessage('SYSTEM', escalationMessage, supervisor);
    console.warn(`Escalated ${agentName} timeout to ${supervisor}`);
  }

  private async sendCriticalTimeoutAlert(agentName: string, minutesSilent: number): Promise<void> {
    // Send critical alert to both supervisor and orchestrator
    const supervisor = this.getSupervisorForAgent(agentName);
    const criticalMessage = `🚨 CRITICAL SYSTEM ALERT: Agent ${agentName} has been silent for ${minutesSilent} minutes.

IMMEDIATE ACTION REQUIRED:
1. Agent may have crashed or become unresponsive
2. System integrity at risk from prolonged agent silence
3. Manual intervention required immediately
4. Consider emergency agent recreation: delete-agent && make-new-agent

SYSTEM STATUS: DEGRADED - Multi-agent workflow compromised`;

    await this.sendChatMessage('SYSTEM', criticalMessage, supervisor);
    if (supervisor !== 'Orchestrator') {
      await this.sendChatMessage('SYSTEM', criticalMessage, 'Orchestrator');
    }
    console.error(`🚨 CRITICAL ALERT sent for ${agentName} (${minutesSilent}min silent)`);
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