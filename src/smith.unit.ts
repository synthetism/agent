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
}

interface SmithProps extends UnitProps {
  ai: AIOperator;
  identity: SmithIdentity;
  maxIterations: number;
  learnedTools: string[];
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

    const props: SmithProps = {
      dna: createUnitSchema({
        id: 'smith',
        version: VERSION
      }),
      ai: config.ai,
      identity,
      maxIterations: config.maxIterations || 10,
      learnedTools: []
    };

    return new Smith(props);
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
      { role: 'system', content: 'You are an AI worker collaborating on a mission. You have access to tools and can see the history of our work together.' }
    ];

    try {
      // STEP 1: Entry call - get task breakdown
      console.log(`📋 [Smith] Breaking down mission into steps...`);
      const taskBreakdown = await this.getTaskBreakdown(task);
      console.log(`📝 [Smith] Task breakdown:\n${taskBreakdown}`);
      
      smithMemory.push({
        role: 'user',
        content: `MISSION: ${task}`
      }, {
        role: 'assistant', 
        content: taskBreakdown
      });

      // STEP 2: Execute steps individually
      while (!execution.completed && execution.iterations < this.props.maxIterations) {
        execution.iterations++;
        console.log(`🔄 [Smith] Iteration ${execution.iterations}/${this.props.maxIterations}`);
        
        // Generate next specific prompt
        const workerPrompt = await this.generateNextWorkerPrompt(smithMemory, task);
        console.log(`📝 [Smith] Generated worker prompt: ${workerPrompt}`);

        // Add prompt to worker memory
        workerMemory.push({
          role: 'user',
          content: workerPrompt
        });

        // Worker AI executes with tools AND has memory of previous work
        const response = await this.props.ai.chatWithTools(workerMemory);
        console.log(`💭 [Smith] Worker AI Response: ${response.content}`);

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
    const availableTools = this.props.learnedTools.join(', ') || 'No tools available';
    
    const breakdownPrompt = `.

YOUR MISSION: ${task}
AVAILABLE TOOLS: ${availableTools}
USE TEMPLATE TO DIRECT AI WORKER: "${this.props.identity.promptTemplate}"

Break this mission down into discrete, executable steps. Each step should use ONE specific tool.

Respond with a numbered breakdown and follow your plan to accomplis the mission.`;

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
    const analysisPrompt = `Analyze the worker AI response and determine mission status.

WORKER AI RESPONSE: ${response}

Based on the response above and the conversation history, determine:
- Is the ENTIRE mission completed successfully? 
- Or should we continue with the next task?

Check for completion signals like "MISSION_COMPLETE", successful file saves, or mission objectives achieved.

Respond with ONLY one word:
- "completed" if the entire mission is finished
- "next_task" if we should continue with the next step`;

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

If you have access to tools that could enhance this report, feel free to use them.`;

    const response = await this.props.ai.call(finalReportPrompt, { useTools: true });
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
    const availableTools = this.props.learnedTools.join(', ') || 'No tools available';
    
    // Build a summary of what's been accomplished so far
    const conversationSummary = await this.buildProgressSummary(smithMemory);
    
    // Smith asks his AI to structure the prompt using the template
    const promptGenerationRequest = `
You are Agent Smith orchestrating a mission. Analyze the progress and determine the NEXT SINGLE ACTION.

ORIGINAL MISSION: ${originalTask}
AVAILABLE TOOLS: ${availableTools}

PROGRESS SO FAR:
${conversationSummary}

USE FOLLOWING PROMPT TEMPLATE:
"${this.props.identity.promptTemplate}"

INSTRUCTIONS:
1. Analyze what has been completed vs what still needs to be done
2. Identify the NEXT SINGLE TOOL that needs to be used
3. Use the template above, filling in:
   - %%task%% = the specific single task for the worker
   - %%tool%% = the exact tool to use (e.g., "weather.getCurrentWeather")  
   - %%goal%% = what the worker should achieve with this tool
   - %%context%% = CRITICAL: Include relevant data/results from previous steps that the worker needs to complete this task
4. Extract any data, reports, or information from conversation history that the worker will need
5. Make the worker feel like they're collaborating with you, not starting fresh each time

CONSTRAINTS:
- ONE tool call only
- Do NOT repeat completed actions
- Provide rich context so worker has all information needed
- Be specific about tool parameters needed

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


  private createContextualSystemPrompt(): string {
    const learnedTools = this.capabilities().list().filter(cap => !cap.startsWith('smith.'));
    
    return `
    ${this.props.systemPrompt}

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

}
