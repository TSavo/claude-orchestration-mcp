#!/usr/bin/env npx tsx

// Test if sending a chat message to an idle agent activates it

import { ClaudeSession, SessionManager } from './claude-session.ts';
import { sharedChat } from './shared-chat.ts';

async function testChatActivation() {
  console.log('=== Testing Chat Message Activation ===\n');
  
  // Create a session manager to act as agent registry
  const sessionManager = new SessionManager();
  
  // Inject it into shared chat
  sharedChat.setAgentRegistry(sessionManager);
  
  // Create an idle agent through the session manager
  const idleAgent = sessionManager.createSession('IdleAgent', {
    model: 'sonnet',
    skipPermissions: true,
    historyPath: './.claude-agent-IdleAgent.json'
  });
  
  console.log('✓ Created idle agent: IdleAgent');
  
  // Set up listener to see when agent becomes active
  let messageCount = 0;
  idleAgent.onMessage((msg) => {
    if (msg.type === 'assistant') {
      messageCount++;
      console.log(`\n📥 IdleAgent response ${messageCount}:`, msg.content.slice(0, 100) + '...');
    } else if (msg.type === 'stream') {
      process.stdout.write('.');
    }
  });
  
  // Agent is now idle - send it a chat message
  console.log('\n--- Sending chat message to IdleAgent ---');
  await sharedChat.sendChatMessage('TestSender', 'Hey @IdleAgent, please introduce yourself!', 'IdleAgent');
  console.log('✓ Chat message sent');
  
  // Wait a bit to see if agent responds
  console.log('\n--- Waiting for agent to activate and respond ---');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  if (messageCount === 0) {
    console.log('❌ Agent did not activate from chat message');
  } else {
    console.log(`\n✅ Agent activated and sent ${messageCount} response(s)`);
  }
  
  // Test 2: Send a global message mentioning the agent
  console.log('\n--- Testing @mention activation ---');
  const prevCount = messageCount;
  await sharedChat.sendChatMessage('TestSender', 'Can someone help? @IdleAgent are you there?');
  console.log('✓ Global message with @mention sent');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  if (messageCount > prevCount) {
    console.log(`\n✅ Agent responded to @mention (${messageCount - prevCount} new response(s))`);
  } else {
    console.log('❌ Agent did not respond to @mention');
  }
  
  // Test 3: Send multiple messages rapidly
  console.log('\n--- Testing rapid message queuing ---');
  const rapidCount = messageCount;
  
  await sharedChat.sendChatMessage('Coordinator', 'Task 1 for you', 'IdleAgent');
  await sharedChat.sendChatMessage('Coordinator', 'Task 2 for you', 'IdleAgent');
  await sharedChat.sendChatMessage('Coordinator', 'Task 3 for you', 'IdleAgent');
  console.log('✓ Sent 3 rapid messages');
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const newResponses = messageCount - rapidCount;
  console.log(`\n✅ Agent processed ${newResponses} message(s) from the queue`);
  
  // Check the chat history
  console.log('\n--- Chat History ---');
  const messages = await sharedChat.getChatMessages(20);
  console.log(`Total messages in chat: ${messages.length}`);
  messages.slice(-10).forEach(msg => {
    const to = msg.to ? ` → @${msg.to}` : '';
    console.log(`[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.from}${to}: ${msg.content.slice(0, 50)}...`);
  });
}

testChatActivation().catch(console.error);