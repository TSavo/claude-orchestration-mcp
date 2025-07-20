#!/usr/bin/env npx tsx

// Example of how to use the new event-based ClaudeSession API

import { ClaudeSession } from './claude-session.js';

async function example() {
  // Create a session
  const session = new ClaudeSession({
    model: 'sonnet',
    skipPermissions: true,
    agentName: 'ExampleAgent'
  });

  // Listen for responses
  session.on('message-received', (message) => {
    if (message.type === 'assistant') {
      console.log('Got response:', message.content);
    }
  });

  // Listen for streaming chunks if you want real-time output
  session.on('stream-chunk', ({ chunk }) => {
    process.stdout.write(chunk);
  });

  // Send a query - it returns void now!
  session.query('What is the capital of France?');

  // The response will come through the event listeners above
  // For async/await pattern, wrap in a Promise:
  await new Promise<void>((resolve) => {
    session.once('message-received', (msg) => {
      if (msg.type === 'assistant') resolve();
    });
  });
}

// Example with message queuing
async function _queueExample() {
  const session = new ClaudeSession({
    model: 'sonnet',
    agentName: 'QueueAgent'
  });

  // Fire off multiple queries - they'll queue automatically
  session.query('First question: What is 2+2?');
  session.query('Second question: What is the weather like?');
  session.query('Third question: Tell me a joke');

  // Each will be processed in order
}

// Example with shared chat integration
async function _chatExample() {
  const session = new ClaudeSession({
    model: 'sonnet',
    agentName: 'ChatAgent'
  });

  // When another agent sends a message to ChatAgent via shared chat,
  // it will automatically be queued and processed
  
  // The agent can use MCP tools to send/read chat:
  session.query('Use the send-chat tool to say hello to the team');
}

// Run example
example().catch(console.error);