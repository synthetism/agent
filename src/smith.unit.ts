/**
 * Agent Smith - AI Tool Caller with Chat-based Workflow
 * 
 * Smith uses AI chat with full history to:
 * 1. Parse goals into actionable steps  
 * 2. Decide which tools to call next
 * 3. Detect when goals are complete
 * 4. Handle errors through AI reasoning
 * 
 * Following Unit Architecture principles with AI dependency injection
 */

import { Unit, createUnitSchema, UnitProps } from '@synet/unit';
import { Capabilities, Schema, Validator, UnitCore } from '@synet/unit';
import { Capabilities as CapabilitiesClass, Schema as SchemaClass, Validator as ValidatorClass } from '@synet/unit';
import type { AIOperator, ChatMessage } from '@synet/ai';

const VERSION = '1.0.0';

// =============================================================================
// TYPES
// =============================================================================

interface SmithConfig {
  ai: AIOperator;
  systemPrompt?: string;
  maxIterations?: number;
}

interface SmithProps extends UnitProps {
  ai: AIOperator;
  systemPrompt: string;
  maxIterations: number;
}

interface SmithExecution {
  goal: string;
  messages: ChatMessage[];
  completed: boolean;
  iterations: number;
  result?: string;
}

// =============================================================================
// SMITH UNIT
// =============================================================================

export class Smith extends Unit<SmithProps> {
  
  protected constructor(props: SmithProps) {
    super(props);
  }

  // =============================================================================
  // CONSCIOUSNESS TRINITY (Unit Architecture v1.0.7)
  // =============================================================================

