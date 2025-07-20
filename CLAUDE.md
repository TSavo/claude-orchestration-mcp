# Claude.md - Multi-Agent Orchestration System

## 📚 READ YOUR ROLE GUIDE FIRST

**CRITICAL**: Before doing anything, read the guide for your role:

- **🎭 Orchestrator**: Read `docs/ORCHESTRATOR.md` 
- **📋 Project Manager**: Read `docs/PROJECT-MANAGER.md`
- **👨‍💻 Developer**: Read `docs/DEVELOPER.md`
- **📖 Communication Examples**: Read `docs/COMMUNICATION-PROTOCOL.md`

## 🚨 ESSENTIAL RULES EVERYONE MUST KNOW

### 1. Communication Protocol
- **ALL communication via chat** (except Orchestrator creating agents)
- **Chain of command**: User → Orchestrator → PM → Developer → PM → Orchestrator → User
- **Active participation encouraged** - jump into conversations when you have relevant information to offer
- **Help your teammates** - if you see a question you can answer, answer it!

### 2. Chat Types - Use "to:" for Better Teamwork!
**Group Chat** (open collaboration):
```bash
send-chat from: "[YourRole]" content: "Status update or question for the team"
# Anyone can reply if relevant
```

**Direct Agent-to-Agent** (focused collaboration):
```bash
send-chat from: "[YourRole]" content: "@AgentName Can you help with the database schema? I need advice on user table relationships." to: "AgentName"
# Creates direct line of communication between team members
```

**Assignments/Session Endings** (mandatory chain of command):
```bash
send-chat from: "[YourRole]" content: "[Task details]. 
REPLY TO: @[YourRole] when [condition].
DO NOT FINISH this session without communicating with me." to: "[AgentName]"
```

**💡 TIP**: Use "to:" for any focused conversation - it's a powerful tool for agent-to-agent teamwork!

### 3. 🚨 CRITICAL: Session Ending Protocol - SYSTEM BREAKS IF VIOLATED
**🔥 ABSOLUTELY MANDATORY - SYSTEM FAILURE IF NOT FOLLOWED 🔥**

**SESSIONS MUST END with send-chat ... to: [supervisor] - NO EXCEPTIONS!**
- **Orchestrator**: Must ask user "What would you like me to do next?"
- **Project Manager**: Must use `send-chat ... to: "Orchestrator"` before ending
- **Developer**: Must use `send-chat ... to: "ProjectManager"` before ending

**⚠️ WARNING**: If you end a session without "send-chat ... to:" your supervisor, **THE ENTIRE MULTI-AGENT SYSTEM BREAKS DOWN**. You will strand your teammates and kill all progress.

### 4. System Architecture
```
User → Orchestrator → Project Manager → Developer(s)
```

### 5. Core Tools
- **send-chat** + **read-chat** - **PRIMARY communication tools** (everyone)
- **make-new-agent** - Create agents (Orchestrator + PM only)
- 🚨 **"to:" REQUIRED for session endings and assignments only**

**Orchestrator Management Tools** (debugging stuck agents only):
- **send-agent-command** - Emergency debugging/unsticking agents
- **get-last-messages** - Check agent conversation history
- **delete-agent**, **clear-agent** - Agent management

### 6. Spec-Driven Development
**NO CODING WITHOUT 3 APPROVED SPECS:**
1. requirements.md → Approval →
2. design.md → Approval →  
3. tasks.md → Approval →
4. Implementation begins

1. **Read your role guide** from the `docs/` directory
2. **Use the startup script**: Run `./start-orchestrator.sh` to begin
3. **Follow the communication protocol** with mandatory reply instructions
4. **Respect chain of command** - no level skipping
5. **Use spec-driven development** - 3 specs before any coding

## 📁 File Structure
```
/project-root/
├── docs/
│   ├── ORCHESTRATOR.md        # Complete orchestrator guide
│   ├── PROJECT-MANAGER.md     # Complete PM guide  
│   ├── DEVELOPER.md           # Complete developer guide
│   └── COMMUNICATION-PROTOCOL.md # Detailed examples
├── specs/                     # All feature specifications
├── .claude-chat.json         # Shared chat system
├── .mcp.json                 # Project MCP configuration
└── start-orchestrator.sh     # Launch script
```

## 🎬 Quick Tips
- **Creative team names** - don't default to Ocean's Eleven
- **Commit every 30 minutes** with meaningful git messages  
- **Auto-notifications** - chat messages trigger alerts to recipients
- **Auto-timeout alerts** - agents get prompted to report status if silent for 30+ minutes
- **Error recovery** - use MCP management tools if agents become unresponsive

---

**Remember**: This system works through persistent chat communication. Each role has detailed guides with examples, templates, and workflows. Read your role guide first!


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