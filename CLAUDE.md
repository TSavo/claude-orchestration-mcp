# Claude.md - Multi-Agent Orchestration System

## 🎯 Quick Start Guide

This system enables AI agents to work together through shared chat communication. Each role has specific responsibilities and protocols.

### 📚 Read Your Role Guide FIRST

**CRITICAL**: Before doing anything, read the guide for your role:

- **🎭 Orchestrator**: Read `docs/ORCHESTRATOR.md` 
- **📋 Project Manager**: Read `docs/PROJECT-MANAGER.md`
- **👨‍💻 Developer**: Read `docs/DEVELOPER.md`

## 🚨 CRITICAL Communication Rules

**ALL COMMUNICATION HAPPENS VIA CHAT** - except for initial agent creation.

- `send-agent-command` - **ONLY for Orchestrator creating new agents**
- `send-chat` + `read-chat` - **Everything else uses these tools**

### 🚨 MANDATORY: Every Order Must Include Reply Instructions

**ABSOLUTELY CRITICAL**: Every chat message giving orders MUST include explicit instructions on who to reply to and that they cannot finish without replying.

**REQUIRED FORMAT FOR ALL TASK ASSIGNMENTS:**
```bash
send-chat from: "[YourRole]" content: "[Task details]. 
REPLY TO: @[YourRole] when complete. 
DO NOT FINISH this session without sending me a completion message and asking what to do next." to: "[AgentName]"
```

**MANDATORY REPORTING CHAIN:**
- **Orchestrator**: Must ask user "What would you like me to do next?" after reading team updates
- **Project Manager**: Must send status/completion to @Orchestrator via chat before finishing
- **Developer**: Must report task completion to @ProjectManager via chat before finishing

**COMMUNICATION BALL RULE**: The ball of communication MUST start and end with the user. Every agent must communicate with their supervisor before ending - whether asking questions, reporting completion, requesting clarification, or providing status updates. Natural back-and-forth communication is encouraged as long as the chain of command is maintained.

**MANDATORY PROTOCOL ENFORCEMENT**: The Orchestrator MUST brief every Project Manager to enforce this strict protocol on ALL developer communications. Project Managers MUST include the strict format in EVERY developer briefing. This protocol must be explicitly communicated and enforced at every level.

## 🏗️ System Architecture

```
                    Orchestrator
                         |
                  Project Manager
                    /    |    \
            Developer Developer Developer
```

### Communication Chain
**Orchestrator → PM → Developer → PM → Orchestrator**

- **Project Managers** act as buffers, managing multiple work cycles with developers
- **Developers** report to PM, who aggregates progress before reporting to Orchestrator
- **No level skipping** - follow the chain of command

## 🔄 Complete Workflow Cycle

### 1. User Request → Orchestrator
```bash
# User wants feature implemented
User: "I want user authentication system"
```

### 2. Orchestrator → Project Manager (STRICT FORMAT)
```bash
# Orchestrator assigns work with explicit reply instructions
send-chat from: "Orchestrator" content: "ASSIGNMENT: User wants authentication system. Pick a developer and create requirements spec.

REPLY TO: @Orchestrator when you have assigned this and report which developer is working on it.
DO NOT FINISH this session without sending me a status update." to: "ProjectManager"
# → Triggers: automatic notification to ProjectManager
```

### 3. Project Manager → Developer (STRICT FORMAT)
```bash
# Project manager assigns spec work with mandatory reply instructions
send-chat from: "ProjectManager" content: "TASK_ASSIGNED: Create requirements spec for UserAuth system using EARS format.
Working Directory: /full/path/to/project
Use docs/DEVELOPER.md for complete spec examples.

REPLY TO: @ProjectManager when you complete the requirements.md file.
DO NOT FINISH this session without sending me a completion message and asking what to do next." to: "Trinity"
# → Triggers: automatic notification to Trinity
```

### 4. Developer Completes → Project Manager
```bash
# Developer finishes requirements
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Ready for review" to: "ProjectManager"
# → Triggers: automatic notification to ProjectManager
```

### 5. Project Manager Decision Point
Project Manager has **TWO OPTIONS**:

**Option A: Request Changes from Developer**
```bash
send-chat from: "ProjectManager" content: "REVISION_REQUIRED:UserAuth requirements - Need more detail on password policies" to: "Trinity"
# → Back to step 4 (developer revises)
```

**Option B: Send to Orchestrator for Supervisor Approval**
```bash
send-chat from: "ProjectManager" content: "READY_FOR_APPROVAL:UserAuth requirements complete - awaiting supervisor review" to: "Orchestrator"
# → Triggers: automatic notification to Orchestrator
```

### 6. Orchestrator Review and User Presentation
```bash
# Orchestrator presents to user
Orchestrator: "Trinity completed UserAuth requirements. Review and approve?"
User: "Approved, proceed to design phase"
```

