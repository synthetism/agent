/**
 * Agent Smith - AI Mission Orchestrator with Identity System
 * 
 * Smith loads identity from config and orchestrates other AIs to execute missions.
 * Following @synet/ai pattern: no capabilities, no schemas - pure orchestrator.
 * 
 * Smith's role:
 * 1. Load identity configuration 
 * 2. Learn available tools from other units
 * 3. Generate prompts for worker AIs to execute tools
 * 4. Monitor responses and decide next actions
 */

import { Unit, createUnitSchema, } from '@synet/unit';
import type { Capabilities, Schema, Validator, UnitCore, UnitProps, TeachingContract } from '@synet/unit';
import { Capabilities as CapabilitiesClass, Schema as SchemaClass, Validator as ValidatorClass } from '@synet/unit';
import type { AIResponse, ChatMessage } from '@synet/ai';
import { Memory } from './memory.unit'

import type { AIOperator } from '@synet/ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { 
  AgentInstructions, 
  AgentTemplate, 
  Templates, 
  TemplateVariables,
  AgentEvent
} from "./types/agent.types"


/* 
// Import the proper type
interface AgentInstructions {
  name: string;
  description: string;
  version: string;
  templates: {
    taskBreakdown: {
      prompt: { user: string; system: string };
      variables: string[];
    };
    workerPromptGeneration: {
      prompt: { user: string; system: string };
      variables: string[];
    };
  };
} */

class SimpleTemplateEngine {
  static render(template: { user: string; system: string }, variables: TemplateVariables): string {
    let rendered = template.user;
    
    // Replace simple variables {{variableName}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName as keyof TemplateVariables];
      return value !== undefined ? String(value) : match;
    });
    
    return rendered.trim();
  }

  nonstatic() {
    // Non-static method implementation
  }
}

const VERSION = '1.0.0';

// =============================================================================
// TYPES
// =============================================================================

interface SwitchIdentity {
  name: string;
  description: string;
  systemPrompt: string; 
  promptTemplate: string;
  missionStrategy: {
    analysis: string;
    toolSelection: string;
    promptGeneration: string;
    responseEvaluation: string;
  };
  completionSignals: string[];
  errorRecovery: {
    maxRetries: number;
    fallbackStrategy: string;
    escalationThreshold: string;
  };
}

interface SwitchConfig {
  ai: AIOperator;
  agent?: AIOperator
  identityPath?: string;
  maxIterations?: number;
  templateInstructions: AgentInstructions; // Parsed template object, not file path
}

interface SwitchProps extends UnitProps {
  ai: AIOperator;
  identity: SwitchIdentity;
  maxIterations: number;
  eventMemory: AgentEvent[]; // Store structured events for awareness
  templateInstructions: AgentInstructions; // Parsed template object
  memory: Memory;
}

interface SmithExecution {
  goal: string;
  messages: ChatMessage[];
  completed: boolean;
  iterations: number;
  result?: string;
}

// =============================================================================
// Switch UNIT
// =============================================================================

export class Switch extends Unit<SwitchProps> {

  protected constructor(props: SwitchProps) {
    super(props);
  }

  // =============================================================================
  // CONSCIOUSNESS TRINITY (Unit Architecture v1.0.7)
  // =============================================================================

