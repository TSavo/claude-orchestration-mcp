#!/usr/bin/env npx tsx

import { BaseCommand, CommandArgs, CommandResult } from './base-command.js';

export class HandoffCommand extends BaseCommand {
  async execute(args: CommandArgs): Promise<CommandResult> {
    const { 
      recipient = 'new-team', 
      format = 'complete', 
      timeline = 'planned' 
    } = args;

    const existingTeam = this.detectExistingTeam();
    const project = this.getCurrentProject();
    
    const handoffPrompt = `PROJECT HANDOFF PREPARATION:

Recipient: ${recipient}
Format: ${format}
Timeline: ${timeline}
Project: ${project.name} (${project.type})
Working Directory: ${project.directory}

CURRENT TEAM CONTEXT:
Team: ${existingTeam.agents.join(', ')}
Theme: ${existingTeam.theme}
Skills: ${existingTeam.skills.join(', ') || 'general development'}

HANDOFF PROTOCOL:
1. DOCUMENTATION CONSOLIDATION:
   - Gather all specs from specs/ directory
   - Extract code documentation and README files
   - Compile team notes and decision history from chat logs
   - Create deployment and setup instructions

2. KNOWLEDGE TRANSFER PACKAGE:
${this.getHandoffContent(format)}

3. TEAM KNOWLEDGE EXTRACTION:
   - Interview each team member about their work areas
   - Document unwritten knowledge and context
   - Capture any technical debt or known issues
   - Record ongoing work and next priorities

4. TECHNICAL DOCUMENTATION:
   - Complete API documentation
   - Update deployment procedures
   - Document environment setup and dependencies
   - Create troubleshooting guides

5. HANDOFF DELIVERABLES:
   - Executive summary for stakeholders
   - Technical documentation for new team
   - Operational runbooks for maintenance
   - Contact information and escalation procedures

URGENCY LEVEL: ${this.getUrgencyLevel(timeline)}

RECIPIENT-SPECIFIC FORMATTING:
${this.getRecipientFormatting(recipient)}

Execute comprehensive handoff preparation with complete knowledge transfer.`;

    return this.createPromptResult(handoffPrompt);
  }

  private getHandoffContent(format: string): string {
    const contents = {
      'technical': '   - Complete technical specifications and architecture docs\n   - Code documentation and API references\n   - Setup and deployment instructions\n   - Technical debt and maintenance notes',
      'executive': '   - Project overview and business objectives\n   - Key achievements and deliverables\n   - Resource requirements and timelines\n   - Risk assessment and mitigation strategies',
      'operational': '   - Day-to-day operational procedures\n   - Monitoring and maintenance schedules\n   - Escalation procedures and contacts\n   - Performance metrics and KPIs',
      'complete': '   - All technical, executive, and operational documentation\n   - Comprehensive knowledge base\n   - Video walkthroughs of key systems\n   - Q&A sessions with outgoing team'
    };
    
    return contents[format] || contents['complete'];
  }

  private getUrgencyLevel(timeline: string): string {
    const urgencies = {
      'immediate': 'CRITICAL - Handoff needed within 48 hours',
      'planned': 'STANDARD - Planned transition with adequate preparation time',
      'future': 'LOW - Preparation for future handoff, focus on documentation'
    };
    
    return urgencies[timeline] || urgencies['planned'];
  }

  private getRecipientFormatting(recipient: string): string {
    const formats = {
      'new-team': '- Technical focus with detailed setup instructions\n- Code walkthroughs and architecture explanations\n- Development workflow and team practices',
      'client': '- Business-focused documentation\n- User manuals and operational guides\n- Minimal technical detail, maximum usability',
      'maintenance': '- Operational procedures and troubleshooting\n- Monitoring setup and alert configurations\n- Vendor contacts and support procedures',
      'stakeholder': '- Executive summary and business impact\n- ROI analysis and success metrics\n- Strategic recommendations for future development'
    };
    
    return formats[recipient] || formats['new-team'];
  }
}