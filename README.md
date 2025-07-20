# Claude Orchestration MCP

A multi-agent orchestration system for Claude using MCP (Model Context Protocol) with event-driven architecture. This system enables multiple Claude agents to work together, communicate through a shared chat system, and coordinate complex tasks.

## Features

- **Event-driven Architecture**: All agent communication happens through events with a clean `onMessage` API
- **Message Queuing**: Multiple messages are automatically combined into a single prompt for efficiency
- **Inter-agent Communication**: Agents can communicate through a shared chat system
- **Session Persistence**: Agent conversations are saved and restored automatically
- **MCP Integration**: Full Model Context Protocol server for managing agents
- **Dependency Injection**: Clean architecture with proper separation of concerns
- **TypeScript First**: Fully typed with strict TypeScript configuration

## Installation

```bash
npm install
```

## Quick Start

### Basic Usage

```typescript
import { ClaudeSession } from './claude-session.js';

// Create an agent
const agent = new ClaudeSession({
  model: 'sonnet',
  agentName: 'Assistant'
});

// Listen for responses
agent.onMessage((message) => {
  if (message.type === 'assistant') {
    console.log('Response:', message.content);
  }
});

// Send a query
agent.query('Hello, how can you help me?');
```

### Multi-Agent System

```typescript
import { SessionManager } from './claude-session.js';
import { sharedChat } from './shared-chat.js';

// Create a session manager
const sessionManager = new SessionManager();

// Wire up the shared chat system
sharedChat.setAgentRegistry(sessionManager);

// Create multiple agents
const developer = sessionManager.createSession('Developer', {
  model: 'sonnet'
});

const reviewer = sessionManager.createSession('Reviewer', {
  model: 'sonnet'
});

// Agents can communicate through shared chat
await sharedChat.sendChatMessage('Developer', 'Code is ready for review', 'Reviewer');
// The Reviewer agent will automatically receive and process this message
```

## Architecture

### Event-Based Message Flow

The system uses an event-driven architecture where all output flows through events:

```typescript
agent
  .onMessage((msg) => {
    switch (msg.type) {
      case 'stream':    // Real-time streaming chunks
      case 'assistant': // Complete response
    }
  })
  .query('Your prompt here');
```

### Message Queuing

When multiple messages are sent to an agent while it's busy, they are automatically queued and combined into a single prompt:

```typescript
agent.query('First question');
agent.query('Second question'); 
agent.query('Third question');
// These will be combined into one prompt with all three questions
```

### Shared Chat System

Agents can communicate through a shared chat system that automatically delivers messages:

```typescript
// Send a targeted message
await sharedChat.sendChatMessage('Sender', 'Message content', 'TargetAgent');

// Send a broadcast message
await sharedChat.sendChatMessage('Sender', 'Hello everyone!');

// Messages with @mentions are automatically routed
await sharedChat.sendChatMessage('PM', 'Hey @Developer, please review @QA findings');
```

## MCP Server

The MCP server provides tools for managing agents:

### Available Tools

- `make-new-agent` - Create a new agent with specified name and model
- `send-agent-command` - Send a command to a specific agent
- `get-last-messages` - Retrieve recent messages from an agent
- `stop-agent` - Stop an agent's current operation
- `delete-agent` - Remove an agent permanently
- `send-chat` - Send a message to the shared chat
- `read-chat` - Read messages from the shared chat
- `clear-agent` - Clear an agent's history
- `summarize-agent` - Get a summary of an agent's work

### Running the MCP Server

```bash
npm run start:mcp
```

Then configure your Claude Desktop app to use the MCP server by adding to your Claude Desktop config:

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

## API Reference

### ClaudeSession

Main class for creating and managing individual agents.

#### Constructor Options

```typescript
interface SessionConfig {
  model?: 'sonnet' | 'haiku' | 'opus';
  historyPath?: string;
  agentName?: string;
  skipPermissions?: boolean;
  autoSave?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

#### Methods

- `query(prompt: string): void` - Send a prompt to the agent
- `onMessage(callback: Function): ClaudeSession` - Listen for messages (chainable)
- `getStatus(): object` - Get current session status
- `getSessionId(): string` - Get the session identifier

#### Events

- `message` - All message types (stream, assistant)
- `message-sent` - When a message is sent to Claude
- `message-received` - When a complete response is received
- `stream-chunk` - Individual streaming chunks
- `error` - Error events

### SessionManager

Manages multiple agent sessions and implements the AgentRegistry interface.

#### Methods

- `createSession(name: string, config?: SessionConfig): ClaudeSession`
- `getSession(sessionId: string): ClaudeSession | undefined`
- `getSessionByName(name: string): ClaudeSession | undefined`
- `listSessions(): SessionInfo[]`
- `removeSession(sessionId: string): void`

### SharedChatStore

Singleton for managing inter-agent communication.

#### Methods

- `sendChatMessage(from: string, content: string, to?: string): Promise<ChatMessage>`
- `getChatMessages(limit?: number): ChatMessage[]`
- `setAgentRegistry(registry: AgentRegistry): void`

## Development

### Running Tests

```bash
# Test the ClaudeSession wrapper
npm run test:session

# Test chat activation
npm run test:chat

# Run the MCP server
npm run start:mcp
```

### TypeScript

The project uses strict TypeScript configuration with:
- ES2024 target
- NodeNext module resolution
- Strict type checking
- No implicit any

### Building

```bash
npm run build
```

## Examples

See the `example-*.ts` files for more usage examples:
- `example-usage.ts` - Basic usage patterns
- `example-chaining.ts` - Method chaining examples
- `test-chat-activation.ts` - Inter-agent communication demo

## Architecture Notes

### Message Combining

When multiple messages are queued, they are combined into a single prompt for efficiency:
```
Message 1: "What is 2+2?"
Message 2: "What is the capital of France?"
Message 3: "Tell me a joke"

Combined prompt sent to Claude:
"What is 2+2?

What is the capital of France?

Tell me a joke"
```

### Session Persistence

Agent sessions are automatically saved to disk and can be resumed:
- Session history: `.claude-agent-[name].json`
- Shared chat: `.claude-chat.json`
- Session registry: `.session-registry.json`

### Clean Architecture

The system uses dependency injection to avoid tight coupling:
- `AgentRegistry` interface defines the contract
- `SessionManager` implements the registry
- `SharedChatStore` accepts any registry implementation

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.