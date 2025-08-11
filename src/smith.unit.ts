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

import { Unit, createUnitSchema, UnitProps } from '@synet/unit';
import { Capabilities, Schema, Validator, UnitCore } from '@synet/unit';
import { Capabilities as CapabilitiesClass, Schema as SchemaClass, Validator as ValidatorClass } from '@synet/unit';
import type { AIResponse, ChatMessage } from '@synet/ai';
import { AIOperator } from '@synet/ai';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AgentInstructions } from "./types/agent.types"

// Simple template types for Smith
interface TemplateVariables {
  task?: string;
  availableTools?: string;
  promptTemplate?: string;
}


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
}

const VERSION = '1.0.0';

// =============================================================================
// TYPES
// =============================================================================

interface SmithIdentity {
  name: string;
  description: string;
  objective: string;
  promptTemplate: string;
  systemPrompt: string;
  workerPrompt: string;
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

interface SmithConfig {
  ai: AIOperator;
  identityPath?: string;
  maxIterations?: number;
  templateInstructions: AgentInstructions; // Parsed template object, not file path
}

interface SmithProps extends UnitProps {
  ai: AIOperator;
  identity: SmithIdentity;
  maxIterations: number;
  learnedTools: string[];
  fsEventMemory: string[]; // Store filesystem events for awareness
  templateInstructions: AgentInstructions; // Parsed template object
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

  static create(config: SmithConfig): Smith {
    // Load Smith's identity configuration
    const identityPath = config.identityPath || path.join(__dirname, '..', 'config', 'smith.json');
    const identity: SmithIdentity = JSON.parse(readFileSync(identityPath, 'utf-8'));

    // No file parsing here - template instructions come pre-parsed from outside
    const props: SmithProps = {
      dna: createUnitSchema({
        id: 'smith',
        version: VERSION
      }),
      ai: config.ai,
      identity,
      maxIterations: config.maxIterations || 10,
      learnedTools: [],
      fsEventMemory: [], // Initialize filesystem event memory
      templateInstructions: config.templateInstructions // Pre-parsed object
    };

    return new Smith(props);
  }

  // =============================================================================
  // FILESYSTEM EVENT AWARENESS
  // =============================================================================

  /**
   * Subscribe to filesystem events to maintain awareness of operations
   */
  subscribeToFileSystemEvents(eventEmitter: any): void {
    console.log(`🕶️  [${this.dna.id}] Subscribing to filesystem events for operational awareness...`);
    
    // Subscribe to file write events
    eventEmitter.subscribe('file.write', {
      update: (event: any) => {
        const { type, data } = event;
        const eventLog = data.error 
          ? `❌ FS-ERROR: ${data.operation} failed on ${data.filePath} - ${data.error.message}`
          : `✅ FS-SUCCESS: ${data.operation} completed on ${data.filePath} (${data.result} bytes)`;
        
        // Add to Smith's filesystem event memory
        this.props.fsEventMemory.push(eventLog);
        
        // Keep only last 10 events to avoid memory bloat
        if (this.props.fsEventMemory.length > 10) {
          this.props.fsEventMemory = this.props.fsEventMemory.slice(-10);
        }
        
        console.log(`🧠 [${this.dna.id}] Filesystem Event Recorded: ${eventLog}`);
      }
    });

    // Subscribe to other filesystem events if needed
    eventEmitter.subscribe('file.read', {
      update: (event: any) => {
        const { type, data } = event;
        const eventLog = data.error 
          ? `❌ FS-ERROR: read failed on ${data.filePath} - ${data.error.message}`
          : `📖 FS-READ: successfully read ${data.filePath}`;
        
        this.props.fsEventMemory.push(eventLog);
        if (this.props.fsEventMemory.length > 10) {
          this.props.fsEventMemory = this.props.fsEventMemory.slice(-10);
        }
      }
    });
  }

  /**
   * Get current filesystem event context for worker prompts
   */
  getFileSystemContext(): string {
    if (this.props.fsEventMemory.length === 0) {
      return "No filesystem operations detected yet.";
    }
    
    return `Recent filesystem operations:\n${this.props.fsEventMemory.join('\n')}`;
  }

  /**
   * Check for recent filesystem errors that need immediate attention
   */
  hasRecentFileSystemErrors(): boolean {
    return this.props.fsEventMemory.some(event => event.includes('❌ FS-ERROR'));
  }

  /**
   * Get the most recent filesystem error for analysis
   */
  getLastFileSystemError(): string | null {
    for (let i = this.props.fsEventMemory.length - 1; i >= 0; i--) {
      if (this.props.fsEventMemory[i].includes('❌ FS-ERROR')) {
        return this.props.fsEventMemory[i];
      }
    }
    return null;
  }

