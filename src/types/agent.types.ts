/**
 * Simple Generic Agent Types
 * Focus: Template-based agent with event awareness
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
  availableTools?: string;
  promptTemplate?: string;
  systemEvents?: string;
  workerResponse?: string;
  conversationHistory?: string;
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
export interface AgentEvent<T = unknown> {
  type: string;
  data: T;
  source: string;
  timestamp: Date;
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
