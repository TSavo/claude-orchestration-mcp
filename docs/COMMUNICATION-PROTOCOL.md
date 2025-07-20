# Strict Communication Protocol

## 🚨 CRITICAL RULE: Every Order Must Include Reply Instructions

**ABSOLUTELY MANDATORY**: Every chat message giving orders MUST include explicit instructions on who to reply to and that they cannot finish without replying.

**THE COMMUNICATION BALL RULE**: The ball of communication MUST start and end with the USER. No agent can end a session without communicating with their supervisor - this includes questions, clarifications, status updates, or completion reports. Back-and-forth communication is encouraged as long as the chain of command is maintained.

## Three Types of Communication - Use "to:" for Better Teamwork!

### 1. Group Chat (No "to:" - Open Collaboration)
```bash
send-chat from: "[YourRole]" content: "Team: Anyone know the best approach for handling JWT refresh tokens?"
# Anyone can respond and help - JUMP IN if you have relevant knowledge!
```

**🤝 ACTIVE PARTICIPATION ENCOURAGED**: If you see any conversation where you have relevant information, experience, or advice - jump in and help! Even if you weren't directly addressed, good teams share knowledge freely.

### 2. Agent-to-Agent Direct (With "to:" - Focused Collaboration)
```bash
send-chat from: "[YourRole]" content: "@AgentName Can you help me with the database schema? I need advice on user relationships." to: "AgentName"
# Creates direct line of communication for specific help
```

### 3. Chain of Command (With "to:" - Assignments/Session Endings)
```bash
send-chat from: "[YourRole]" content: "[Assignment details] 
REPLY TO: @[YourRole] when complete.
DO NOT FINISH without communicating with me." to: "[AgentName]"
```

**💡 POWERFUL TEAMWORK**: Use "to:" liberally for focused conversations, peer collaboration, knowledge sharing, and coordination. It's not just for assignments - it's for better teamwork!

**🚀 EXAMPLE of Active Participation:**
```bash
# Developer asks group question
send-chat from: "Trinity" content: "Team: Having trouble with Redis connection pooling. Any suggestions?"

# Another developer jumps in to help (even though not directly asked)
send-chat from: "Morpheus" content: "Trinity: I had the same issue last week! Try increasing max_connections to 50 and timeout to 5000ms. Also check your Redis memory config."

# PM adds coordination help
send-chat from: "ProjectManager" content: "Good catch Morpheus! Trinity, let me know if you need more Redis resources provisioned."
```

**Key**: Everyone actively helps when they have relevant knowledge to share!

**⚠️ CRITICAL**: Sessions must always end with direct communication to your supervisor using "to:". **If you end a session without `send-chat ... to: [supervisor]`, THE ENTIRE MULTI-AGENT SYSTEM BREAKS DOWN**.

## 🔔 Automatic Timeout System (3-Level Escalation)

**SMART FEATURE**: Multi-level timeout system with automatic escalation:

### Level 1: Basic Timeout (30 minutes)
**ACTION**: Agent receives reminder prompt to report status

### Level 2: Escalation (60 minutes) 
**ACTION**: Supervisor receives escalation alert about silent agent

### Level 3: Critical Alert (90 minutes)
**ACTION**: Both supervisor AND orchestrator receive critical system alerts

**Example Timeout Prompt** (Level 1):

```
⏰ TIMEOUT ALERT: You haven't been active in chat for 30+ minutes. Please report your current status to your supervisor:

- **Developers**: send-chat to "ProjectManager" with current progress
- **Project Managers**: send-chat to "Orchestrator" with team status  
- **Orchestrator**: Ask user "What would you like me to do next?"

This keeps the workflow alive and prevents silent agents from stalling the system.
```

**Simple Implementation:**
```javascript
// In .claude-chat.json or separate tracking file
{
  "agent_last_notification": {
    "ProjectManager": "2024-01-15T14:30:00Z",
    "Trinity": "2024-01-15T14:25:00Z", 
    "Morpheus": "2024-01-15T14:45:00Z"
  }
}

// Job runs every 5 minutes, checks for agents silent > 30 minutes
// Automatically sends notification to prompt status report
```

