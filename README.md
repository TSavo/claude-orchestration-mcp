# Claude Orchestration MCP Server

A Model Context Protocol (MCP) server that enables powerful multi-agent orchestration for Claude Desktop. Create teams of specialized AI agents that work together, communicate through shared chat, and tackle complex projects autonomously.

## 🎯 What is this?

This MCP server lets you orchestrate multiple Claude agents from within Claude Desktop, enabling:

- **Multi-Agent Teams**: Deploy specialized agents (Developers, QA Engineers, Project Managers, etc.)
- **Inter-Agent Communication**: Agents communicate through a shared chat system
- **Autonomous Workflows**: Agents can work independently while coordinating on shared goals
- **Persistent Sessions**: Agent conversations and context are maintained across restarts

## 🚀 Quick Start

### 1. Install the MCP Server

```bash
# Clone the repository
git clone https://github.com/TSavo/claude-orchestration-mcp.git
cd claude-orchestration-mcp

# Install dependencies
npm install
```

### 2. Configure MCP Server

#### Option A: Project-Level Configuration (Recommended)
The project includes a `.mcp.json` file that Claude Code will automatically detect:

```json
{
  "mcpServers": {
    "agent-orchestrator": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "./mcp-agent-server.ts"]
    }
  }
}
```

This configuration is already included in the project and will work automatically when you open the project in Claude Code.

#### Option B: Global Claude Desktop Configuration
For Claude Desktop, add to your configuration file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "orchestrator": {
      "command": "npm",
      "args": ["run", "start:mcp"],
      "cwd": "/path/to/claude-orchestration-mcp"
    }
  }
}
```

### 3. Start Orchestrating!

#### Option A: Standard Claude Desktop
Restart Claude Desktop and you'll have access to the MCP tools. Agents can send messages to you, but you'll need to manually check with `read-chat`.

#### Option B: Enhanced Orchestrator Mode (Recommended)
For automatic notifications when agents message you:

```bash
# Start orchestrator in tmux
./start-orchestrator.sh

# This will:
# 1. Launch Claude in a tmux session
# 2. Brief it with orchestration context
# 3. Enable automatic notifications from agents

# To connect to your orchestrator:
tmux attach -t orchestrator
```

When agents send messages to @Orchestrator, you'll automatically be prompted to check them!

## 📦 Available MCP Tools

### Agent Management
- **`make-new-agent`** - Create a new specialized agent
  ```
  Parameters:
  - name: Agent identifier (e.g., "Developer", "QAEngineer")
  - model: "sonnet", "haiku", or "opus" (default: "sonnet")
  - tools: Array of allowed tools (optional)
  ```

- **`send-agent-command`** - Send a command to a specific agent
  ```
  Parameters:
  - agentName: Target agent name
  - command: Command/prompt to send
  ```

- **`get-last-messages`** - Retrieve recent agent messages
  ```
  Parameters:
  - agentName: Agent to query
  - count: Number of messages (default: 10)
  ```

- **`stop-agent`** - Stop an agent's current operation
- **`delete-agent`** - Remove an agent permanently
- **`clear-agent`** - Clear an agent's conversation history
- **`summarize-agent`** - Get a summary of an agent's work

### Communication Tools
- **`send-chat`** - Send a message to the shared chat
  ```
  Parameters:
  - from: Sender name
  - content: Message content
  - to: Target agent (optional, for direct messages)
  ```

- **`read-chat`** - Read messages from shared chat
  ```
  Parameters:
  - agentName: Reading agent's name
  - limit: Number of messages to retrieve
  ```

## 🏗️ Orchestration Patterns

### Example 1: Simple Developer + Reviewer Team

```
You are an Orchestrator. Please create a development team to implement a REST API:

1. Create a Developer agent to write the code
2. Create a Reviewer agent to check the implementation
3. Have them collaborate through chat
4. Monitor their progress
```

### Example 2: Full Project Team

```
Set up a project team for building a web application:

1. ProjectManager - Manages tasks and coordination
2. FrontendDev - Handles React components  
3. BackendDev - Builds API endpoints
4. QAEngineer - Tests the implementation
5. DevOps - Handles deployment