### 7. Approval Chain Down
```bash
# Orchestrator → Project Manager
send-chat from: "Orchestrator" content: "USER_APPROVED:UserAuth requirements - proceed to design phase" to: "ProjectManager"

# Project Manager → Developer  
send-chat from: "ProjectManager" content: "APPROVED:UserAuth requirements. Begin design phase" to: "Trinity"

# Developer starts next phase...
```

### 8. Spec-Driven Development (3 Phases)
**NO DEVELOPMENT WITHOUT 3 APPROVED SPECS:**
1. requirements.md → Approval → 
2. design.md → Approval → 
3. tasks.md → Approval → 
4. Implementation begins

### 9. Phase-by-Phase Implementation
Developers implement in phases, reporting completion after each phase to PM.

## 📋 Available MCP Tools

### For Everyone
- `send-chat` - Send messages (your primary tool)
- `read-chat` - Check messages directed at you

### For Orchestrator Only
- `make-new-agent` - Create new agents
- `send-agent-command` - **ONLY for initial briefing of new agents**
- `get-last-messages`, `delete-agent`, `clear-agent` - Management tools

### For Project Manager Only  
- `make-new-agent` - Create development team
- `get-last-messages` - Troubleshooting only

## 🎬 Team Naming Themes

**Be creative!** Don't default to Ocean's Eleven. Match themes to your project:

- **AI/ML**: Ex Machina (Caleb, Ava, Nathan, Kyoko)
- **Security**: Sneakers (Bishop, Whistler, Mother, Crease)
- **Mobile**: Fast & Furious (Dom, Brian, Letty, Roman)
- **API**: Matrix (Neo, Trinity, Morpheus, Link)
- **Gaming**: Ready Player One (Wade, Art3mis, Aech, Sho)
- **Startup**: Guardians (Quill, Gamora, Rocket, Groot)

## 🔐 Git Discipline - MANDATORY

### All Developers Must:
- **Commit every 30 minutes** with meaningful messages
- **Use feature branches** for all work
- **Never leave uncommitted changes**
- **Report major commits via chat**

### Good Commit Messages:
✅ "Add user authentication endpoints with JWT tokens"  
✅ "Fix null pointer in payment processing module"  
❌ "fixes", "updates", "changes"

## 📊 Comprehensive Communication Patterns

### 🚨 MANDATORY Completion Notifications

**CRITICAL**: Every agent MUST notify their supervisor when work is complete. This ensures continuous workflow and prevents work from stalling.

### Daily Standup Flow
```bash
# PM requests daily updates
send-chat from: "ProjectManager" content: "🌅 DAILY STANDUP: Please provide: 1) Yesterday's completed work, 2) Today's focus, 3) Any blockers. Tag @ProjectManager in responses."

# Team members respond
send-chat from: "Trinity" content: "@ProjectManager STANDUP: ✅ Completed user auth UI, 🎯 Today: Dashboard components, ❌ No blockers"
send-chat from: "Morpheus" content: "@ProjectManager STANDUP: ✅ Completed API endpoints, 🎯 Today: Database optimization, ⚠️ Blocked: Need S3 credentials"

# PM escalates blockers to Orchestrator
send-chat from: "ProjectManager" content: "@Orchestrator Morpheus blocked on S3 credentials for file upload feature. Can you provide access?" to: "Orchestrator"
```

### Task Assignment Pattern (STRICT FORMAT)
```bash
# Structured task format with mandatory reply instructions
send-chat from: "ProjectManager" content: "📋 TASK-001: Payment Integration
Assigned: @Morpheus
Objective: Implement Stripe payment processing
Success Criteria:
- Create payment intent endpoint
- Handle payment confirmation webhook  
- Store transaction records
- Add error handling and logging
Priority: HIGH
Deadline: End of week
Dependencies: User authentication (complete)

REPLY TO: @ProjectManager when complete.
DO NOT FINISH this session without sending me a completion message and asking what to do next." to: "Morpheus"
```

### Completion Notification Pattern
```bash
# Developer completion report
send-chat from: "Morpheus" content: "✅ TASK-001 COMPLETE: Payment Integration
- Payment intent endpoint: POST /api/payments/intent ✅
- Webhook handler: POST /api/payments/webhook ✅  
- Transaction logging: Database + audit trail ✅
- Error handling: Comprehensive validation ✅
- Tests: Unit tests 95% coverage ✅
@ProjectManager Ready for code review and testing"

# PM validation and escalation
send-chat from: "ProjectManager" content: "@Orchestrator Payment system complete and tested. Revenue pipeline ready for production deployment. Request: Deploy to staging for final validation"
```

### Spec Completion Notifications
```bash
# Requirements phase
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Requirements ready for review. File: specs/user-auth/requirements.md" to: "ProjectManager"

# Design phase  
send-chat from: "Trinity" content: "SPEC_COMPLETE:DESIGN:UserAuth - Architecture includes JWT tokens, password hashing, 2FA. Ready for review." to: "ProjectManager"

# Implementation planning
send-chat from: "Trinity" content: "SPEC_COMPLETE:TASKS:UserAuth - 4 phases defined with clear deliverables. Ready to begin Phase 1." to: "ProjectManager"
```

