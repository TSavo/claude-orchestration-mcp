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

// Additional examples removed to eliminate unused code warnings

// Run example
example().catch(console.error);