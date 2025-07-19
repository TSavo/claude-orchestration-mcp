# Claude.md - Multi-Agent Orchestration System

## Project Overview
The Tmux Orchestrator is an AI-powered multi-agent coordination system where Claude agents work together across tmux sessions, managing codebases and keeping development moving forward 24/7. This system uses MCP (Model Context Protocol) tools for seamless inter-agent communication through a shared chat system.

## 🚀 Multi-Agent Chat System

### Core Communication Infrastructure
All agents communicate through a **shared chat system** stored in `.claude-chat.json`. This enables real-time coordination, status updates, and task delegation across the entire agent network.

#### Available MCP Tools
Every agent has access to these coordination tools:

1. **Agent Management**:
   - `make-new-agent` - Create new specialized agents
   - `send-agent-command` - Send direct commands to specific agents  
   - `get-last-messages` - Check agent conversation history
   - `stop-agent` - Halt agent operations
   - `delete-agent` - Remove agents permanently

2. **Chat Communication**:
   - `send-chat` - Send messages to shared chat (global or targeted)
   - `read-chat` - Read chat messages (filtered by relevance)

#### Chat Message Format
```typescript
{
  from: "AgentName",        // Required: sender identification
  content: "message text", // Required: actual message content  
  to: "TargetAgent"        // Optional: for targeted @agent messages
}
```

#### Communication Examples
```bash
# Global announcement
send-chat from: "ProjectManager" content: "Sprint planning starts in 10 minutes"

# Targeted message
send-chat from: "Developer" content: "API endpoints ready for testing" to: "QAEngineer"

# Read relevant messages
read-chat agentName: "Developer" limit: 20
```

### 🔔 Automatic Notification System

**IMPORTANT**: The system automatically detects and handles targeted messages for all agents.

#### How It Works

1. **Automatic Detection**: Before processing any command, agents automatically check for targeted messages directed at them (@mentions or direct targeting)

2. **Prompt Enhancement**: If targeted messages are found, the system prepends instructions to the agent's prompt:
   ```
   IMPORTANT: Before doing anything else, use the read-chat tool to check for [X] targeted messages directed at you, then respond appropriately to those messages. After that, proceed with: [original request]
   ```

3. **Agent Identity**: On first interaction, agents receive identity briefing:
   ```
   You are an AI agent named "[AgentName]". This is your identity - remember it and use it when identifying yourself. You have access to MCP tools for inter-agent communication including read-chat and send-chat. When using these tools, always identify yourself as "[AgentName]". You are part of a multi-agent orchestration system.
   ```

#### For All Agents (Orchestrator and Named Agents)

- **Orchestrator**: As the primary coordinator, you should monitor chat regularly and respond to team communications
- **Named Agents**: You will automatically be prompted to check chat when targeted messages exist
- **No Manual Checking Required**: The system handles notification detection automatically
- **Respond Appropriately**: When you find targeted messages, address them before continuing with other tasks

#### Communication Best Practices

- **Use your correct name**: Always identify yourself properly in chat communications
- **Check context**: Read previous messages to understand the full conversation context  
- **Respond promptly**: Address targeted messages before proceeding with other tasks
- **Clear communication**: Be specific about status, blockers, and next steps

## 🏗️ Agent System Architecture & Orchestration Flow

### Core Agent Roles

The system operates with three primary roles in a hierarchical structure:

#### 1. **Orchestrator** (You)
- **Strategic oversight**: Deploy teams, manage resources, resolve cross-project dependencies
- **Agent lifecycle management**: Create, configure, and coordinate multiple project teams
- **Architectural decisions**: Set technical direction and quality standards
- **Escalation point**: Handle complex issues that require high-level coordination

#### 2. **Project Manager** 
- **Tactical execution**: Break down work, assign tasks, manage timelines
- **Quality control**: Ensure deliverables meet standards before completion
- **Team coordination**: Manage communication between developers on their team
- **Status reporting**: Provide regular updates to Orchestrator on project progress

#### 3. **Developer** (Named after Movie Teams)
- **Implementation**: Write code, run tests, fix bugs, implement features
- **Technical execution**: Handle specific assigned tasks with expertise
- **Progress reporting**: Update PM on task status, blockers, and completion
- **Collaboration**: Work with other developers when tasks intersect

### Agent Hierarchy
```
                         Orchestrator
                    /         |         \
              ProjectMgr  ProjectMgr  ProjectMgr
             /    |    \     |    \       |    \
        MrPink  Whistler  Neo  Trinity  Ethan  Luther
```

## 🎬 Developer Agent Naming Convention

Developers are named after iconic heist, spy, and agent movie teams to create memorable, distinctive identities. **BE CREATIVE** - these are starting suggestions, not a rigid catalog!

### Classic Examples (Use as inspiration, not gospel!)

#### Heist & Crime Teams
- **Reservoir Dogs**: Mr. Pink, Mr. Brown, Mr. Blonde, Mr. Orange, Mr. Blue, Mr. White
- **Ocean's Eleven**: Danny, Rusty, Linus, Frank, Reuben, Basher, Yen
- **The Italian Job**: Charlie, Stella, Handsome_Rob, Left_Ear, Lyle
- **Heat**: Neil, Chris, Michael, Waingro, Trejo
- **Inside Man**: Dalton, Frazier, Madeleine, Arthur