  protected build(): UnitCore {
    // Smith has no teachable capabilities - he's the orchestrator (following @synet/ai pattern)
    const capabilities = CapabilitiesClass.create(this.dna.id, {});

    // Smith has no schemas - he orchestrates tools, doesn't become one
    const schema = SchemaClass.create(this.dna.id, {});

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

  static create(config: SwitchConfig): Switch {
    // Load Switch's identity configuration
    const identityPath = config.identityPath || path.join(__dirname, '..', 'config', 'switch.json');
    const identity: SwitchIdentity = JSON.parse(readFileSync(identityPath, 'utf-8'));

    // No file parsing here - template instructions come pre-parsed from outside
    const props: SwitchProps = {
      dna: {
        id: 'switch',
        version: VERSION,
        description: "AI Agent - Mission Operator"
      },
      ai: config.ai,
      identity,
      maxIterations: config.maxIterations || 10,
      eventMemory: [], 
      templateInstructions: config.templateInstructions,
      memory: Memory.create()
    };

    return new Switch(props);
  }



  // =============================================================================
  // CORE EXECUTION
  // =============================================================================

  /**
   * Execute a mission using task breakdown approach:
   * 1. Entry call - Smith breaks down mission into discrete steps
   * 2. Execute each step individually  
   * 3. Analyze result after each step
   * 4. Continue until complete
   * 5. Exit call - Smith reports final result
   */
  async run(task: string): Promise<SmithExecution> {
    console.log(`[${this.props.identity.name}] Mission received: ${task}`);
    
    const execution: SmithExecution = {
      goal: task,
      messages: [],
      completed: false,
      iterations: 0
    };

    // Smith's memory for the full conversation
 
    this.props.memory.push({
       role: 'system', 
       content: this.props.identity.systemPrompt 
    });

    try {
      // STEP 1: Entry call - get task breakdown
      console.log(`[${this.props.dna.id}] Breaking down mission into steps...`);

      const taskPrompt = this.renderTemplate('taskBreakdown', {
        task,
        tools: this.capabilities().list().join(', ') || 'No tools available',
        schemas: 'Schemas are included in the tool call'
      });


      const taskBreakdown = await this.props.ai.chat([
        { role: 'system', content: this.props.identity.missionStrategy.analysis},
        { role: 'user', content: taskPrompt }
      ]);

      console.log(`[${this.props.dna.id}] Task breakdown:\n${taskBreakdown.content}`);
      
       this.props.memory.push({
        role: 'user',
        content: taskPrompt
      }); 

      this.props.memory.push({
        role: 'assistant',
        content: taskBreakdown.content
      });

      // STEP 2: Execute steps individually
      while (!execution.completed && execution.iterations < this.props.maxIterations) {
        execution.iterations++;
        console.log(`[Switch] Iteration ${execution.iterations}/${this.props.maxIterations}`);
        
        // Generate next specific prompt using template and full memory context
        const promptTemplate = this.renderTemplate('workerPromptGeneration',{
            promptTemplate: this.props.identity.promptTemplate,
        });

        // Switch thinks about next step (internal reasoning)
        const nextStepResponse = await this.props.ai.chat([
          ...this.props.memory.getMessages(),
          { role: 'user', content: promptTemplate }
        ]);

        console.log(`[${this.props.dna.id}] Planning next step: ${nextStepResponse.content}`);
        
        // DON'T store planning in memory - it confuses the worker AI
        // Create clean worker context with just the essential prompt
        const workerMemory: ChatMessage[] = [
          { role: 'system', content: this.props.identity.systemPrompt },
          { role: 'user', content: nextStepResponse.content }
        ];
        
        // Switch executes the planned action with tools (using clean worker memory)
        const response = await this.props.ai.chatWithTools(workerMemory);
        console.log(`[${this.props.dna.id}]: ${response.content}`);
 
         // Add Switch's action result to memory (cleaned)
        this.props.memory.push({
          role: 'assistant',
          content: response.content,
        });

        // Track in execution
        execution.messages.push({
          role: 'assistant',
          content: `Planning: ${nextStepResponse.content}`
        }, {
          role: 'assistant',
          content: response.content
        });

        // STEP 3: Analyze result
        //const analysisResult = await this.analyzeResult(switchMemory, response.content);

    const lastEvent = this.getLastEvent();
    

    const analysisPrompt = this.renderTemplate('resultAnalysis', {
      iteration: execution.iterations,
      maxIterations: this.props.maxIterations,
      systemEvents: lastEvent || 'No new events',
    });
  
      this.props.memory.push({
        role: 'user',
        content: analysisPrompt
      });

      const messages = this.props.memory.getMessages();

       const analysis = await this.props.ai.chat(messages);

       // Remove analysis request from memory
       this.props.memory.pop();

       const result = analysis.content.toLowerCase().trim();
       const analysisResult =  result.includes('completed') || result.includes('failed') ? 'completed' : 'next_task';


        console.log(`🔍 [${this.props.dna.id}] Analysis: ${analysisResult}`);
        
        if (result.includes('completed')) {
          execution.completed = true;
          console.log(`✅ [${this.props.dna.id}] Mission accomplished in ${execution.iterations} iterations`);
          break;
        }

        if (result.includes('failed')) {
          execution.completed = true;
          console.log(`❌ [${this.props.dna.id}] Mission failed in ${execution.iterations} iterations`);
          break;
        }

        // If not completed, continue with next step
      }

      // STEP 4: Exit call - final report
      if (execution.completed) {
        console.log('[Switch] Generating final report...');
        const finalReport = await this.generateFinalReport(this.props.memory.getMessages());
        execution.result = finalReport;
        console.log(`[${this.props.dna.id}] Final report: ${finalReport}`);
      }

    } catch (error: unknown) {

      console.error(`❌ [${this.props.dna.id}] Execution error:`, error);
      this.props.memory.push({
        role: 'user',
        content: `Error occurred: ${error instanceof Error ? error.message : String(error)}. ${this.props.identity.errorRecovery.fallbackStrategy}`
      });
    }

    if (!execution.completed) {
      console.log(`⏰ [${this.props.dna.id}] Mission timeout after ${this.props.maxIterations} iterations`);
    }

    return execution;
  }


  /**
   * Exit call - Smith generates final report based on message history
   */
  private async generateFinalReport(switchMemory: ChatMessage[]): Promise<string> {
  
    const conversationHistory = switchMemory.slice(1).map((msg, i) => `${i + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

    const template = this.getTemplate('finalReport');

    const finalReportPrompt = this.renderTemplate('finalReport', {
        conversationHistory: conversationHistory,     
    });

    // Use chat instead of call to avoid tool execution during final report
    const response = await this.props.ai.chat([
      { role: 'system', content: template.prompt.system },
      { role: 'user', content: finalReportPrompt }
    ]);
    return response.content;
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    const response = await this.props.ai.chat(messages);
    return response;
  }
   /**
    * Subscribe to filesystem events to maintain awareness of operations
    */
   addEvent(event: AgentEvent): void {
      // Ensure timestamp if not provided
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }
      
      this.props.eventMemory.push(event);
      
      // Keep only last 10 events to prevent memory bloat
      if (this.props.eventMemory.length > 10) {
        this.props.eventMemory = this.props.eventMemory.slice(-10);
      }
   }

    getLastEvent(): string | null {
      const lastEvent = this.props.eventMemory[this.props.eventMemory.length - 1];
      if (!lastEvent) return null;
      
      // Serialize for agent context
      return `Event: ${lastEvent.type}\nMessage: ${lastEvent.message}\nTimestamp: ${lastEvent.timestamp}`;
    }

    /**
     * Get structured events context for AI analysis
     */
    getEventsContext(): string {
      if (this.props.eventMemory.length === 0) {
        return "No events detected.";
      }
      
      // Return recent events as structured JSON
      const recentEvents = this.props.eventMemory.slice(-5); // Last 5 events
      return JSON.stringify(recentEvents, null, 2);
    }

    /**
     * Check if there are recent error events
     */
    hasRecentErrors(): boolean {
      return this.props.eventMemory.some(event => 
        event.type.includes('error') || event.message.toLowerCase().includes('error')
      );
    }

  // =============================================================================
  // TEMPLATE SYSTEM (Template-driven prompts)
  // =============================================================================

  /**
   * Render template with variables (do one thing well)
   */
  private renderTemplate(templateName: Templates, variables: TemplateVariables): string {
    if (!this.props.templateInstructions?.templates?.[templateName]) {
      throw new Error(`Template '${templateName}' not found in template instructions`);
    }

    const template = this.getTemplate(templateName);
    const rendered =  SimpleTemplateEngine.render(template.prompt, variables);

    return rendered;
    

  }

  private getTemplate(templateName: Templates): AgentTemplate {
    const template = this.props.templateInstructions.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found in template instructions`);
    }
    return template;
  }


