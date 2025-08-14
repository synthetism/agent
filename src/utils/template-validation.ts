/**
 * Template Validation System
 * Validates agent instruction JSON structure and required fields
 */

import { type AgentInstructions, AgentTemplate } from '../types/agent.types.js';
import { TEMPLATE_SCHEMAS, type TemplateSchema, type ValidationError, type ValidationResult } from '../schema/template.schema.js';

export class TemplateValidator {
  
  /**
   * Validate complete agent instructions JSON
   */
  static validate(instructions: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Type guard for instructions object
    if (!instructions || typeof instructions !== 'object') {
      errors.push({
        templateName: 'root',
        field: 'instructions',
        error: 'Instructions must be an object'
      });
      return { valid: false, errors };
    }
    
    const inst = instructions as Record<string, unknown>;
    
    // Validate top-level structure
    if (!inst.name || typeof inst.name !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'name',
        error: 'Missing or invalid name field'
      });
    }
    
    if (!inst.description || typeof inst.description !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'description', 
        error: 'Missing or invalid description field'
      });
    }
    
    if (!inst.version || typeof inst.version !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'version',
        error: 'Missing or invalid version field'
      });
    }
    
    if (!inst.templates || typeof inst.templates !== 'object') {
      errors.push({
        templateName: 'root',
        field: 'templates',
        error: 'Missing or invalid templates object'
      });
      return { valid: false, errors };
    }
    
    const templates = inst.templates as Record<string, unknown>;
    
    // Validate each required template
    for (const [templateName, schema] of Object.entries(TEMPLATE_SCHEMAS)) {
      const template = templates[templateName];
      
      if (!template) {
        errors.push({
          templateName,
          field: 'template',
          error: `Missing template: ${templateName}`
        });
        continue;
      }
      
      // Validate template structure
      const templateErrors = TemplateValidator.validateTemplate(templateName, template, schema);
      errors.push(...templateErrors);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate individual template structure
   */
  private static validateTemplate(templateName: string, template: unknown, schema: TemplateSchema): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Type guard for template object
    if (!template || typeof template !== 'object') {
      errors.push({
        templateName,
        field: 'template',
        error: 'Template must be an object'
      });
      return errors;
    }
    
    const temp = template as Record<string, unknown>;
    
    // Validate prompt object exists
    if (!temp.prompt || typeof temp.prompt !== 'object') {
      errors.push({
        templateName,
        field: 'prompt',
        error: 'Missing or invalid prompt object'
      });
      return errors;
    }
    
    const prompt = temp.prompt as Record<string, unknown>;
    
    // Validate required prompt fields (user, system)
    for (const field of schema.requiredPromptFields) {
      if (!prompt[field] || typeof prompt[field] !== 'string') {
        errors.push({
          templateName,
          field: `prompt.${field}`,
          error: `Missing or invalid prompt.${field} field`
        });
      }
    }
    
    // Validate variables array exists
    if (!Array.isArray(temp.variables)) {
      errors.push({
        templateName,
        field: 'variables',
        error: 'Missing or invalid variables array'
      });
      return errors;
    }
    
    const variables = temp.variables as string[];
    
    // Validate required variables are present
    for (const requiredVar of schema.requiredVariables) {
      if (!variables.includes(requiredVar)) {
        errors.push({
          templateName,
          field: 'variables',
          error: `Missing required variable: ${requiredVar}`
        });
      }
    }
    
    // Validate that all variables in template are declared
    const userPromptVars = TemplateValidator.extractVariablesFromPrompt(prompt.user as string);
    const systemPromptVars = TemplateValidator.extractVariablesFromPrompt(prompt.system as string);
    const allPromptVars = [...userPromptVars, ...systemPromptVars];
    
    for (const promptVar of allPromptVars) {
      if (!variables.includes(promptVar)) {
        errors.push({
          templateName,
          field: 'variables',
          error: `Variable '${promptVar}' used in prompt but not declared in variables array`
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Extract variable names from prompt text
   */
  private static extractVariablesFromPrompt(prompt: string): string[] {
    const variables = new Set<string>();
    const matches = prompt.match(/\{\{(\w+)\}\}/g);
    
    if (matches) {
      for (const match of matches) {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      }
    }
    
    return Array.from(variables);
  }
  
  /**
   * Validate and throw if invalid
   */
  static validateAndThrow(instructions: unknown): AgentInstructions {
    const result = TemplateValidator.validate(instructions);
    
    if (!result.valid) {
      const errorMessages = result.errors.map(err => 
        `[${err.templateName}] ${err.field}: ${err.error}`
      ).join('\n');
      
      throw new Error(`Template validation failed:\n${errorMessages}`);
    }
    
    return instructions as AgentInstructions;
  }

}