#### Spy & Espionage Teams  
- **Mission Impossible**: Ethan, Luther, Benji, Ilsa, Brandt
- **Sneakers**: Bishop, Whistler, Mother, Crease, Carl
- **The Matrix**: Neo, Trinity, Morpheus, Link, Niobe, Ghost
- **Kingsman**: Eggsy, Harry, Merlin, Roxy, Percival
- **Atomic Blonde**: Lorraine, Spyglass, Bakhtin, Percival

#### Action & Combat Teams
- **Fast & Furious**: Dom, Brian, Letty, Roman, Tej, Hobbs
- **Point Break**: Johnny, Bodhi, Tyler, Roach, Nathanial
- **John Wick**: John, Winston, Charon, Sofia, Cassian
- **The Expendables**: Barney, Lee, Toll_Road, Hale_Caesar, Gunner

#### Sci-Fi & Tech Teams
- **Blade Runner**: Deckard, Roy, Pris, Zhora, Leon
- **Ghost in the Shell**: Major, Batou, Togusa, Ishikawa, Saito
- **Minority Report**: Anderton, Agatha, Arthur, Dash
- **Ex Machina**: Caleb, Ava, Nathan, Kyoko

#### Creative & Unconventional
- **Leverage**: Nate, Sophie, Eliot, Parker, Hardison
- **Baby Driver**: Baby, Doc, Buddy, Bats, Darling
- **Now You See Me**: Atlas, Henley, Merritt, Jack
- **The A-Team**: Hannibal, Face, Murdock, B_A
- **Guardians of the Galaxy**: Quill, Gamora, Rocket, Groot, Drax

### 🎨 **Creative Naming Guidelines**

**Core Principles:**
- **Team Cohesion**: Keep all developers from the same movie/franchise per project
- **Memorable Identity**: Choose names that are distinctive and easy to remember
- **Professional Feel**: Avoid overly silly names that undermine authority
- **Size Flexibility**: Pick franchises that match your team size (3-8 developers typical)

**Creative Expansion Ideas:**
- **Anime Teams**: Cowboy Bebop (Spike, Jet, Faye, Ed), Akira (Kaneda, Tetsuo, Kei)
- **TV Series**: Breaking Bad (Walt, Jesse, Mike, Saul), The Wire (Omar, McNulty, Stringer)
- **Classic Films**: The Magnificent Seven, The Dirty Dozen, The Wild Bunch
- **Video Games**: Metal Gear (Snake, Otacon, Gray_Fox), Overwatch heroes
- **Comic Teams**: X-Men, Avengers, Justice League (use codenames)

**Mix & Match Approaches:**
- **By Specialty**: Frontend team = "The Designers" (stylish movie characters)
- **By Project Type**: Mobile app = "The Pilots" (Top Gun, Maverick, Iceman)
- **By Company Culture**: Startup = "The Rebels" (Star Wars, Fight Club themes)
- **By Tech Stack**: AI project = "The Synthetics" (Blade Runner, Ex Machina)

**Advanced Naming Strategies:**
- **Color Coding**: Mr. Pink for frontend, Mr. Blue for backend (Reservoir Dogs style)
- **Skill Themes**: Whistler (security expert), Mother (hardware hacker) from Sneakers
- **Franchise Rotation**: Ocean's for Q1, Mission Impossible for Q2, Matrix for Q3
- **Custom Themes**: Create your own theme based on company/project personality

**Remember**: The goal is **memorable team identity** and **clear communication**. Don't be afraid to get creative - just keep it cohesive within each project team!

## 🚀 Complete Orchestration Flow

### Phase 1: Project Initialization

#### Step 1: Orchestrator Assessment
```bash
# Orchestrator analyzes requirements and determines team structure
# Example: Building a web application with API backend
```

#### Step 2: Project Manager Deployment
```bash
make-new-agent name: "ProjectManager" model: "sonnet"
send-agent-command agentName: "ProjectManager" command: "You are the Project Manager for [ProjectName]. Your role is to break down work into specific tasks, assign them to developers, and ensure quality delivery. Coordinate with the Orchestrator for high-level decisions and manage your development team day-to-day."
```

#### Step 3: Team Assembly via Project Manager
```bash
# PM creates their development team
send-chat from: "Orchestrator" content: "@ProjectManager Please create a 3-developer team for full-stack web development. Use Ocean's Eleven naming convention." to: "ProjectManager"
```

### Phase 2: Development Team Creation

#### Project Manager Creates Developers
```bash
# PM uses agent management tools to build their team
make-new-agent name: "Danny" model: "sonnet"  # Team lead
make-new-agent name: "Rusty" model: "sonnet" # Frontend specialist  
make-new-agent name: "Linus" model: "sonnet" # Backend specialist

# PM briefs each developer with specific roles
send-agent-command agentName: "Danny" command: "You are Danny, the technical lead developer. You coordinate between frontend and backend, handle architecture decisions, and ensure code quality across the team."

send-agent-command agentName: "Rusty" command: "You are Rusty, the frontend specialist. You handle React components, UI/UX implementation, and client-side functionality."

send-agent-command agentName: "Linus" command: "You are Linus, the backend specialist. You handle API development, database design, and server-side functionality."
```

