/**
 * Template Validation Schema
 * Defines required fields for each template type
 */

export interface TemplateSchema {
  templateName: string;
  requiredVariables: string[];
  requiredPromptFields: string[];
}

export const TEMPLATE_SCHEMAS: Record<string, TemplateSchema> = {
  taskBreakdown: {
    templateName: 'taskBreakdown',
    requiredVariables: ['task', 'availableTools'],
    requiredPromptFields: ['user', 'system']
  },
  workerPromptGeneration: {
    templateName: 'workerPromptGeneration', 
    requiredVariables: ['promptTemplate'],
    requiredPromptFields: ['user', 'system']
  },
  resultAnalysis: {
    templateName: 'resultAnalysis',
    requiredVariables: ['response', 'events'],
    requiredPromptFields: ['user', 'system']
  },
  finalReport: {
    templateName: 'finalReport',
    requiredVariables: ['conversationHistory'],
    requiredPromptFields: ['user', 'system']
  }
};

export interface ValidationError {
  templateName: string;
  field: string;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
