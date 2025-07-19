#!/usr/bin/env npx tsx

// Test script for ClaudeSession wrapper in isolation

import { ClaudeSession } from './claude-session.ts';

async function testBasicSession() {
  console.log('=== Testing Basic ClaudeSession ===');
  
  try {
    // Create a basic session without agent name
    const session = new ClaudeSession({
      model: 'sonnet',
      skipPermissions: true,
      historyPath: './test-session-history.json'
    });
    
    console.log('✓ Created session:', session.getSessionId());
    
    // Test query with onMessage chaining
    console.log('\n--- Testing basic query ---');
    
    await new Promise<void>((resolve) => {
      session
        .onMessage((message) => {
          if (message.type === 'assistant') {
            console.log('Response type:', typeof message.content);
            console.log('Response:', message.content);
            resolve();
          }
        })
        .query('What is 2+2?');
    });
    
  } catch (error) {
    console.error('❌ Error in basic session test:', error);
  }
}

async function testAgentSession() {
  console.log('\n=== Testing Agent Session with Message Queuing ===');
  
  try {
    // Create a session with agent name
    const agentSession = new ClaudeSession({
      model: 'sonnet',
      skipPermissions: true,
      agentName: 'TestAgent',
      historyPath: './test-agent-history.json'
    });
    
    console.log('✓ Created agent session:', agentSession.getSessionId());
    console.log('  Agent name:', 'TestAgent');
    
    // Test multiple queries (should queue)
    console.log('\n--- Testing message queuing ---');
    
    let responseCount = 0;
    const responses: string[] = [];
    
    await new Promise<void>((resolve) => {
      agentSession
        .onMessage((message) => {
          if (message.type === 'assistant') {
            responseCount++;
            responses.push(message.content);
            console.log(`Response ${responseCount}:`, JSON.stringify(message.content).slice(0, 50) + '...');
            
            if (responseCount === 3) {
              resolve();
            }
          }
        });
      
      // Fire off multiple queries rapidly - they should queue
      agentSession.query('First message');
      agentSession.query('Second message');
      agentSession.query('Third message');
    });
    
    console.log('✓ All 3 messages processed in order');
    
  } catch (error) {
    console.error('❌ Error in agent session test:', error);
  }
}

async function testSessionEvents() {
  console.log('\n=== Testing Session Events ===');
  
  try {
    const eventSession = new ClaudeSession({
      model: 'sonnet',
      skipPermissions: true,
      agentName: 'EventTestAgent'
    });
    
    // Listen for events
    eventSession.on('session-started', (data) => {
      console.log('📢 Session started:', data);
    });
    
    eventSession.on('message-sent', (message) => {
      console.log('📢 Message sent:', message.content.slice(0, 50) + '...');
    });
    
    // Send a query
    console.log('\n--- Sending query to trigger events ---');
    
    await new Promise<void>((resolve) => {
      eventSession
        .onMessage((message) => {
          switch (message.type) {
            case 'stream':
              process.stdout.write('.');
              break;
            case 'assistant':
              console.log('\n✓ Got complete response');
              console.log('📢 Message received:', JSON.stringify(message.content).slice(0, 50) + '...');
              resolve();
              break;
          }
        })
        .query('Test event system');
    });
    
  } catch (error) {
    console.error('❌ Error in event test:', error);
  }
}

async function testQueueBehavior() {
  console.log('\n=== Testing Queue Behavior ===');
  
  try {
    const session = new ClaudeSession({
      model: 'sonnet',
      skipPermissions: true,
      agentName: 'QueueTestAgent'
    });
    
    console.log('--- Testing rapid-fire messages ---');
    
    let startTime = Date.now();
    let messageTimings: Array<{id: string, time: number}> = [];
    
    // Set up message tracking
    let completedCount = 0;
    
    session
      .on('message-sent', (message) => {
        messageTimings.push({
          id: message.id,
          time: Date.now() - startTime
        });
      })
      .onMessage((message) => {
        if (message.type === 'assistant') {
          completedCount++;
        }
      });
    
    // Send messages rapidly
    for (let i = 1; i <= 5; i++) {
      session.query(`Message ${i}`);
      console.log(`Queued message ${i}`);
    }
    
    // Wait for all to complete
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (completedCount === 5) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    
    console.log('\n✓ Message queue timings:');
    messageTimings.forEach(timing => {
      console.log(`  ${timing.id}: ${timing.time}ms`);
    });
    
  } catch (error) {
    console.error('❌ Error in queue test:', error);
  }
}

async function main() {
  console.log('Starting ClaudeSession isolated tests...\n');
  
  await testBasicSession();
  await testAgentSession();
  await testSessionEvents();
  await testQueueBehavior();
  
  console.log('\n✅ All tests completed');
  process.exit(0);
}

// Run tests
main().catch(console.error);