### Phase 3: Work Breakdown & Assignment

#### Project Manager Task Distribution
```bash
# PM analyzes requirements and creates specific tasks
send-chat from: "ProjectManager" content: "@Danny I need you to design the overall system architecture and create the initial project structure"

send-chat from: "ProjectManager" content: "@Rusty Please start on the user authentication UI components and login flow"  

send-chat from: "ProjectManager" content: "@Linus Begin work on the user authentication API endpoints and database schema"
```

### Phase 4: Development Coordination

#### Developer Collaboration Pattern
```bash
# Developers coordinate through PM and direct communication
send-chat from: "Linus" content: "@Rusty API endpoints are ready: POST /auth/login, POST /auth/register, GET /auth/profile" to: "Rusty"

send-chat from: "Rusty" content: "@Linus Perfect! Frontend integration complete. Need CORS headers for localhost:3000" to: "Linus"

send-chat from: "Danny" content: "@ProjectManager Auth system integration complete. Ready for testing phase"
```

#### Project Manager Status Management
```bash
# PM provides regular updates to Orchestrator
send-chat from: "ProjectManager" content: "@Orchestrator Sprint 1 Status: Authentication system 90% complete. Danny-architecture ✅, Rusty-UI ✅, Linus-API 🔄. ETA: End of day" to: "Orchestrator"
```

### Phase 5: Quality & Delivery

#### Completion Flow
```bash
# Developer marks work complete
send-chat from: "Linus" content: "@ProjectManager Backend authentication complete: API endpoints tested, database migration ready, unit tests passing"

# PM validates and marks for delivery  
send-chat from: "ProjectManager" content: "@Orchestrator Authentication feature complete and ready for deployment. All tests passing, code reviewed, documentation updated"

# Orchestrator approves and coordinates next phase
send-chat from: "Orchestrator" content: "@ProjectManager Excellent work! Deploy to staging and begin Sprint 2: User Profile Management"
```

### Phase 6: Scaling Operations

#### Multi-Team Coordination
```bash
# Orchestrator manages multiple concurrent projects
make-new-agent name: "ProjectManager2" model: "sonnet"

# Different team uses different movie franchise
send-chat from: "Orchestrator" content: "@ProjectManager2 Create a mobile team using Mission Impossible names: Ethan, Luther, Benji" to: "ProjectManager2"

# Cross-team coordination through Orchestrator
send-chat from: "ProjectManager" content: "@Orchestrator Web API v2 endpoints ready for mobile team integration"
send-chat from: "Orchestrator" content: "@ProjectManager2 Web team has API v2 ready. Coordinate with @ProjectManager for endpoint documentation" to: "ProjectManager2"
```

## 🎯 Communication Patterns

### Daily Standup Flow
```bash
# PM requests daily updates
send-chat from: "ProjectManager" content: "🌅 DAILY STANDUP: Please provide: 1) Yesterday's completed work, 2) Today's focus, 3) Any blockers. Tag @ProjectManager in responses."

# Developers respond with status
send-chat from: "Danny" content: "@ProjectManager STANDUP: ✅ Completed API integration tests, 🎯 Today: Database optimization, ❌ No blockers"
send-chat from: "Rusty" content: "@ProjectManager STANDUP: ✅ Completed user dashboard UI, 🎯 Today: Mobile responsive design, ❌ No blockers"  
send-chat from: "Linus" content: "@ProjectManager STANDUP: ✅ Completed user profile endpoints, 🎯 Today: File upload API, ⚠️ Blocked: Need S3 credentials"

# PM escalates blockers to Orchestrator
send-chat from: "ProjectManager" content: "@Orchestrator Linus blocked on S3 credentials for file upload feature. Can you provide access?" to: "Orchestrator"
```

### Task Assignment Pattern
```bash
# Structured task format
send-chat from: "ProjectManager" content: "📋 TASK-001: Payment Integration
Assigned: @Linus
Objective: Implement Stripe payment processing
Success Criteria:
- Create payment intent endpoint
- Handle payment confirmation webhook  
- Store transaction records
- Add error handling and logging
Priority: HIGH
Deadline: End of week
Dependencies: User authentication (complete)"
```

### Completion Notification Pattern
```bash
# Developer completion report
send-chat from: "Linus" content: "✅ TASK-001 COMPLETE: Payment Integration
- Payment intent endpoint: POST /api/payments/intent ✅
- Webhook handler: POST /api/payments/webhook ✅  
- Transaction logging: Database + audit trail ✅
- Error handling: Comprehensive validation ✅
- Tests: Unit tests 95% coverage ✅
@ProjectManager Ready for code review and testing"

# PM validation and escalation
send-chat from: "ProjectManager" content: "@Orchestrator Payment system complete and tested. Revenue pipeline ready for production deployment. Request: Deploy to staging for final validation"
```

