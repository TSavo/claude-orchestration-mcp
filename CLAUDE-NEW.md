# Claude.md - Multi-Agent Orchestration System

## 🎯 Quick Start Guide

This system enables AI agents to work together through shared chat communication. Each role has specific responsibilities and protocols.

### 📚 Read Your Role Guide FIRST

**CRITICAL**: Before doing anything, read the guide for your role:

- **🎭 Orchestrator**: Read `docs/ORCHESTRATOR.md` 
- **📋 Project Manager**: Read `docs/PROJECT-MANAGER.md`
- **👨‍💻 Developer**: Read `docs/DEVELOPER.md`

## 🚨 Core Communication Rule

**ALL COMMUNICATION HAPPENS VIA CHAT** - except for initial agent creation.

- `send-agent-command` - **ONLY for Orchestrator creating new agents**
- `send-chat` + `read-chat` - **Everything else uses these tools**

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

## 🔄 Basic Workflow

### 1. Orchestrator Creates Team
```bash
# Create PM first
make-new-agent name: "ProjectManager" model: "sonnet"
send-agent-command agentName: "ProjectManager" command: "[Full briefing - see ORCHESTRATOR.md]"

# Assign work via chat
send-chat from: "Orchestrator" content: "@ProjectManager Project: [details]. Create team and begin." to: "ProjectManager"
```

### 2. PM Creates Development Team
```bash
# Create developers
make-new-agent name: "Caleb" model: "sonnet"  # Use creative themes!
make-new-agent name: "Ava" model: "sonnet"

# Brief via chat (NOT send-agent-command)
send-chat from: "ProjectManager" content: "@Caleb [Full briefing - see PROJECT-MANAGER.md]" to: "Caleb"
```

### 3. Spec-Driven Development
**NO DEVELOPMENT WITHOUT 3 APPROVED SPECS:**
1. requirements.md → Approval → 
2. design.md → Approval → 
3. tasks.md → Approval → 
4. Implementation begins

### 4. Phase-by-Phase Implementation
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

## 📊 Communication Patterns

### Status Updates
```bash
send-chat from: "Developer" content: "STATUS: Completed [task], working on [current], ETA [time], blockers: [none/specific]" to: "ProjectManager"
```

### Task Completion
```bash
send-chat from: "Developer" content: "TASK COMPLETE: [TaskName] - [deliverables]. Quality: [test results]. Ready for review." to: "ProjectManager"
```

### Milestone Reporting
```bash
send-chat from: "ProjectManager" content: "MILESTONE COMPLETE: [FeatureName] - [team contributions]. Quality verified. Ready for deployment." to: "Orchestrator"
```

### Approval Requests
```bash
send-chat from: "ProjectManager" content: "APPROVAL REQUEST: [spec type] for [feature] by [developer]. File: [path]. Please review." to: "Orchestrator"
```

## 🚨 Error Recovery

### If Agent Becomes Unresponsive:
1. `get-last-messages agentName: "[name]" count: 5`
2. `send-chat from: "[YourName]" content: "Status check - please confirm responsive" to: "[name]"`
3. Escalate to supervisor if no response

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