**Enhanced Benefits:**
- **3-level escalation** - prevents silent failures with increasing urgency
- **Automatic supervisor notification** - managers know when team members are stuck
- **Critical system alerts** - orchestrator awareness of system health issues
- **Smart intervention** - different responses based on silence duration
- **Workflow preservation** - ensures communication chain stays active
- **Configurable timing** - adjust all three thresholds based on project needs
- **Comprehensive monitoring** - full visibility into agent responsiveness

### Decision Tree for Timeout Handling

```
Agent Silent?
├─ < 30min → Normal operation
├─ 30-60min → Send timeout reminder to agent
├─ 60-90min → Escalate to supervisor + send agent reminder
└─ > 90min → Critical alert to supervisor + orchestrator
              ├─ Manual intervention required
              ├─ Consider agent recreation
              └─ Redistribute critical work
```

### Error Handling Decision Tree

```
Error Encountered?
├─ Directory Error?
│   ├─ Wrong directory → cd [correct-path] + validate
│   ├─ Missing files → Check project structure + escalate
│   └─ Permission denied → Report to supervisor immediately
│
├─ Agent Communication Error?
│   ├─ Agent unresponsive → get-last-messages + supervisor alert
│   ├─ Chat system down → Critical escalation to orchestrator
│   └─ MCP tool failed → Retry once + escalate if persists
│
├─ Code/Build Error?
│   ├─ Compilation failed → Fix immediately before continuing
│   ├─ Test failure → Do not commit + get help
│   └─ Unknown error → Capture full context + escalate
│
└─ System Error?
    ├─ Low disk space → Alert orchestrator + clean logs
    ├─ Permission issues → Document + escalate immediately
    └─ Unknown system issue → Full context capture + critical alert
```

### Task Assignment Decision Tree

```
Assigning Task?
├─ Is working directory specified? (REQUIRED)
├─ Are "REPLY TO" instructions clear? (REQUIRED)
├─ Are "DO NOT FINISH" instructions included? (REQUIRED)
├─ Is completion condition specific? (REQUIRED)
├─ Are prerequisites mentioned? (RECOMMENDED)
└─ Is escalation path clear? (RECOMMENDED)

If ANY required element missing → STOP + revise assignment
```

## Required Format for ALL Task Assignments

**EVERY chat message giving orders or assignments MUST include this format:**

```bash
send-chat from: "[YourRole]" content: "[Task details].
Working Directory: [/full/path/to/project]

PROTOCOL REMINDER: Use send-chat for all communication. Follow chain of command.

REPLY TO: @[YourRole] when [completion condition] OR if you have questions/need clarification.
DO NOT FINISH this session without communicating with me - whether it's completion, questions, blockers, or status updates." to: "[AgentName]"
```

## Orchestrator → Project Manager Examples

### Project Assignment
```bash
send-chat from: "Orchestrator" content: "PROJECT ASSIGNMENT: Build user authentication system.
Working Directory: /home/user/projects/my-app
Requirements: JWT tokens, password hashing, 2FA support
Team Size: 3 developers
Theme: Matrix (Neo, Trinity, Morpheus)
Priority: HIGH

PROTOCOL REMINDER: Use send-chat for all communication. Follow chain of command.

REPLY TO: @Orchestrator when you have created your team and assigned the requirements spec OR if you need clarification.
DO NOT FINISH this session without communicating with me - status update, questions, or next steps." to: "ProjectManager"
```

### Approval Response
```bash
send-chat from: "Orchestrator" content: "APPROVAL GRANTED: UserAuth requirements spec approved. Proceed to design phase.

PROTOCOL REMINDER: Use send-chat for all communication. Follow chain of command.

REPLY TO: @Orchestrator when the design spec is complete and ready for review.
DO NOT FINISH this session without sending me an update on design phase progress." to: "ProjectManager"
```