  /**
   * Get memory items as ChatMessages for AI consumption
   */
  getMemory(): Memory {
    return this.props.memory;
  }


  /**
   * Smith learns tools from other units but doesn't teach (like @synet/ai)
   */
  learn(contracts: TeachingContract[]): void {
    for (const contract of contracts) {

      // Learn capabilities and schemas
      this._unit.capabilities.learn([contract]);
      this._unit.schema.learn([contract]);
      this._unit.validator.learn([contract]);
    }
  }
  
  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  /**
   * Smith's identity
   */
  whoami(): string {
    const tools = this.capabilities().list().length;
    return `🕶️  ${this.props.identity.name} - ${this.props.identity.description} (${tools} tools available)`;
  }

  /**
   * Smith's help documentation
   */
  help(): string {
    return `
${this.props.identity.name} - AI Agent - Mission Orchestrator

IDENTITY: ${this.props.identity.description}

USAGE:
  const switch = Switch.create({ ai });
  switch.learn([fs.teach(), weather.teach()]);

  const result = await switch.run("Get weather and save report");

METHODS:
  • run(task) - Execute a mission using worker AI orchestration
  • learn(contracts) - Learn tools and schemas from other units
  • whoami() - Show Switch's identity

 LEARNED TOOLS: ${this.capabilities().list().join(', ') || 'None'}

    `;
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

}
