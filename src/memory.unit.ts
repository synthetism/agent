/**
 * Memory Unit - Agent Memory Management with Event Emission
 * 
 * SYNET Unit Architecture v1.0.8 Implementation
 * 
 * Philosophy: One unit, one goal - memory management with debugging
 * 
 * Native Capabilities:
 * - push() - Add item to memory
 * - pop() - Remove last item from memory  
 * - list() - Get all memory items
 * - recall() - Search memory items
 * - clear() - Clear all memory
 * 
 * Events: Emits 'push', 'pop', 'clear', 'recall' events for debugging
 * 
 * @author Developer
 * @version 1.0.0
 * @follows Unit Architecture Doctrine v1.0.8
 */

import { 
  Unit, 
  createUnitSchema, 
  type UnitProps, 
  type TeachingContract,
  type UnitCore,
  type Capabilities,
  type Schema,
  type Validator 
} from '@synet/unit';
import { 
  Capabilities as CapabilitiesClass, 
  Schema as SchemaClass, 
  Validator as ValidatorClass 
} from '@synet/unit';
import { EventEmitter } from 'node:events';
import type { ChatMessage } from '@synet/ai';


// Generic memory item type
interface MemoryItem {
  id: string;
  data: ChatMessage;
  timestamp: string;
  type?: string;
}

interface MemoryConfig {
  maxItems?: number; // Maximum items to store (default: 100)
  enableEvents?: boolean; // Enable event emission (default: true)
}

interface MemoryProps extends UnitProps {
  maxItems: number;
  enableEvents: boolean;
  items: MemoryItem[];
  eventEmitter: EventEmitter;
}

// Memory event types
export interface MemoryPushEvent {
  type: 'push';
  item: MemoryItem;
  total: number;
  timestamp: string;
}

export interface MemoryPopEvent {
  type: 'pop';
  item: MemoryItem | null;
  total: number;
  timestamp: string;
}

export interface MemoryListEvent {
  type: 'list';
  count: number;
  timestamp: string;
}

export interface MemoryRecallEvent {
  type: 'recall';
  query: string;
  results: number;
  items: MemoryItem[];
  timestamp: string;
}

export interface MemoryClearEvent {
  type: 'clear';
  cleared: number;
  timestamp: string;
}

export interface MemoryEvictedEvent {
  type: 'evicted';
  removed: MemoryItem;
  reason: string;
}

export type MemoryEvent = 
  | MemoryPushEvent 
  | MemoryPopEvent 
  | MemoryListEvent 
  | MemoryRecallEvent 
  | MemoryClearEvent 
  | MemoryEvictedEvent;


export class Memory extends Unit<MemoryProps> {
  
  // Protected constructor enables evolution - Unit Architecture Doctrine 4
  protected constructor(props: MemoryProps) {
    super(props);
  }

  // v1.0.8 Consciousness Trinity Implementation (MANDATORY)
  protected build(): UnitCore {
    const capabilities = CapabilitiesClass.create(this.dna.id, {
      list: (...args: unknown[]) => this.list(),
      recall: (...args: unknown[]) => this.recall(args[0] as string),
      getMessages: (...args: unknown[]) => this.getMessages(),
    });

    const schema = SchemaClass.create(this.dna.id, {
      recall: {
        name: 'recall',
        description: 'Search memory items',
        parameters: { 
          type: 'object', 
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        },
        response: { type: 'array' }
      },
      list: {
        name: 'list',
        description: 'Get all memory items',
        parameters: { type: 'object', properties: {} },
        response: { type: 'array' }
      },
      getMessages: {
        name: 'getMessages',
        description: 'Get memory items as messages for AI consumption',
        parameters: { type: 'object', properties: {} },
        response: { type: 'array' }
      }
    });

    const validator = ValidatorClass.create({
      unitId: this.dna.id,
      capabilities,
      schema,
      strictMode: false
    });

    return { capabilities, schema, validator };
  }

  // Consciousness Trinity Access
  capabilities(): Capabilities { return this._unit.capabilities; }
  schema(): Schema { return this._unit.schema; }
  validator(): Validator { return this._unit.validator; }

  /**
   * Create Memory unit with specified configuration
   * DOCTRINE 4: Static create() factory pattern
   */
  static create(config: MemoryConfig = {}): Memory {
    const props: MemoryProps = {
      dna: createUnitSchema({
        id: 'memory',
        version: '1.0.0'
      }),
      maxItems: config.maxItems || 100,
      enableEvents: config.enableEvents !== false, // Default true
      items: [],
      eventEmitter: new EventEmitter()
    };

    return new Memory(props);
  }

  // =============================================================================
  // EVENT EMITTER ACCESS - Type-Safe Pattern
  // =============================================================================

  /**
   * Get event emitter for debugging (raw access)
   */
  getEmitter(): EventEmitter {
    return this.props.eventEmitter;
  }

  /**
   * Subscribe to memory events with type safety and auto-unsubscribe
   * Returns unsubscribe function for clean cleanup
   */
  on<T extends MemoryEvent>(
    eventType: T['type'], 
    handler: (event: T) => void
  ): () => void {
    this.props.eventEmitter.on(eventType, handler);
    
    // Return unsubscribe function
    return () => {
      this.props.eventEmitter.off(eventType, handler);
    };
  }

  /**
   * Manual unsubscribe (for cases where you keep handler reference)
   */
  off<T extends MemoryEvent>(
    eventType: T['type'], 
    handler: (event: T) => void
  ): void {
    this.props.eventEmitter.off(eventType, handler);
  }