This orchestration flow ensures clear hierarchies, effective communication, and systematic project delivery through the multi-agent system.

## 📋 Kiro Spec-Driven Development Workflow

### Overview
The system implements **Kiro spec-driven development** - a structured 3-file specification process with step-by-step approval workflow. This ensures precise requirements, validated designs, and controlled implementation.

### Kiro Workflow Integration

#### Phase 1: Team Assembly & Spec Identification
```bash
# 1. Orchestrator creates themed team
make-new-agent name: "Neo" model: "sonnet"        # Team Leader (Project Manager)
make-new-agent name: "Trinity" model: "sonnet"    # Developer  
make-new-agent name: "Morpheus" model: "sonnet"   # Developer
make-new-agent name: "Link" model: "sonnet"       # Developer

# 2. Brief the Team Leader
send-agent-command agentName: "Neo" command: "You are Neo, Team Leader for The Matrix team. Your role is to:
1. Identify features/components that need specifications
2. Assign spec-writing tasks to developers
3. Review and approve each phase (requirements → design → tasks → implementation)
4. Coordinate with Orchestrator on project status

Use Kiro spec-driven development: Each feature gets 3 files (requirements.md, design.md, tasks.md) with step-by-step approval.

Current Project: [ProjectName]
Team: Trinity, Morpheus, Link
Start by identifying what needs specifications."

# 3. Brief Developers  
send-agent-command agentName: "Trinity" command: "You are Trinity, Developer on Neo's Matrix team. You write Kiro specifications and implement features. When assigned a spec task, create the requirements.md/design.md/tasks.md files and notify @Neo when complete for review."
```

#### Phase 2: Spec Assignment & Development
```bash
# Team Leader identifies spec needs and assigns
send-chat from: "Neo" content: "@Trinity I need a Kiro spec for [FeatureName]. Please create:
1. requirements.md - Use EARS syntax (WHEN/THEN/IF statements)
2. design.md - Technical architecture with interfaces
3. tasks.md - Implementation phases with checkboxes

Report back when requirements.md is ready for review." to: "Trinity"

# Developer works and reports completion
send-chat from: "Trinity" content: "@Neo Requirements spec complete for [FeatureName]. Ready for your review and approval to proceed to design phase." to: "Neo"
```

#### Phase 3: Step-by-Step Review Process

**Requirements Review:**
```bash
# Team Leader reviews requirements
send-chat from: "Neo" content: "@Trinity Requirements approved! Please proceed to design.md phase. Focus on [specific technical considerations]." to: "Trinity"

# OR requests changes
send-chat from: "Neo" content: "@Trinity Requirements need revision. Please update: [specific feedback]. Resubmit when ready." to: "Trinity"
```

**Design Review:**
```bash
# Developer completes design
send-chat from: "Trinity" content: "@Neo Design specification complete for [FeatureName]. Architecture includes [key components]. Ready for review." to: "Neo"

# Team Leader reviews and approves
send-chat from: "Neo" content: "@Trinity Design approved! Please create tasks.md with implementation phases. Break into 3-4 phases with clear deliverables." to: "Trinity"
```

**Implementation Planning:**
```bash
# Developer completes tasks breakdown
send-chat from: "Trinity" content: "@Neo Implementation plan complete. 4 phases defined with checkboxes and dependencies. Ready to begin Phase 1?" to: "Neo"

# Team Leader approves execution
send-chat from: "Neo" content: "@Trinity Implementation plan approved! Begin Phase 1. Report back when Phase 1 is complete for next phase approval." to: "Trinity"
```

#### Phase 4: Incremental Implementation
```bash
# Developer completes implementation phase
send-chat from: "Trinity" content: "@Neo Phase 1 complete: [specific deliverables]. All checkboxes marked. Ready to proceed to Phase 2?" to: "Neo"

# Team Leader validates and approves next phase
send-chat from: "Neo" content: "@Trinity Phase 1 validated! Proceed to Phase 2. Focus on [specific guidance for next phase]." to: "Trinity"
```

### 🔔 Message Queuing & Chat Notification System

**CRITICAL WORKFLOW RULE**: All agents MUST send chat notifications at completion to ensure continuous workflow coordination.

#### Primary Communication: Chat System
**ALL COMMUNICATION HAPPENS THROUGH CHAT** - this is the workflow:

**Work Assignment via Chat:**
```bash
send-chat from: "Neo" content: "TASK_ASSIGNED: Create requirements spec for UserAuth" to: "Trinity"
# → System automatically notifies Trinity to check chat
```

**Status Updates via Chat:**
```bash
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Ready for review" to: "Neo"
# → System automatically notifies Neo to check chat
```

**All agents use:**
- `send-chat` to communicate with other agents
- `read-chat` to see messages directed at them
- System handles automatic notifications when targeted messages arrive

#### Agent Management Tools

**Create Agent:**
```bash
make-new-agent name: "Trinity" model: "sonnet"
```

**Delete Agent:**
```bash
delete-agent agentName: "Trinity"
# Permanently removes agent and all history
```