  // =============================================================================
  // TEMPLATE SYSTEM (Template-driven prompts)
  // =============================================================================

  /**
   * Render template with variables (do one thing well)
   */
  private renderTemplate(templateName: 'taskBreakdown' | 'workerPromptGeneration', variables: TemplateVariables): string {
    if (!this.props.templateInstructions?.templates?.[templateName]) {
      throw new Error(`Template '${templateName}' not found in template instructions`);
    }
    
    const template = this.props.templateInstructions.templates[templateName];
    return SimpleTemplateEngine.render(template.prompt, variables);
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
  async executeMission(task: string): Promise<SmithExecution> {
    console.log(`🕶️  [${this.props.identity.name}] Mission received: ${task}`);
    
    const execution: SmithExecution = {
      goal: task,
      messages: [],
      completed: false,
      iterations: 0
    };

    // Smith's memory for the full conversation
    const smithMemory: ChatMessage[] = [
      { role: 'system', content: this.props.identity.systemPrompt }
    ];

    // Worker's memory for collaborative work within mission
    const workerMemory: ChatMessage[] = [
      { role: 'system', content: this.props.identity.workerPrompt }
    ];

    try {
      // STEP 1: Entry call - get task breakdown
      console.log(`[Smith] Breaking down mission into steps...`);
      const taskBreakdown = await this.getTaskBreakdown(task);
      console.log(`[Smith] Task breakdown:\n${taskBreakdown}`);
      
      smithMemory.push({
        role: 'user',
        content: task
      }, {
        role: 'assistant', 
        content: taskBreakdown
      });

      // STEP 2: Execute steps individually
      while (!execution.completed && execution.iterations < this.props.maxIterations) {
        execution.iterations++;
        console.log(`[Smith] Iteration ${execution.iterations}/${this.props.maxIterations}`);
        
        // Generate next specific prompt using template and full memory context
        const promptTemplate = this.renderTemplate('workerPromptGeneration', {
                promptTemplate: this.props.identity.promptTemplate
        })
           
        // Add the prompt generation request to Smith's memory
        smithMemory.push({
          role: 'user',
          content: promptTemplate
        });

        // Smith uses his AI with full memory context to generate the prompt
        const promptResponse = await this.props.ai.chat(smithMemory);
        const workerPrompt = promptResponse.content;
        
        // Remove the prompt generation request from memory (Smith's internal thinking)
        smithMemory.pop();
        
        console.log(`[Smith] Generated worker prompt: ${workerPrompt}`);
        
        // Add prompt to worker memory
        workerMemory.push({
          role: 'user',
          content: workerPrompt
        });

        // Worker AI executes with tools AND has memory of previous work
        const response = await this.props.ai.chatWithTools(workerMemory);
        console.log(`[Worker]: ${response.content}`);

        // Add response to worker memory
        workerMemory.push({
          role: 'assistant',
          content: response.content
        });

        // Add to memory
        smithMemory.push({
          role: 'user',
          content: workerPrompt
        }, {
          role: 'assistant',
          content: response.content
        });

        // Track in execution
        execution.messages.push({
          role: 'user',
          content: workerPrompt
        }, {
          role: 'assistant',
          content: response.content
        });

        // STEP 3: Analyze result
        const analysisResult = await this.analyzeResult(smithMemory, response.content);
        console.log(`🔍 [Smith] Analysis: ${analysisResult}`);
        
        if (analysisResult === 'completed') {
          execution.completed = true;
          console.log(`✅ [Smith] Mission accomplished in ${execution.iterations} iterations`);
          break;
        }
        // If not completed, continue with next step
      }

      // STEP 4: Exit call - final report
      if (execution.completed) {
        console.log(`📊 [Smith] Generating final report...`);
        const finalReport = await this.generateFinalReport(smithMemory);
        execution.result = finalReport;
        console.log(`📋 [Smith] Final report: ${finalReport}`);
      }

    } catch (error: any) {
      console.error(`❌ [Smith] Execution error:`, error);
      smithMemory.push({
        role: 'user',
        content: `Error occurred: ${error?.message || error}. ${this.props.identity.errorRecovery.fallbackStrategy}`
      });
    }

    if (!execution.completed) {
      console.log(`⏰ [Smith] Mission timeout after ${this.props.maxIterations} iterations`);
    }

    return execution;
  }

  /**
   * Entry call - Smith breaks down mission into discrete steps
   */
  private async getTaskBreakdown(task: string): Promise<string> {
    // Use template if available, otherwise fallback to hardcoded method
    if (this.props.templateInstructions?.templates?.taskBreakdown) {
      console.log('🎯 Using template-driven task breakdown');
      
      const renderedPrompt = this.renderTemplate('taskBreakdown', {
        task,
        availableTools: this.props.learnedTools.join(', ') || 'No tools available',
      });

      const response = await this.props.ai.chat([
        { role: 'system', content: this.props.templateInstructions.templates.taskBreakdown.prompt.system },
        { role: 'user', content: renderedPrompt }
      ]);

      return response.content;
    }

    // Fallback to original hardcoded method
    console.log('📝 Using hardcoded task breakdown (fallback)');
    const availableTools = this.props.learnedTools.join(', ') || 'No tools available';
    
    const breakdownPrompt = `YOUR MISSION: ${task}
AVAILABLE TOOLS (ALL AVAILABLE TO WORKERS): ${availableTools}
USE PROMPT INSTRUCTIONS TO DIRECT AI WORKER: "${this.props.identity.promptTemplate}"
FORMAT: Use plain text prompts, don't use markdown, unless required by the task. 

Break this mission down into discrete, executable steps. Each step should use ONE specific tool. Use only tools that are listed. 

Respond with a numbered breakdown and follow your plan to accomplish the mission.`;

    const response = await this.props.ai.chat([
      { role: 'system', content: this.props.identity.systemPrompt },
      { role: 'user', content: breakdownPrompt }
    ]);

    return response.content;
  }

  /**
   * Analyze result - determine if step completed or next task needed
   */
  private async analyzeResult(smithMemory: ChatMessage[], response: string): Promise<'completed' | 'next_task'> {
    // Check for filesystem errors first
    const fsContext = this.getFileSystemContext();
    const hasErrors = this.hasRecentFileSystemErrors();
    const lastError = this.getLastFileSystemError();
    
    const analysisPrompt = `Analyze the worker AI response and determine mission status.

WORKER AI RESPONSE: ${response}

FILESYSTEM OPERATIONS STATUS:
${fsContext}

${hasErrors ? `⚠️ CRITICAL: Recent filesystem error detected: ${lastError}` : ''}

Based on the response above and the conversation history, determine:
- Is the ENTIRE mission completed successfully? 
- Or should we continue with the next task?
- Are there any filesystem operation failures that need to be addressed?

${hasErrors ? 'NOTE: If there are filesystem errors, the mission is NOT completed regardless of what the worker claims.' : ''}

Check for completion signals like "MISSION_COMPLETE", successful file saves, or mission objectives achieved.
IMPORTANT: Verify actual filesystem operation success, not just worker claims.

Respond with ONLY one word:
- "completed" if the entire mission is finished AND no filesystem errors exist
- "next_task" if we should continue with the next step OR if filesystem errors need fixing`;

    smithMemory.push({
      role: 'user',
      content: analysisPrompt
    });

    const analysis = await this.props.ai.chat(smithMemory);

    // Remove analysis request from memory
    smithMemory.pop();
    
    const result = analysis.content.toLowerCase().trim();
    return result.includes('completed') ? 'completed' : 'next_task';
  }

  /**
   * Exit call - Smith generates final report based on message history
   */
  private async generateFinalReport(smithMemory: ChatMessage[]): Promise<string> {
    const finalReportPrompt = `Mission completed! Generate a final summary report.

CONVERSATION HISTORY:
${smithMemory.slice(1).map((msg, i) => `${i + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Based on the conversation history above, create a concise mission summary:

MISSION SUMMARY:
- Original Goal: [extract from history]
- Steps Completed: [list key accomplishments]
- Final Result: [what was achieved]
- Status: Mission Complete

Generate ONLY a text summary report. Do not use any tools during this final report generation.`;

    // Use chat instead of call to avoid tool execution during final report
    const response = await this.props.ai.chat([
      { role: 'system', content: 'You are generating a final mission summary report. Do not use tools.' },
      { role: 'user', content: finalReportPrompt }
    ]);
    return response.content;
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    const response = await this.props.ai.chat(messages);
    return response;
  }

  /**
   * Smith asks his AI to generate the next prompt for the worker AI
   * Using promptTemplate as foundation with AI filling in the details
   */
  private async generateNextWorkerPrompt(smithMemory: ChatMessage[], originalTask: string): Promise<string> {
  
    // Get current filesystem event context
    //const fsContext = this.getFileSystemContext();
    
    // Smith asks his AI to structure the prompt using the template
    const promptGenerationRequest = `
Your goal is to generate the next prompt for your AI assistant. 

Use following prompt as a guidance:
"${this.props.identity.promptTemplate}"


INSTRUCTIONS:
1. Analyze what has been completed vs what still needs to be done
2. You will receive events related to filesystem operations, in case of failure, instruct assistant to correct the arguments.
3. Identify the NEXT SINGLE TOOL that needs to be used
4. Use the template above, filling in:
   - %%task%% = the specific single task for the worker
   - %%tool%% = the exact tool to use (e.g., "weather.getCurrentWeather")  
   - %%goal%% = what the worker should achieve with this tool
   - %%context%% = include filesystem operation context if relevant
 
CONSTRAINTS:
- ONE tool call only. Some tools can be executed concurrently if instructed, but default in sequential.
- Do NOT repeat completed actions (check filesystem events for success/failures)
- Provide context so worker follows the workflow, including any filesystem operation results
- Be specific about tool parameters needed and provide instructions.
- Use only tools from the list provided.
- If filesystem errors occurred, address them in the next task

Generate the worker prompt using the template format with ALL variables filled in.
`;

    smithMemory.push({
      role: 'user',
      content: promptGenerationRequest
    });

    // Smith uses his AI to generate the prompt
    const promptResponse = await this.props.ai.chat(smithMemory);
    
    // Remove the prompt generation request from memory (Smith's internal thinking)
    smithMemory.pop();
    
    return promptResponse.content;
  }

  /**
   * Build a summary of what has been accomplished so far
   * Smith analyzes conversation history to determine progress
   */
  private async buildProgressSummary(smithMemory: ChatMessage[]): Promise<string> {
    if (smithMemory.length <= 1) {
      return "No progress yet - mission just started.";
    }

    const progressAnalysisPrompt = `Analyze the conversation history and summarize what has been accomplished so far.

CONVERSATION HISTORY:
${smithMemory.slice(1).map((msg, i) => `${i + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

Provide a concise summary of:
1. What actions have been completed successfully
2. What data/results have been gathered  
3. What still needs to be done

Focus on concrete accomplishments and avoid repeating the same information.`;

    const response = await this.props.ai.chat([
      { role: 'system', content: 'You are Agent Smith analyzing mission progress.' },
      { role: 'user', content: progressAnalysisPrompt }
    ]);

    return response.content;
  }


  /**
   * Generate initial worker prompt using identity template (first iteration only)
   */
  private generateWorkerPrompt(task: string): string {
    const availableTools = this.props.learnedTools.join(', ') || 'No tools available';
    
    return `${this.props.identity.description}

OBJECTIVE: ${this.props.identity.objective}

MISSION: ${task}

AVAILABLE TOOLS: ${availableTools}

INSTRUCTIONS:
${this.props.identity.missionStrategy.analysis}
${this.props.identity.missionStrategy.toolSelection}
Execute step by step and end with one of: ${this.props.identity.completionSignals.join(', ')}`;
  }

  /**
   * Generate next prompt based on previous response (deprecated - use generateNextWorkerPrompt)
   */
  private generateNextPrompt(previousResponse: string, originalTask: string): string {
    // Simple continuation for now - can be made more sophisticated
    return 'Continue with next step of the mission.';
  }

  // =============================================================================
  // DECISION LOGIC
  // =============================================================================

  /**
   * Detect if goal is complete using identity completion signals
   */
  private isGoalComplete(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    return this.props.identity.completionSignals.some(signal => 
      lowerResponse.includes(signal.toLowerCase())
    );
  }

  // =============================================================================
  // TOOL LEARNING (No Teaching - Smith is pure orchestrator)
  // =============================================================================

  /**
   * Smith learns tools from other units but doesn't teach (like @synet/ai)
   */
  learn(contracts: Array<{ unitId: string; capabilities: Capabilities; schema: Schema; validator: Validator }>): void {
    for (const contract of contracts) {
      // Extract tool names from capabilities
      const toolNames = contract.capabilities.list().map(cap => `${contract.unitId}.${cap}`);
      this.props.learnedTools.push(...toolNames);
      console.log(`🧠 [${this.props.identity.name}] Learned ${toolNames.length} tools from ${contract.unitId}: ${toolNames.join(', ')}`);
    }
  }

  
  // =============================================================================
  // UNIT ARCHITECTURE METHODS
  // =============================================================================

  /**
   * Smith's identity
   */
  whoami(): string {
    const tools = this.props.learnedTools.length;
    return `🕶️  ${this.props.identity.name} - ${this.props.identity.description} (${tools} tools available)`;
  }

  /**
   * Smith's help documentation
   */
  help(): string {
    return `
${this.props.identity.name} - AI Mission Orchestrator

IDENTITY: ${this.props.identity.description}
OBJECTIVE: ${this.props.identity.objective}

USAGE:
  const smith = Smith.create({ ai });
  smith.learn([fs.teach(), weather.teach()]);
  
  const result = await smith.executeMission("Get weather and save report");

METHODS:
  • executeMission(task) - Execute a mission using worker AI orchestration
  • learn(contracts) - Learn tools from other units  
  • whoami() - Show Smith's identity

LEARNED TOOLS: ${this.props.learnedTools.join(', ') || 'None'}

COMPLETION SIGNALS: ${this.props.identity.completionSignals.join(', ')}
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
