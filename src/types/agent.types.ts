/**
 * Simple Generic Agent Types
 * Focus: Template-ba// Simple generic event
export interface AgentEvent{
  type: string;
  message: string;
  timestamp?: string;
}ent with event awareness
 * No YAGNI interfaces - just what we need for the demo
 */

export type Templates =   'taskBreakdown' | 'workerPromptGeneration' | 'resultAnalysis' | 'finalReport'

// Simple template structure

export interface AgentTemplate {
  prompt: { 
    user: string;
    system: string;
  };
  variables: string[];
}

// Simple template variables - only what we actually use
export interface TemplateVariables {
  task?: string;
  tools?: string;
  schemas?: string;
  promptTemplate?: string;
  systemEvents?: string;
  workerResponse?: string;
  conversationHistory?: string;
  iteration?: number;
  maxIterations?: number;
}

// Simple instructions structure
export interface AgentInstructions {
  name: string;
  description: string;
  version: string;
  templates: {
    taskBreakdown: AgentTemplate;
    workerPromptGeneration: AgentTemplate;
    resultAnalysis: AgentTemplate;
    finalReport: AgentTemplate;
  };
}

// Simple agent configuration
export interface AgentConfig {
  instructions: AgentInstructions;
  identity: {
    systemPrompt: string;
    promptTemplate: string;
    missionStrategy: string;
  };
  allowedTools?: string[];
}

// Simple generic event
export interface AgentEvent{
  type: string;
  message: string;
  timestamp: string;
}

// Simple agent result
export interface AgentResult {
  success: boolean;
  result: string;
  events: AgentEvent[];
  conversationHistory: ChatMessage[];
}

// Simple chat message
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