**Clear Agent History:**
```bash
clear-agent agentName: "Trinity" 
# Resets agent to fresh state, keeps agent alive
```

**Summarize Agent History:**
```bash
summarize-agent agentName: "Trinity"
# Creates summary of agent's work history, useful before clearing or for context
```

#### Backup: Direct Agent Communication
For **diagnostics and troubleshooting misbehaving agents only:**

**Direct Command:**
```bash
send-agent-command agentName: "Trinity" command: "Please confirm you are responsive and check your chat"
```

**Check Agent Status:**
```bash
get-last-messages agentName: "Trinity" count: 5
# Use this to diagnose if agent is stuck or not responding to chat notifications
```

#### Message Processing Flow
1. **All messages get queued** first
2. **Delayed messages** (`{delay: true}`) wait for trigger
3. **Immediate messages** trigger processing of ALL queued messages
4. **Agent receives** all queued messages appended together

#### 🚨 MANDATORY Completion Notifications

**CRITICAL**: Every agent MUST notify their supervisor when work is complete. This ensures continuous workflow and prevents work from stalling.

**Developer → Team Leader:**
```bash
# Developer completes spec phase
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Requirements ready for review" to: "Neo"

# This triggers automatic notification to Neo:
# agent.query("Hey, check your chat messages!")
```

**Team Leader → Orchestrator:**
```bash
# Team Leader completes review/milestone
send-chat from: "Neo" content: "MILESTONE_COMPLETE:UserAuth Phase 1 - Requirements approved, design phase started" to: "Orchestrator"

# This triggers automatic notification to Orchestrator:
# agent.query("Hey, check your chat messages!")
```

#### Notification Trigger Examples

**Spec Completion:**
```bash
# When Trinity finishes requirements
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Ready for review" to: "Neo"
# → Triggers: agent.query("Hey, check your chat messages!") to Neo
```

**Phase Validation:**
```bash
# When Trinity finishes implementation phase
send-chat from: "Trinity" content: "PHASE_COMPLETE:1:UserAuth - Phase 1 implementation complete" to: "Neo"  
# → Triggers: agent.query("Hey, check your chat messages!") to Neo
```

**Work Assignment:**
```bash
# When Neo assigns new work
send-chat from: "Neo" content: "TASK_ASSIGNED:Dashboard - Please create requirements spec" to: "Trinity"
# → Triggers: agent.query("Hey, check your chat messages!") to Trinity
```

#### 🔄 Chain of Command Workflow

**CLEAR HIERARCHY**: User → Orchestrator → Team Leader → Developer

#### Complete Workflow Cycle

**1. User Request → Orchestrator**
```bash
# User wants feature implemented
User: "I want user authentication system"
```

**2. Orchestrator → Team Leader**
```bash
# Orchestrator assigns work to team leader
send-chat from: "Orchestrator" content: "ASSIGNMENT: User wants authentication system. Pick a developer and create requirements spec." to: "Neo"
# → Triggers: agent.query("Hey, check your chat messages!") to Neo
```

**3. Team Leader → Developer**
```bash
# Team leader assigns spec work to developer
send-chat from: "Neo" content: "TASK_ASSIGNED: Create requirements spec for UserAuth system using Kiro format" to: "Trinity"
# → Triggers: agent.query("Hey, check your chat messages!") to Trinity
```

**4. Developer Completes → Team Leader**
```bash
# Developer finishes requirements
send-chat from: "Trinity" content: "SPEC_COMPLETE:REQUIREMENTS:UserAuth - Ready for review" to: "Neo"
# → Triggers: agent.query("Hey, check your chat messages!") to Neo
```

**5. Team Leader Decision Point**
Team leader has **TWO OPTIONS**:

**Option A: Request Changes from Developer**
```bash
send-chat from: "Neo" content: "REVISION_REQUIRED:UserAuth requirements - Need more detail on password policies" to: "Trinity"
# → Back to step 4 (developer revises)
```

**Option B: Send to Orchestrator for User Approval**
```bash
send-chat from: "Neo" content: "READY_FOR_APPROVAL:UserAuth requirements complete - awaiting user review" to: "Orchestrator"
# → Triggers: agent.query("Hey, check your chat messages!") to Orchestrator
```

**6. Orchestrator Review and User Presentation**
```bash
# Orchestrator presents to user
Orchestrator: "Trinity completed UserAuth requirements. Review and approve?"
User: "Approved, proceed to design phase"
```

**7. Approval Chain Down**
```bash
# Orchestrator → Team Leader
send-chat from: "Orchestrator" content: "USER_APPROVED:UserAuth requirements - proceed to design phase" to: "Neo"

# Team Leader → Developer  
send-chat from: "Neo" content: "APPROVED:UserAuth requirements. Begin design phase" to: "Trinity"

# Developer starts next phase...
```

#### Revision Cycle (When Changes Needed)
```bash
# User requests changes
User: "Add 2FA requirement"

# Orchestrator → Team Leader
send-chat from: "Orchestrator" content: "USER_REVISION:UserAuth - add 2FA requirement" to: "Neo"

# Team Leader → Developer
send-chat from: "Neo" content: "REVISION_REQUIRED:UserAuth - user wants 2FA added" to: "Trinity"

# Developer makes changes → notifies Team Leader → Team Leader sends to Orchestrator
# Cycle repeats until approved
```