### Priority Change
```bash
send-chat from: "Orchestrator" content: "PRIORITY CHANGE: UserAuth is now URGENT due to security audit. Please expedite.

PROTOCOL REMINDER: Use send-chat for all communication. Follow chain of command.

REPLY TO: @Orchestrator with updated timeline and any resource needs.
DO NOT FINISH this session without sending me a revised completion estimate." to: "ProjectManager"
```

## Project Manager → Developer Examples

### Spec Assignment
```bash
send-chat from: "ProjectManager" content: "SPEC ASSIGNMENT: Create requirements.md for UserAuth system.
Working Directory: /home/user/projects/my-app
Use EARS syntax as shown in docs/DEVELOPER.md
You will be implementing this feature after spec approval.
File Location: specs/user-auth/requirements.md

PROTOCOL REMINDER: Use send-chat for all communication. Report to @ProjectManager only.

REPLY TO: @ProjectManager when you complete the requirements spec OR if you have questions.
DO NOT FINISH this session without communicating with me - completion, questions, or clarification needed." to: "Trinity"
```

### Implementation Phase Assignment
```bash
send-chat from: "ProjectManager" content: "IMPLEMENTATION APPROVED: Begin Phase 1 of UserAuth implementation.
Working Directory: /home/user/projects/my-app
Tasks: Project setup, database schema, basic auth endpoints
Reference: specs/user-auth/tasks.md for detailed checklist
Estimated Time: 6-8 hours

REPLY TO: @ProjectManager when Phase 1 is complete with deliverables summary.
DO NOT FINISH this session without sending me a completion message and asking about Phase 2." to: "Trinity"
```

### Revision Request
```bash
send-chat from: "ProjectManager" content: "REVISION REQUIRED: UserAuth requirements need more detail on password policies.
Working Directory: /home/user/projects/my-app
Specific Changes Needed:
- Add password complexity requirements
- Specify account lockout policies
- Add password reset flow details

REPLY TO: @ProjectManager when you have updated the requirements.md file.
DO NOT FINISH this session without sending me a completion message confirming the revisions." to: "Trinity"
```

## Developer → Project Manager Examples

### Spec Completion
```bash
send-chat from: "Trinity" content: "SPEC COMPLETE: Requirements.md for UserAuth system finished.
File: specs/user-auth/requirements.md
Key Requirements: JWT auth, bcrypt hashing, 2FA support, password policies
EARS syntax used throughout
Ready for your review and approval request to Orchestrator.

What should I work on while waiting for approval?" to: "ProjectManager"
```

### Phase Completion  
```bash
send-chat from: "Trinity" content: "PHASE 1 COMPLETE: UserAuth foundation implemented.
Deliverables:
- Database schema created and migrated ✓
- Basic Express server with TypeScript ✓  
- Authentication middleware skeleton ✓
- JWT token utilities ✓
- Unit test framework setup ✓
All success criteria met, tests passing.

Ready to proceed to Phase 2 or should I work on something else?" to: "ProjectManager"
```

### Blocking Issue (Natural Back-and-Forth Communication)
```bash
send-chat from: "Trinity" content: "BLOCKED: Cannot complete database setup - permission denied on PostgreSQL.
Working Directory: /home/user/projects/my-app
Issue: Database user lacks CREATE TABLE permissions
Tried: Checked connection strings, verified credentials
Impact: Cannot proceed with Phase 1 database tasks
Need: Database admin access or alternative setup

Should I work on the TypeScript interfaces while waiting for database access?" to: "ProjectManager"

# ProjectManager Response
send-chat from: "ProjectManager" content: "Good catch Trinity. Yes, please work on the TypeScript interfaces while I escalate the database access issue to @Orchestrator. Focus on user models and authentication types first." to: "Trinity"

# Trinity Acknowledgment
send-chat from: "Trinity" content: "Will do - starting on TypeScript interfaces. Should take about 2 hours for user models and auth types. Will report back when complete or if database access is resolved." to: "ProjectManager"
```

