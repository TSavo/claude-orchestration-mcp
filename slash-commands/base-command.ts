#!/usr/bin/env npx tsx

import { SessionManager } from '../claude-session.js';
import { sharedChat } from '../shared-chat.js';

export interface CommandArgs {
  [key: string]: any;
}

export interface CommandResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
}

export abstract class BaseCommand {
  protected sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  abstract execute(args: CommandArgs): Promise<CommandResult>;

  protected createPromptResult(prompt: string): CommandResult {
    return {
      content: [{
        type: "text",
        text: prompt
      }]
    };
  }

  protected detectExistingTeam(): { theme: string; agents: string[]; skills: string[] } {
    const sessions = this.sessionManager.listSessions();
    const agents = sessions.map(s => s.name);
    
    // Detect theme from agent names
    let theme = 'auto';
    const matrixNames = ['Neo', 'Trinity', 'Morpheus', 'Agent', 'Oracle'];
    const lotrNames = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo'];
    const starwarsNames = ['Luke', 'Leia', 'Han', 'Obi', 'Yoda'];
    
    if (agents.some(name => matrixNames.some(mn => name.includes(mn)))) theme = 'Matrix';
    else if (agents.some(name => lotrNames.some(ln => name.includes(ln)))) theme = 'LOTR';
    else if (agents.some(name => starwarsNames.some(sn => name.includes(sn)))) theme = 'StarWars';
    
    // Detect skills from agent names/roles
    const skills = [];
    if (agents.some(name => name.toLowerCase().includes('frontend') || name.toLowerCase().includes('ui'))) skills.push('frontend');
    if (agents.some(name => name.toLowerCase().includes('backend') || name.toLowerCase().includes('api'))) skills.push('backend');
    if (agents.some(name => name.toLowerCase().includes('devops') || name.toLowerCase().includes('deploy'))) skills.push('devops');
    
    return { theme, agents, skills };
  }

  protected getCurrentProject(): { name: string; directory: string; type: string } {
    const cwd = process.cwd();
    const projectName = cwd.split('/').pop() || 'Unknown';
    
    // Detect project type from files/structure
    const fs = require('fs');
    let projectType = 'web app';
    
    try {
      if (fs.existsSync('package.json')) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        if (pkg.dependencies?.['react']) projectType = 'React app';
        else if (pkg.dependencies?.['express']) projectType = 'Node.js API';
        else if (pkg.dependencies?.['next']) projectType = 'Next.js app';
      } else if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml')) {
        projectType = 'Python app';
      } else if (fs.existsSync('Cargo.toml')) {
        projectType = 'Rust app';
      }
    } catch {
      // Default to web app
    }
    
    return { name: projectName, directory: cwd, type: projectType };
  }

  protected getUnresponsiveAgents(): string[] {
    // TODO: Implement logic to detect unresponsive agents
    // For now, return empty array - would integrate with timeout system
    return [];
  }
}