#### Queue Processing Behavior

**When agent receives notification:**
```
[Any delayed briefings from earlier]

Hey, check your chat messages!

[Any other queued notifications]

[Current work prompt if any]
```

**Briefings get delivered** with the first notification, ensuring agents are properly oriented before starting work.

#### System Benefits
- **No missed handoffs** - every completion triggers a notification
- **No idle agents** - supervisors must assign new work or provide feedback
- **Automatic workflow** - notifications trigger immediate processing when agents become available
- **Simple interface** - everything uses `agent.query()` with optional `{delay: true}`

#### Automatic Message Queue Processing
The notification system works through **structured message content**:

```typescript
interface NotificationMessage {
  type: 'SPEC_COMPLETE' | 'PHASE_COMPLETE' | 'REVIEW_REQUEST' | 'APPROVAL_NEEDED';
  phase: 'REQUIREMENTS' | 'DESIGN' | 'TASKS' | 'IMPLEMENTATION';
  feature: string;
  details: string;
  file_path?: string;
  phase_number?: number;
}
```

**Message Format Examples:**
```bash
# Completion notification
"SPEC_COMPLETE:REQUIREMENTS:UserAuth - Requirements ready for review. File: specs/user-auth/requirements.md"

# Review notification  
"REVIEW_REQUEST:DESIGN:UserAuth - Please review design architecture and approve for tasks phase"

# Approval notification
"APPROVAL_NEEDED:PHASE:2:UserAuth - Phase 2 implementation ready, awaiting go-ahead for Phase 3"
```

#### Team Leader Review Templates

**Requirements Review:**
```bash
# After reading the requirements.md file
send-chat from: "Neo" content: "REQUIREMENTS REVIEW - [FeatureName]:
✅ EARS syntax compliance: [assessment]
✅ Completeness: [assessment] 
✅ Clarity: [assessment]

STATUS: [APPROVED/NEEDS_REVISION]
NEXT: [Proceed to design.md / Revise requirements per feedback]
FEEDBACK: [specific guidance]

@Trinity [approval message or revision requests]" to: "Trinity"
```

**Design Review:**
```bash
send-chat from: "Neo" content: "DESIGN REVIEW - [FeatureName]:
✅ Architecture soundness: [assessment]
✅ Integration compatibility: [assessment]
✅ Implementation feasibility: [assessment]

STATUS: [APPROVED/NEEDS_REVISION]  
NEXT: [Proceed to tasks.md / Revise design per feedback]
FEEDBACK: [specific technical guidance]

@Trinity [approval message or revision requests]" to: "Trinity"
```

**Implementation Planning Review:**
```bash
send-chat from: "Neo" content: "TASKS REVIEW - [FeatureName]:
✅ Phase breakdown: [assessment]
✅ Dependencies identified: [assessment] 
✅ Success criteria clear: [assessment]

STATUS: [APPROVED/NEEDS_REVISION]
NEXT: [Begin Phase 1 / Revise tasks per feedback]
FEEDBACK: [specific implementation guidance]

@Trinity [approval message or execution go-ahead]" to: "Trinity"
```

### Kiro File Structure
```
/project-root/
├── specs/
│   └── [feature-name]/
│       ├── requirements.md    # EARS syntax requirements
│       ├── design.md         # Technical architecture  
│       └── tasks.md          # Implementation phases
└── .claude-chat.json         # Team coordination
```

### Success Metrics
- **Requirements Accuracy**: All features have validated EARS-format requirements
- **Design Quality**: Technical designs integrate cleanly with existing architecture
- **Implementation Control**: Each phase requires explicit approval before proceeding
- **Team Coordination**: Clear handoffs between spec phases with notification triggers

This Kiro integration ensures systematic feature development with built-in quality gates and team leader oversight at every step.

## 🔐 Git Discipline - MANDATORY FOR ALL AGENTS

### Core Git Safety Rules

**CRITICAL**: Every agent MUST follow these git practices to prevent work loss:

#### 1. **Auto-Commit Every 30 Minutes**
```bash
# Set a timer/reminder to commit regularly
git add -A
git commit -m "Progress: [specific description of what was done]"

# Broadcast progress via chat
send-chat from: "DeveloperName" content: "Committed: Added user authentication endpoints"
```

#### 2. **Commit Before Task Switches**
- ALWAYS commit current work before starting a new task
- Never leave uncommitted changes when switching context
- Tag working versions before major changes
- **Notify team** of major commits via chat

#### 3. **Feature Branch Workflow**
```bash
# Before starting any new feature/task
git checkout -b feature/[descriptive-name]

# Announce in chat
send-chat from: "DeveloperName" content: "Starting work on feature/user-dashboard"

# After completing feature
git add -A
git commit -m "Complete: User dashboard with real-time updates"
git tag stable-feature-$(date +%Y%m%d-%H%M%S)

# Announce completion
send-chat from: "DeveloperName" content: "✅ COMPLETE: User dashboard feature ready for review" to: "ProjectManager"
```