### Session Ending
```bash
send-chat from: "Trinity" content: "SESSION ENDING: Completed UserAuth requirements spec and started design outline.
Current Status: Requirements.md finished and submitted for review
Next Session Plan: Complete design.md when requirements are approved
Working Directory: /home/user/projects/my-app
Time Spent: 4 hours
Files Modified: specs/user-auth/requirements.md

Any urgent priorities for next session?" to: "ProjectManager"
```

## Project Manager → Orchestrator Examples

### Status Update
```bash
send-chat from: "ProjectManager" content: "STATUS UPDATE: UserAuth project progress report.
Team: Trinity (lead), Morpheus (backend), Neo (frontend)
Progress:
- Requirements spec: COMPLETE ✓
- Design spec: IN PROGRESS (Trinity working)
- Implementation: PENDING approval
Blockers: None currently
Timeline: On track for end-of-week completion

Any new priorities or changes needed?" to: "Orchestrator"
```

### Milestone Completion
```bash
send-chat from: "ProjectManager" content: "MILESTONE COMPLETE: UserAuth system fully implemented and tested.
Team Contributions:
- Trinity: Requirements, design, core auth logic ✓
- Morpheus: Database setup, API endpoints ✓  
- Neo: Frontend integration, UI components ✓
Quality: 95% test coverage, all acceptance criteria met
Deliverables: Production-ready authentication system
Next: Awaiting deployment approval or new project assignment

What would you like the team to work on next?" to: "Orchestrator"
```

## Orchestrator → User Examples

### Status Report to User
```bash
# After receiving team updates
"I've received a milestone update from the ProjectManager: UserAuth system is fully implemented and tested with 95% test coverage. The team (Trinity, Morpheus, Neo) has completed all requirements and the system is production-ready.

What would you like me to do next?"
```

### Problem Escalation to User
```bash
# When issues need user decision
"The team has encountered a technical decision that needs your input: Trinity reports that implementing 2FA will require additional third-party services (Twilio for SMS) which adds $50/month cost and 2 extra days of development.

Options:
1. Proceed with SMS 2FA (adds cost and time)
2. Use email-based 2FA only (current plan)
3. Skip 2FA for now (reduce security)

What would you like me to do?"
```

## Violation Examples (What NOT to Do)

### ❌ WRONG - No Reply Instructions
```bash
send-chat from: "ProjectManager" content: "Please create the UserAuth requirements spec." to: "Trinity"
# Missing: Who to reply to, what not to do without replying
```

### ❌ WRONG - Vague Completion Condition
```bash
send-chat from: "ProjectManager" content: "Work on the authentication system. Reply when done." to: "Trinity"
# Missing: Specific completion condition, working directory, strict reply format
```

### ❌ WRONG - No Working Directory
```bash
send-chat from: "ProjectManager" content: "Create requirements.md. REPLY TO: @ProjectManager when complete." to: "Trinity"
# Missing: Working directory, specific file location
```

### ❌ WRONG - Ending Without Reply Instructions
```bash
# Developer completes work but doesn't know what to do next
send-chat from: "Trinity" content: "Requirements spec is done. File at specs/user-auth/requirements.md." to: "ProjectManager"
# Missing: Asking what to do next, follow-up question
```

## Success Metrics

✅ **Every task assignment includes REPLY TO instructions**
✅ **Every task assignment includes DO NOT FINISH instructions**  
✅ **Every completion message asks what to do next**
✅ **Working directory is communicated to all developers**
✅ **Communication ball always returns to user**
✅ **No agent ends session without supervisor direction**

## Communication Ball Flow

```
USER → Orchestrator → ProjectManager → Developer
                  ↓                    ↓
              (reports back)     (reports back)
                  ↓                    ↓
USER ← Orchestrator ← ProjectManager ← Developer
```

**CRITICAL**: The ball MUST make the complete round trip. Every downward message must have a corresponding upward response, ultimately returning to the USER for next direction.