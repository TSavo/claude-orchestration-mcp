#!/usr/bin/env npx tsx

// Debug script to see what's being passed by the SDK

import { ClaudeSession } from './claude-session.ts';

async function debugStream() {
  const session = new ClaudeSession({
    model: 'sonnet',
    skipPermissions: true
  });

  // Listen to raw stream chunks
  session.on('stream-chunk', ({ chunk }) => {
    console.log('Stream chunk type:', typeof chunk);
    console.log('Stream chunk:', chunk);
    if (typeof chunk === 'object') {
      console.log('Chunk keys:', Object.keys(chunk));
      console.log('Chunk JSON:', JSON.stringify(chunk, null, 2));
    }
  });

  // Also listen to message events
  session.onMessage((msg) => {
    console.log('\nMessage event:', msg.type);
    if (msg.type === 'stream') {
      console.log('Stream content:', msg.content);
    }
  });

  session.query('Say just "Hello"');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 5000));
}

debugStream().catch(console.error);