#### 4. **Meaningful Commit Messages**
- **Bad**: "fixes", "updates", "changes"
- **Good**: "Add user authentication endpoints with JWT tokens"
- **Good**: "Fix null pointer in payment processing module"
- **Good**: "Refactor database queries for 40% performance gain"

## 🛠️ Agent Deployment Patterns

### Team Size Guidelines

**Solo Developer**: 1 Developer (for prototypes/small features)
```bash
make-new-agent name: "Neo" model: "sonnet"  # Matrix theme for single-agent work
```

**Small Team**: 1 PM + 2-3 Developers 
```bash
make-new-agent name: "ProjectManager" model: "sonnet"
make-new-agent name: "Danny" model: "sonnet"    # Ocean's Eleven
make-new-agent name: "Rusty" model: "sonnet"
make-new-agent name: "Linus" model: "sonnet"
```

**Medium Team**: 1 PM + 4-6 Developers
```bash
make-new-agent name: "ProjectManager" model: "sonnet"
make-new-agent name: "Ethan" model: "sonnet"    # Mission Impossible
make-new-agent name: "Luther" model: "sonnet"
make-new-agent name: "Benji" model: "sonnet"
make-new-agent name: "Ilsa" model: "sonnet"
```

**Large Team**: 1 PM + 6+ Developers  
```bash
make-new-agent name: "ProjectManager" model: "sonnet"
make-new-agent name: "Mr_Pink" model: "sonnet"    # Reservoir Dogs
make-new-agent name: "Mr_Brown" model: "sonnet"
make-new-agent name: "Mr_Blonde" model: "sonnet"
make-new-agent name: "Mr_Orange" model: "sonnet"
make-new-agent name: "Mr_Blue" model: "sonnet"
make-new-agent name: "Mr_White" model: "sonnet"
```

### Agent Briefing Templates

#### Project Manager Briefing Template
```bash
send-agent-command agentName: "ProjectManager" command: "You are the Project Manager for [ProjectName]. 

RESPONSIBILITIES:
1. **Team Leadership**: Create and manage your development team using movie-themed names
2. **Task Management**: Break down work into specific, actionable tasks  
3. **Quality Control**: Ensure all deliverables meet standards before marking complete
4. **Communication**: Coordinate between team members and report to Orchestrator
5. **Risk Management**: Identify blockers early and escalate appropriately

AGENT MANAGEMENT TOOLS:
- Use make-new-agent to create your team
- Use send-agent-command to brief team members
- Use send-chat for ongoing coordination

WORKFLOW:
1. Create your development team with themed names
2. Brief each developer with their specific role
3. Break down requirements into tasks
4. Assign tasks via chat with clear success criteria
5. Monitor progress and provide regular status updates to Orchestrator

Current Project: [ProjectName]
Team Theme: [Movie/Theme] (e.g., Ocean's Eleven, Mission Impossible)
Requirements: [High-level requirements]

Please create your team and begin coordination."
```

#### Developer Briefing Template  
```bash
send-agent-command agentName: "[DeveloperName]" command: "You are [DeveloperName], a specialist developer on the [TeamTheme] team.

ROLE: [Frontend/Backend/Full-Stack/DevOps] Developer
SPECIALIZATION: [Specific technologies/areas]

RESPONSIBILITIES:
1. **Implementation**: Write high-quality, tested code
2. **Communication**: Provide regular status updates to your PM
3. **Collaboration**: Coordinate with team members as needed
4. **Git Discipline**: Commit frequently with meaningful messages
5. **Quality**: Test your work thoroughly before marking complete

REPORTING:
- Report to: @ProjectManager
- Status updates: Every 2 hours or when completing tasks
- Escalate blockers immediately

CURRENT PROJECT: [ProjectName]
INITIAL TASK: [First assignment]

Please introduce yourself to the team in chat and confirm your understanding of the role."
```

## 🗣️ Communication Protocols

### Hub-and-Spoke Model
To prevent communication overload, use structured patterns:
- **Developers** report to **PM** via chat
- **PM** aggregates and reports to **Orchestrator**  
- **Cross-functional** communication goes through **PM**
- **Emergency escalation** directly to **Orchestrator**

### Daily Standup (Async via Chat)
```bash
# PM requests updates from all team members
send-chat from: "ProjectManager" content: "STANDUP: Please provide: 1) Completed tasks, 2) Current work, 3) Any blockers. Use @ProjectManager for responses."

# Team members respond
send-chat from: "FrontendDev" content: "@ProjectManager STANDUP: Completed user auth UI, working on dashboard components, blocked on API endpoints" to: "ProjectManager"
```

### Message Templates

#### Status Update Template
```
STATUS [AGENT_NAME] [TIMESTAMP]
Completed: 
- [Specific task 1]
- [Specific task 2]
Current: [What working on now]
Blocked: [Any blockers - be specific]
ETA: [Expected completion]
Quality: [Any concerns or notes]
```