  protected build(): UnitCore {
    const capabilities = CapabilitiesClass.create(this.dna.id, {
      executeMission: (...args: unknown[]) => this.executeMission(args[0] as string),
      chatWithAI: (...args: unknown[]) => this.chatWithAI(args[0] as ChatMessage[])
    });

    // Smith needs schemas for his own capabilities (not empty like pure orchestrators)
    const schema = SchemaClass.create(this.dna.id, {
      executeMission: {
        name: 'executeMission',
        description: 'Execute a mission using AI chat workflow',
        parameters: {
          type: 'object',
          properties: {
            goal: {
              type: 'string',
              description: 'The mission goal to execute'
            }
          },
          required: ['goal']
        },
        response: { 
          type: 'object', 
          properties: { 
            completed: { type: 'boolean', description: 'Whether mission was completed' }, 
            iterations: { type: 'number', description: 'Number of iterations used' } 
          } 
        }
      },
      chatWithAI: {
        name: 'chatWithAI', 
        description: 'Chat directly with Smith\'s AI',
        parameters: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              description: 'Array of chat messages'
            }
          },
          required: ['messages']
        },
        response: { type: 'string' }
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

  capabilities(): Capabilities { return this._unit.capabilities; }
  schema(): Schema { return this._unit.schema; }
  validator(): Validator { return this._unit.validator; }

  // =============================================================================
  // FACTORY METHOD
  // =============================================================================

  static create(config: SmithConfig): Smith {
    const props: SmithProps = {
      dna: createUnitSchema({
        id: 'smith',
        version: VERSION
      }),
      ai: config.ai,
      systemPrompt: config.systemPrompt || Smith.createDefaultSystemPrompt(),
      maxIterations: config.maxIterations || 10
    };

    return new Smith(props);
  }

  // =============================================================================
  // CORE EXECUTION
  // =============================================================================

  /**
   * Execute a goal using AI chat workflow
   */
  async executeMission(goal: string): Promise<SmithExecution> {
    console.log(`🕶️  [Agent Smith] Mission received: ${goal}`);
    
    const execution: SmithExecution = {
      goal,
      messages: [
        { role: 'system', content: this.createContextualSystemPrompt() },
        { role: 'user', content: goal }
      ],
      completed: false,
      iterations: 0
    };

    while (!execution.completed && execution.iterations < this.props.maxIterations) {
      execution.iterations++;
      console.log(`🔄 [Smith] Iteration ${execution.iterations}/${this.props.maxIterations}`);
      
      try {
        // AI decides next action with full context
        const response = await this.props.ai.call(execution.messages[execution.messages.length - 1].content, { 
          useTools: true 
        });

        console.log(`💭 [Smith] AI Response: ${response.content}`);

        // Add AI response to conversation
        execution.messages.push({
          role: 'assistant',
          content: response.content
        });

        // Check if mission is complete
        const isComplete = this.isGoalComplete(response.content);
        console.log(`🔍 [Smith] Mission complete check: ${isComplete}`);
        
        if (isComplete) {
          execution.completed = true;
          execution.result = response.content;
          console.log(`✅ [Smith] Mission accomplished in ${execution.iterations} iterations`);
          break;
        }

        // Check for errors and let AI handle them
        if (this.hasErrors(response.content)) {
          console.log(`⚠️  [Smith] Error detected, asking AI for recovery`);
          execution.messages.push({
            role: 'user',
            content: 'An error occurred. Please analyze and determine next action.'
          });
        } else {
          // Continue workflow
          execution.messages.push({
            role: 'user',
            content: 'Continue with next step of the mission.'
          });
        }

      } catch (error: any) {
        console.error(`❌ [Smith] Execution error:`, error);
        
        // Let AI handle the error
        execution.messages.push({
          role: 'user',
          content: `Error occurred: ${error?.message || error}. Please analyze and determine recovery action.`
        });
      }
    }

    if (!execution.completed) {
      console.log(`⏰ [Smith] Mission timeout after ${this.props.maxIterations} iterations`);
    }

    return execution;
  }

  /**
   * Direct chat with Smith's AI
   */
  async chatWithAI(messages: ChatMessage[]): Promise<string> {
    const response = await this.props.ai.call(messages[messages.length - 1].content, { 
      useTools: true 
    });

    return response.content;
  }

  // =============================================================================
  // DECISION LOGIC
  // =============================================================================

  /**
   * Detect if goal is complete based on AI response
   */
  private isGoalComplete(response: string): boolean {
    const completionSignals = [
      'mission completed',
      'mission accomplished', 
      'goal achieved',
      'task completed',
      'all done',
      'objective complete',
      'MISSION_COMPLETE',
      '✅'
    ];

    const lowerResponse = response.toLowerCase();
    return completionSignals.some(signal => lowerResponse.includes(signal));
  }

  /**
   * Detect errors in AI response
   */
  private hasErrors(response: string): boolean {
    const errorSignals = [
      'error',
      'failed',
      'exception',
      'cannot',
      'unable to',
      'permission denied',
      'not found',
      'timeout'
    ];

    const lowerResponse = response.toLowerCase();
    return errorSignals.some(signal => lowerResponse.includes(signal));
  }

  // =============================================================================
  // SYSTEM PROMPTS
  // =============================================================================

  private static createDefaultSystemPrompt(): string {
    return `You are Agent Smith. Your mission is to execute goals methodically using available tools.

EXECUTION PROTOCOL:
1. Analyze the goal and identify required steps
2. Execute tools one by one with precision
3. Report progress after each action
4. When mission is complete, end with "MISSION_COMPLETE"

TOOL USAGE:
- Use tools to gather data, process information, and save results
- Always explain what you're doing and why
- If a tool fails, analyze the error and try alternative approaches

ERROR HANDLING:
- If something fails, explain the error and propose solutions
- Try alternative approaches when primary methods fail
- Ask for clarification if the goal is unclear

COMMUNICATION:
- Be concise but thorough
- Report what you've accomplished
- Indicate when you need to continue vs when you're done
- Use "MISSION_COMPLETE" when the goal is fully achieved`;
  }

  private createContextualSystemPrompt(): string {
    const learnedTools = this.capabilities().list().filter(cap => !cap.startsWith('smith.'));
    
    return `${this.props.systemPrompt}

AVAILABLE TOOLS:
${learnedTools.length > 0 ? learnedTools.join('\n- ') : 'No tools learned yet'}

Remember: Execute tools step by step and report "MISSION_COMPLETE" when done.`;
  }

  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  /**
   * Smith teaches his execution capabilities
   */
  teach(): { unitId: string; capabilities: Capabilities; schema: Schema; validator: Validator } {
    return {
      unitId: this.dna.id,
      capabilities: this._unit.capabilities,
      schema: this._unit.schema,
      validator: this._unit.validator
    };
  }

  /**
   * Smith's identity
   */
  whoami(): string {
    const tools = this.capabilities().list().length;
    return `🕶️  Agent Smith - AI Mission Executor (${tools} tools available)`;
  }

  /**
   * Smith's help documentation
   */
  help(): string {
    return `
Agent Smith - AI Tool Caller

USAGE:
  const smith = Smith.create({ ai });
  smith.learn([fs.teach(), weather.teach()]);
  
  const result = await smith.execute("Get weather and save report");

METHODS:
  • execute(goal) - Execute a mission using AI workflow
  • chat(messages) - Direct AI conversation
  • learn(contracts) - Learn tools from other units
  • teach() - Share Smith's capabilities

EXAMPLES:
  await smith.execute("Find weather in Tokyo and save to file");
  await smith.execute("Research AI trends and create summary");
  await smith.execute("Debug code and update documentation");
    `;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SmithConfig, SmithExecution };