  // =============================================================================
  // NATIVE CAPABILITIES
  // =============================================================================

  /**
   * Add item to memory
   */
  push(data: ChatMessage, type?: string): string {
    const item: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: new Date().toISOString(),
      type
    };

    this.props.items.push(item as MemoryItem);

    // Enforce max items limit
    if (this.props.items.length > this.props.maxItems) {
      const removed = this.props.items.shift();
      if (this.props.enableEvents && removed) {
        const evictedEvent: MemoryEvictedEvent = {
          type: 'evicted',
          removed,
          reason: 'max_items_exceeded'
        };
        this.props.eventEmitter.emit('evicted', evictedEvent);
      }
    }

    // Emit event for debugging
    if (this.props.enableEvents) {
      const pushEvent: MemoryPushEvent = {
        type: 'push',
        item: item as MemoryItem,
        total: this.props.items.length,
        timestamp: new Date().toISOString()
      };
      this.props.eventEmitter.emit('push', pushEvent);
    }

    return item.id;
  }

  /**
   * Remove and return last item from memory
   */
  pop(): MemoryItem | null {
    const item = this.props.items.pop() || null;

    // Emit event for debugging
    if (this.props.enableEvents) {
      const popEvent: MemoryPopEvent = {
        type: 'pop',
        item,
        total: this.props.items.length,
        timestamp: new Date().toISOString()
      };
      this.props.eventEmitter.emit('pop', popEvent);
    }

    return item;
  }

  /**
   * Get all memory items (read-only copy)
   */
  list(): MemoryItem[] {
    const items = [...this.props.items]; // Return copy to prevent mutation

    // Emit event for debugging
    if (this.props.enableEvents) {
      const listEvent: MemoryListEvent = {
        type: 'list',
        count: items.length,
        timestamp: new Date().toISOString()
      };
      this.props.eventEmitter.emit('list', listEvent);
    }

    return items;
  }

  /**
   * Search memory items by query
   */
  recall(query: string): MemoryItem[] {
    const results = this.props.items.filter(item => {
      const searchText = JSON.stringify(item.data).toLowerCase();
      const typeMatch = item.type?.toLowerCase().includes(query.toLowerCase());
      const dataMatch = searchText.includes(query.toLowerCase());
      return typeMatch || dataMatch;
    });

    // Emit event for debugging
    if (this.props.enableEvents) {
      const recallEvent: MemoryRecallEvent = {
        type: 'recall',
        query,
        results: results.length,
        items: results,
        timestamp: new Date().toISOString()
      };
      this.props.eventEmitter.emit('recall', recallEvent);
    }

    return results;
  }

  /**
   * Clear all memory
   */
  clear(): number {
    const count = this.props.items.length;
    this.props.items.length = 0; // Clear array contents instead of reassigning

    // Emit event for debugging
    if (this.props.enableEvents) {
      const clearEvent: MemoryClearEvent = {
        type: 'clear',
        cleared: count,
        timestamp: new Date().toISOString()
      };
      this.props.eventEmitter.emit('clear', clearEvent);
    }

    return count;
  }

  /**
   * Get memory items as ChatMessages for AI consumption
   * Filters and converts MemoryItems that contain ChatMessage data
   */
  getMessages(): ChatMessage[] {
    return this.props.items
      .filter(item => this.isValidChatMessage(item.data))
      .map(item => item.data as ChatMessage);
  }

  /**
   * Check if a memory item contains valid ChatMessage data
   */
  private isValidChatMessage(data: unknown): data is ChatMessage {
    return (
      typeof data === 'object' &&
      data !== null &&
      'role' in data &&
      'content' in data &&
      typeof (data as Record<string, unknown>).role === 'string' &&
      typeof (data as Record<string, unknown>).content === 'string'
    );
  }

  /**
   * Get number of items in memory
   */
  size(): number {
    return this.props.items.length;
  }

  // =============================================================================
  // UNIT ARCHITECTURE REQUIRED METHODS
  // =============================================================================

  whoami(): string {
    return `Memory Unit [${this.dna.id}] v${this.dna.version} - ${this.props.items.length}/${this.props.maxItems} items`;
  }

  // DOCTRINE 9: ALWAYS TEACH - v1.0.8 Consciousness Trinity Pattern
  teach(): TeachingContract {
    return {
      unitId: this.dna.id,
      capabilities: this._unit.capabilities,
      schema: this._unit.schema,
      validator: this._unit.validator
    };
  }

  help(): string {
    return `
Memory Unit - Agent Memory Management with Event Emission

Native Capabilities:
• push(data, type?) - Add item to memory and get ID
• pop() - Remove and return last item  
• list() - Get all memory items (read-only)
• recall(query) - Search memory items
• clear() - Clear all memory
• size() - Get number of items

Event Debugging:
• on('push', handler) - Listen for push events
• on('pop', handler) - Listen for pop events  
• on('list', handler) - Listen for list events
• on('recall', handler) - Listen for recall events
• on('clear', handler) - Listen for clear events
• getEmitter() - Get EventEmitter for custom events

Usage:
  const memory = Memory.create({ maxItems: 50 });
  
  // Debug events
  memory.on('push', (event) => console.log('Pushed:', event));
  
  // Use memory
  const id = memory.push({ message: 'Hello' }, 'chat');
  const items = memory.list();
  const results = memory.recall('Hello');

Learning:
  agent.learn([memory.teach()]);
  const id = await agent.execute('memory.push', data, 'type');
    `;
  }
}
