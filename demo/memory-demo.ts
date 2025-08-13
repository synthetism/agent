/**
 * Memory Unit Debugging Example
 * 
 * Demonstrates Memory unit with event emission for debugging operations
 */

import { Memory, type MemoryPushEvent, type MemoryPopEvent, type MemoryRecallEvent, type MemoryClearEvent } from '../src/memory.unit';

// Example: Memory unit with event debugging
export async function memoryDebuggingExample() {
  console.log('🧠 Memory Unit Debugging Example\n');

  // Create memory with debugging events
  const memory = Memory.create({ 
    maxItems: 10, 
    enableEvents: true 
  });

  // Set up event listeners with type safety and auto-unsubscribe
  const unsubscribePush = memory.on('push', (event: MemoryPushEvent) => {
    console.log(`📝 PUSH: Added item ${event.item.id} | Total: ${event.total}`);
  });

  const unsubscribePop = memory.on('pop', (event: MemoryPopEvent) => {
    console.log(`🔄 POP: Removed ${event.item?.id || 'none'} | Total: ${event.total}`);
  });

  const unsubscribeRecall = memory.on('recall', (event: MemoryRecallEvent) => {
    console.log(`🔍 RECALL: Query "${event.query}" found ${event.results} items`);
  });

  const unsubscribeClear = memory.on('clear', (event: MemoryClearEvent) => {
    console.log(`🗑️  CLEAR: Removed ${event.cleared} items`);
  });

  // Test memory operations with debugging
  console.log('1. Adding items to memory...');
  memory.push({ role: 'user', content: 'Hello World' }, 'greeting');
  memory.push({ role: 'user', content: 'Process data' }, 'data');
  memory.push({ role: 'user', content: 'Complete task' }, 'result');

  console.log('\n2. Listing all items...');
  const items = memory.list();
  console.log(`   Found ${items.length} items`);

  console.log('\n3. Searching memory...');
  const greetings = memory.recall('greeting');
  const processes = memory.recall('process');

  console.log('\n4. Removing last item...');
  const popped = memory.pop();

  console.log('\n5. Current memory state:');
  console.log(`   Size: ${memory.size()} items`);
  console.log(`   Unit: ${memory.whoami()}`);

  console.log('\n6. Clearing memory...');
  const cleared = memory.clear();

  console.log('\n7. Cleaning up event listeners...');
  unsubscribePush();
  unsubscribePop();
  unsubscribeRecall();
  unsubscribeClear();
  console.log('   ✅ All event listeners cleaned up');

  return memory;
}

// Example: Memory unit teaching capabilities
export async function memoryTeachingExample() {
  console.log('\n🎓 Memory Unit Teaching Example\n');

  // Create memory unit
  const memory = Memory.create({ maxItems: 5 });

  // Show unit info
  console.log('Unit Information:');
  console.log(`- ${memory.whoami()}`);
  console.log(`- Capabilities: ${memory.capabilities().list()}`);
  console.log(`- Help:\n${memory.help()}`);

  // Demonstrate teaching contract
  const teachingContract = memory.teach();
  console.log('\nTeaching Contract:');
  console.log(`- Unit ID: ${teachingContract.unitId}`);
  console.log(`- Capabilities: ${teachingContract.capabilities.list()}`);
  console.log(`- Schema Size: ${teachingContract.schema.size()}`);

  return memory;
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await memoryDebuggingExample();
      await memoryTeachingExample();
    } catch (error) {
      console.error('Example failed:', error);
    }
  })();
}