Have the PM distribute tasks and monitor progress through chat.
```

### Example 3: Research Team

```
Create a research team to analyze a codebase:

1. LeadAnalyst - Coordinates the analysis
2. SecurityAuditor - Reviews for vulnerabilities
3. PerformanceAnalyst - Identifies bottlenecks
4. DocumentationWriter - Creates comprehensive docs

Have them share findings through chat and produce a final report.
```

## 💬 Inter-Agent Communication

Agents automatically communicate through the shared chat system:

### Direct Messages
When you use `send-chat` with a `to` parameter, the target agent automatically receives a notification and can respond:

```javascript
// PM sends task to Developer
send-chat from: "ProjectManager" 
         content: "Please implement the user authentication endpoints" 
         to: "Developer"

// Developer automatically receives and can respond
```

### Broadcast Messages
Messages without a `to` parameter are visible to all agents:

```javascript
// Announce to all agents
send-chat from: "ProjectManager" 
         content: "Team meeting in 5 minutes - check chat for updates"
```

### @Mentions
Agents can mention each other in messages:

```javascript
send-chat from: "QAEngineer" 
         content: "@Developer the login endpoint is returning 500 errors"
```

## 🔄 How It Works

1. **You (Orchestrator)** use MCP tools to create and manage agents
2. **Agents** receive commands and work autonomously
3. **Shared Chat** enables real-time coordination
4. **Session Persistence** maintains context across restarts
5. **Message Queuing** ensures no messages are lost

### Architecture Flow
```
┌─────────────────┐
│ Claude Desktop  │
│ (Orchestrator)  │
└────────┬────────┘
         │ MCP Tools
         ▼
┌─────────────────┐
│   MCP Server    │
│                 │
│ ┌─────────────┐ │
│ │SessionManager│ │
│ └─────────────┘ │
└────────┬────────┘
         │ Manages
         ▼
┌─────────────────────────────────┐
│         Agent Sessions          │
│                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────┐│
│ │Developer│ │   QA    │ │ PM  ││
│ └────┬────┘ └────┬────┘ └──┬──┘│
│      │           │          │   │
│      └───────────┴──────────┘   │
│               ▼                  │
│        Shared Chat System       │
└─────────────────────────────────┘
```

## 🎮 Advanced Usage

### Persistent Agent Teams
Agents automatically persist their state. When you restart Claude Desktop:
1. Previously created agents are automatically restored
2. Conversation history is maintained
3. Agents can continue where they left off

### Agent Specialization
Each agent maintains its own:
- Conversation history
- Working directory
- Context and memory
- Tool permissions

### Autonomous Workflows
Agents can:
- Schedule their own follow-ups
- Delegate tasks to other agents
- Report progress through chat
- Escalate issues to the orchestrator

## 📚 Best Practices

### 1. Clear Role Definition
```
make-new-agent name: "SecurityAuditor"
send-agent-command agentName: "SecurityAuditor" 
                   command: "You are a security specialist. Review all code for vulnerabilities. Report findings in chat with @Developer tags."
```

### 2. Structured Communication
```
send-agent-command agentName: "ProjectManager" 
                   command: "Create a task list in chat. Assign tasks to team members using @mentions. Request status updates every hour."
```

### 3. Progress Monitoring
```
# Check what agents are doing
get-last-messages agentName: "Developer" count: 5

# Monitor chat for coordination
read-chat agentName: "Orchestrator" limit: 20
```

## 🛠️ Technical Details

- **TypeScript** with strict type checking
- **Event-driven architecture** for real-time communication
- **Message queuing** prevents message loss
- **Dependency injection** for clean architecture
- **Session persistence** using JSON files

## 🤝 Contributing

Contributions are welcome! Key areas for enhancement:
- Additional orchestration patterns
- Enhanced agent communication protocols
- New specialized agent templates
- Improved autonomous behaviors

## 📄 License

MIT

---

*Built for the Model Context Protocol ecosystem to enable powerful AI agent orchestration in Claude Desktop.*