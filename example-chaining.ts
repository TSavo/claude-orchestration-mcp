#!/usr/bin/env npx tsx

// Example showing the chaining pattern with onMessage

import { ClaudeSession } from './claude-session.js';

async function main() {
  // Create agent with chained onMessage listener
  const agent = new ClaudeSession({
    model: 'sonnet',
    agentName: 'ChainedAgent'
  })
  .onMessage((message) => {
    // This receives ALL message types
    switch (message.type) {
      case 'stream':
        // Real-time streaming chunks
        process.stdout.write(message.content);
        break;
        
      case 'assistant':
        // Complete message when done
        console.log('\n\n✓ Complete response received');
        console.log(`  Duration: ${message.duration}ms`);
        break;
    }
  });

  // Now you can just call query
  agent.query('Tell me a short joke');

  // You can also add more listeners later
  agent.onMessage((msg) => {
    if (msg.type === 'assistant') {
      console.log('  Word count:', msg.content.split(' ').length);
    }
  });

  // Multiple queries will queue
  agent.query('What is 2+2?');
  agent.query('What color is the sky?');

  // Wait a bit for all to complete
  await new Promise(resolve => setTimeout(resolve, 10000));
}

// Another example with different patterns
async function streamingExample() {
  console.log('\n=== Streaming Example ===');
  
  const agent = new ClaudeSession({ model: 'sonnet' });
  
  // Only care about streaming? Just listen for that
  agent.onMessage((msg) => {
    if (msg.type === 'stream') {
      process.stdout.write(msg.content);
    }
  });
  
  agent.query('Count from 1 to 5 slowly');
  
  // Wait for completion
  await new Promise(resolve => {
    agent.onMessage((msg) => {
      if (msg.type === 'assistant') resolve(null);
    });
  });
}

main()
  .then(() => streamingExample())
  .catch(console.error);