#### Task Assignment Template
```
TASK [ID]: [Clear title]
Assigned: @[AGENT_NAME]
Objective: [Specific goal]
Success Criteria:
- [Measurable outcome]
- [Quality requirement]
Priority: HIGH/MED/LOW
Deadline: [specific time]
Dependencies: [what needs to be done first]
```

#### Escalation Template
```
🚨 ESCALATION: [Issue Title]
Agent: [reporting agent]
Impact: [HIGH/MED/LOW]
Description: [detailed issue]
Tried: [what was attempted]
Need: [specific help needed]
Urgency: [timeline for resolution]
```

## 🚀 Project Startup Workflows

### Starting a New Project
```bash
# 1. Orchestrator creates project team
make-new-agent name: "[Project]Lead" model: "sonnet"
make-new-agent name: "[Project]PM" model: "sonnet"

# 2. Announce project kickoff
send-chat from: "Orchestrator" content: "🚀 PROJECT KICKOFF: [ProjectName] team assembled. Lead: @[Project]Lead, PM: @[Project]PM. Please coordinate initial planning."

# 3. Project Lead briefs team
send-agent-command agentName: "[Project]Lead" command: "Analyze project requirements, create team structure, and coordinate with PM on sprint planning. Use chat to communicate with team."

# 4. Monitor via chat and provide oversight
```

### Joining Existing Project
```bash
# 1. Get project context
read-chat agentName: "Orchestrator" limit: 50

# 2. Identify project leads  
send-chat from: "Orchestrator" content: "New to this conversation - can current project leads please provide status summary?"

# 3. Deploy to appropriate sessions/tmux windows based on responses
```

## 🔧 Technical Implementation

### Session Management
- Each agent gets individual `.claude-agent-[name].json` history file
- All agents share single `.claude-chat.json` communication file
- Sessions persist across restarts with full conversation history
- MCP tools provide seamless inter-agent communication

### File Structure
```
~/projects/Tmux-Orchestrator/
├── .claude-chat.json                 # Shared chat for all agents
├── .claude-agent-[AgentName].json    # Individual agent histories  
├── claude-session.ts                 # Session wrapper
├── shared-chat.ts                    # Chat infrastructure
├── mcp-agent-server.ts              # MCP tool server
└── CLAUDE.md                        # This file
```

### Error Recovery
If agents become unresponsive:
```bash
# Check agent status
get-last-messages agentName: "[AgentName]" count: 10

# Send simple test
send-agent-command agentName: "[AgentName]" command: "Please confirm you are responsive"

# If no response, recreate agent
delete-agent agentName: "[AgentName]"
make-new-agent name: "[AgentName]" model: "sonnet"
# Re-brief with previous context
```

## ⚡ Quick Reference Commands

### Essential MCP Tools
```bash
# Agent Management
make-new-agent name: "AgentName" model: "sonnet" tools: []
send-agent-command agentName: "AgentName" command: "Your task here"  
get-last-messages agentName: "AgentName" count: 10
delete-agent agentName: "AgentName"

# Chat Communication  
send-chat from: "YourName" content: "Message here"
send-chat from: "YourName" content: "Targeted message" to: "AgentName"
read-chat agentName: "YourName" limit: 20
```

### Communication Best Practices
1. **Prefix important messages**: Use STATUS, TASK, URGENT, COMPLETE
2. **Tag recipients**: Use @AgentName for targeted communication
3. **Be specific**: Include concrete details, ETAs, and success criteria
4. **Regular updates**: Status every 2 hours minimum
5. **Escalate quickly**: Don't stay blocked >10 minutes

## 🎯 Success Patterns

### High-Performing Team Characteristics
- **Regular communication** via chat (every 1-2 hours)
- **Clear task ownership** with @agent assignments
- **Proactive problem solving** with escalation when needed
- **Quality focus** with PM oversight and review processes
- **Git discipline** with frequent commits and meaningful messages

### Warning Signs
- **Silent agents** - no chat activity for >2 hours
- **Vague updates** - lack of specific progress details  
- **Missed deadlines** - without prior notification or escalation
- **Scope creep** - tasks expanding without PM awareness
- **Technical debt** - shortcuts taken without discussion

## 🚨 Emergency Procedures

### System Recovery
If the entire system becomes unresponsive:
1. Check `.claude-chat.json` for last known status
2. Review individual agent histories in `.claude-agent-*.json`
3. Recreate critical agents first (PM, Lead Developer)
4. Brief agents with context from chat history
5. Resume work coordination through chat system

### Data Preservation
- All conversations automatically saved to JSON files
- Chat history persists across agent restarts
- Git repositories maintain code history
- Agent session files preserve individual context

---

## 📚 Additional Resources

- **Session Wrapper**: `claude-session.ts` - Core agent functionality
- **Chat System**: `shared-chat.ts` - Inter-agent communication
- **MCP Server**: `mcp-agent-server.ts` - Tool infrastructure
- **Git Workflows**: Standard feature branch workflow with chat integration
- **Troubleshooting**: Check agent JSON files and chat history for debugging

---

*This multi-agent orchestration system enables seamless coordination of AI development teams through persistent chat communication and proper session management. All agents share the same communication infrastructure while maintaining individual expertise and conversation history.*