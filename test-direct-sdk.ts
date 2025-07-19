#!/usr/bin/env npx tsx

// Test the Claude SDK directly to see what it outputs

import { claude } from '@instantlyeasy/claude-code-sdk-ts';

async function testDirectSDK() {
  console.log('Testing Claude SDK directly...\n');
  
  const query = claude()
    .withModel('sonnet')
    .skipPermissions()
    .query('Say just the word "Hello"');
  
  console.log('=== Testing stream method ===');
  let streamContent = '';
  await query.stream((chunk) => {
    console.log('Chunk type:', typeof chunk);
    console.log('Chunk value:', chunk);
    console.log('Chunk constructor:', chunk?.constructor?.name);
    if (typeof chunk === 'object') {
      console.log('Chunk keys:', Object.keys(chunk));
      try {
        console.log('Chunk JSON:', JSON.stringify(chunk));
      } catch (e) {
        console.log('Cannot stringify chunk:', e);
      }
    }
    console.log('---');
    streamContent += chunk;
  });
  
  console.log('\n=== Final streamed content ===');
  console.log('Type:', typeof streamContent);
  console.log('Content:', streamContent);
  
  console.log('\n=== Testing asText method ===');
  const textResult = await claude()
    .withModel('sonnet')
    .skipPermissions()
    .query('Say just the word "World"')
    .asText();
  
  console.log('Text result type:', typeof textResult);
  console.log('Text result:', textResult);
}

testDirectSDK().catch(console.error);