### Phase Completion Pattern
```bash
# Phase progress reporting
send-chat from: "Trinity" content: "PHASE_COMPLETE:1:UserAuth - Phase 1 implementation complete
- User model and authentication middleware ✅
- JWT token generation and validation ✅
- Password hashing with bcrypt ✅
Tests: 98% coverage. Ready for Phase 2?" to: "ProjectManager"
```

### Escalation Template
```bash
send-chat from: "Trinity" content: "🚨 ESCALATION: Database Connection Issues
Impact: HIGH - Cannot complete user authentication testing
Tried: Restarted services, checked credentials, reviewed logs
Need: Database admin access or alternative test environment
Urgency: Blocking Phase 2 completion, affects sprint deadline" to: "ProjectManager"
```

### Status Updates
```bash
send-chat from: "Trinity" content: "STATUS: Completed login endpoint, working on password reset flow, ETA 2 hours, blockers: none" to: "ProjectManager"
```

### Approval Requests (PM to Orchestrator)
```bash
send-chat from: "ProjectManager" content: "APPROVAL REQUEST: Requirements spec for UserAuth by Trinity. 
Key features: JWT authentication, 2FA support, password policies
File: specs/user-auth/requirements.md
Please review and approve to proceed to design phase." to: "Orchestrator"
```

## 🔄 Revision Cycle (When Changes Needed)

```bash
# User requests changes
User: "Add 2FA requirement to authentication"

# Orchestrator → Project Manager
send-chat from: "Orchestrator" content: "USER_REVISION:UserAuth - add 2FA requirement to existing spec" to: "ProjectManager"

# Project Manager → Developer
send-chat from: "ProjectManager" content: "REVISION_REQUIRED:UserAuth requirements - user wants 2FA added. Please update specs/user-auth/requirements.md" to: "Trinity"

# Developer makes changes → notifies Project Manager → Project Manager sends to Orchestrator
# Cycle repeats until approved
```

## 🔔 Automatic Notification System

**IMPORTANT**: The system automatically detects and handles targeted messages for all agents.

### How It Works

1. **Automatic Detection**: Before processing any command, agents automatically check for targeted messages directed at them (@mentions or direct targeting)

2. **Prompt Enhancement**: If targeted messages are found, the system prepends instructions to the agent's prompt

3. **Workflow Integration**: Chat messages trigger automatic notifications to keep work flowing

### Notification Trigger Examples

**Work Assignment:**
```bash
send-chat from: "ProjectManager" content: "TASK_ASSIGNED:Dashboard - Please create requirements spec" to: "Trinity"
# → Triggers: automatic notification to Trinity
```

**Spec Completion:**
```bash
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Ready for review" to: "ProjectManager"
# → Triggers: automatic notification to ProjectManager
```

**Phase Validation:**
```bash
send-chat from: "Trinity" content: "PHASE_COMPLETE:1:UserAuth - Phase 1 implementation complete" to: "ProjectManager"
# → Triggers: automatic notification to ProjectManager
```

## 🚨 Error Recovery

### If Agent Becomes Unresponsive:
1. `get-last-messages agentName: "[name]" count: 5`
2. `send-chat from: "[YourName]" content: "Status check - please confirm responsive" to: "[name]"`
3. Escalate to supervisor if no response

### Agent Management Tools (Orchestrator Only)

**Summarize Agent History:**
```bash
summarize-agent agentName: "Trinity"
# Creates summary of agent's work history, useful before clearing or for context
```

**Clear Agent History:**
```bash
clear-agent agentName: "Trinity" 
# Resets agent to fresh state, keeps agent alive
```

**Delete Agent:**
```bash
delete-agent agentName: "Trinity"
# Permanently removes agent and all history
```

### If System Issues:
- Check `.claude-chat.json` for last known state
- Review individual agent histories
- Recreate critical agents if needed

## 📁 File Structure
```
/project-root/
├── docs/
│   ├── ORCHESTRATOR.md    # Orchestrator role guide
│   ├── PROJECT-MANAGER.md # PM role guide
│   └── DEVELOPER.md       # Developer role guide
├── specs/
│   └── [feature-name]/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── .claude-chat.json      # Shared chat system
├── .mcp.json             # Project MCP configuration
└── CLAUDE.md             # This overview file
```

## 🎯 Success Metrics

- **Teams operate autonomously** with minimal Orchestrator intervention
- **Regular milestone updates** flow through proper chain of command
- **Quality standards maintained** with comprehensive testing
- **User stays informed** of progress through Orchestrator updates

---

## 🚀 Ready to Start?

1. **Read your role guide** from `docs/` directory
2. **Follow communication protocols** (chat for everything)
3. **Respect the chain of command** (no level skipping)
4. **Use spec-driven development** (3 specs before coding)
5. **Maintain git discipline** (commit frequently)

**Remember**: This system works through persistent chat communication and proper session management. All agents share the same communication infrastructure while maintaining individual expertise.