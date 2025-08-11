/**
 * Generic Agent Template System
 * Type definitions for AI-FS safety demonstration
 * Extracted from Smith v1.0.1 architecture
 */

export interface AgentTemplate {
  description: string;
  variables: string[];
  prompt: string;
}

export interface TemplateVariables {
  // Core mission variables
  task?: string;
  availableTools?: string;
  promptTemplate?: string;
  
  // Filesystem awareness variables
  filesystemContext?: string;
  hasErrors?: boolean;
  lastError?: string;
  
  // Analysis variables
  workerResponse?: string;
  conversationHistory?: string;
}

export interface AgentInstructions {
  name: string;
  description: string;
  version: string;
  author?: string;
  github?: string;
  templates: {
    taskBreakdown: AgentTemplate;
    workerPromptGeneration: AgentTemplate;
    resultAnalysis: AgentTemplate;
    finalReport: AgentTemplate;
    progressAnalysis: AgentTemplate;
  };
  templateSystem: {
    description: string;
    syntax: {
      variables: string;
      conditionals: string;
      comments: string;
    };
    requiredVariables: Record<string, string[]>;
  };
  filesystemIntegration: FilesystemIntegration;
  safetyConstraints: SafetyConstraints;
  metadata: {
    extractedFrom: string;
    extractionDate: string;
    purpose: string;
    nextSteps: string[];
  };
}

export interface FilesystemIntegration {
  description: string;
  contextGeneration: {
    successFormat: string;
    errorFormat: string;
    summaryFormat: string;
  };
  errorDetection: {
    recentWindow: string;
    errorIndicators: string[];
  };
}

export interface SafetyConstraints {
  description: string;
  allowedOperations: string[];
  restrictedOperations: string[];
  pathConstraints: {
    allowedPaths: string[];
    restrictedPaths: string[];
  };
}

export interface TemplateContext {
  variables: TemplateVariables;
  filesystemEvents: FilesystemEvent[];
  conversationHistory: ChatMessage[];
}

export interface FilesystemEvent {
  operation: string;
  path: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenericAgentConfig {
  instructions: AgentInstructions;
  identity: {
    systemPrompt: string;
    promptTemplate: string;
    missionStrategy: string;
  };
  safetyMode: boolean;
  filesystemAwareness: boolean;
  allowedTools: string[];
}

/**
 * Template engine interface for variable replacement
 */
export interface TemplateEngine {
  render(template: string, variables: TemplateVariables): string;
  validate(template: string, requiredVariables: string[]): boolean;
  extractVariables(template: string): string[];
}

/**
 * Generic Agent capability interface
 */
export interface GenericAgent {
  // Core orchestration methods
  executeTask(task: string): Promise<string>;
  
  // Template system methods
  renderTemplate(templateName: string, variables: TemplateVariables): string;
  validateTemplate(templateName: string, variables: TemplateVariables): boolean;
  
  // Filesystem awareness methods
  getFilesystemContext(): string;
  hasRecentFilesystemErrors(): boolean;
  getLastFilesystemError(): string | null;
  
  // Safety constraint methods
  validateOperation(operation: string, path?: string): boolean;
  checkPathConstraints(path: string): boolean;
  
  // Configuration methods
  loadInstructions(instructionsPath: string): Promise<void>;
  updateSafetyConstraints(constraints: SafetyConstraints): void;
}

/**
 * Template validation result
 */
export interface ValidationResult {
  valid: boolean;
  missingVariables: string[];
  invalidSyntax: string[];
  errors: string[];
}

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  result: string;
  filesystemEvents: FilesystemEvent[];
  conversationHistory: ChatMessage[];
  errors: string[];
}
