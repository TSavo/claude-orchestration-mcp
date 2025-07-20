#!/usr/bin/env npx tsx

import { SessionManager } from '../claude-session.js';
import { BaseCommand } from './base-command.js';
import { ScaleCommand } from './scale-command.js';
import { DeployCommand } from './deploy-command.js';
import { FocusCommand } from './focus-command.js';
import { RestartCommand } from './restart-command.js';
import { SprintCommand } from './sprint-command.js';
import { ReviewCommand } from './review-command.js';
import { HandoffCommand } from './handoff-command.js';
import { AuditCommand } from './audit-command.js';
import { ReleaseCommand } from './release-command.js';
import { DebugCommand } from './debug-command.js';
import { SpecsCommand } from './specs-command.js';
import { BugCommand } from './bug-command.js';
import { BugsCommand } from './bugs-command.js';
import { PushCommand } from './push-command.js';
import { PrCommand } from './pr-command.js';
import { BranchCommand } from './branch-command.js';
import { MergeCommand } from './merge-command.js';
import { StatusCommand } from './status-command.js';
import { GitStatusCommand } from './gitstatus-command.js';
import { CloneCommand } from './clone-command.js';
import { StashCommand } from './stash-command.js';
import { HelpCommand } from './help-command.js';

export class CommandRegistry {
  private commands = new Map<string, BaseCommand>();
  
  constructor(sessionManager: SessionManager) {
    // Register all slash command prompt generators
    
    // Project Management
    this.commands.set('scale', new ScaleCommand(sessionManager));
    this.commands.set('deploy', new DeployCommand(sessionManager));
    this.commands.set('focus', new FocusCommand(sessionManager));
    this.commands.set('restart', new RestartCommand(sessionManager));
    this.commands.set('sprint', new SprintCommand(sessionManager));
    this.commands.set('status', new StatusCommand(sessionManager));
    
    // Quality & Process
    this.commands.set('review', new ReviewCommand(sessionManager));
    this.commands.set('handoff', new HandoffCommand(sessionManager));
    this.commands.set('audit', new AuditCommand(sessionManager));
    this.commands.set('release', new ReleaseCommand(sessionManager));
    this.commands.set('debug', new DebugCommand(sessionManager));
    this.commands.set('specs', new SpecsCommand(sessionManager));
    
    // GitHub Integration
    this.commands.set('bug', new BugCommand(sessionManager));
    this.commands.set('bugs', new BugsCommand(sessionManager));
    this.commands.set('pr', new PrCommand(sessionManager));
    this.commands.set('clone', new CloneCommand(sessionManager));
    
    // Git Workflow
    this.commands.set('push', new PushCommand(sessionManager));
    this.commands.set('branch', new BranchCommand(sessionManager));
    this.commands.set('merge', new MergeCommand(sessionManager));
    this.commands.set('gitstatus', new GitStatusCommand(sessionManager));
    this.commands.set('stash', new StashCommand(sessionManager));
    
    // System Help
    this.commands.set('help', new HelpCommand(sessionManager));
  }
  
  getCommand(name: string): BaseCommand | undefined {
    return this.commands.get(name);
  }
  
  getAllCommands(): string[] {
    return Array.from(this.commands.keys());
  }
  
  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }
}