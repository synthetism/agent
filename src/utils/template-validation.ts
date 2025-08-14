/**
 * Template Validation System
 * Validates agent instruction JSON structure and required fields
 */

import { AgentInstructions, AgentTemplate } from '../types/agent.types.js';
import { TEMPLATE_SCHEMAS, ValidationError, ValidationResult } from '../schema/template.schema.js';

export class TemplateValidator {
  
  /**
   * Validate complete agent instructions JSON
   */
  static validate(instructions: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate top-level structure
    if (!instructions.name || typeof instructions.name !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'name',
        error: 'Missing or invalid name field'
      });
    }
    
    if (!instructions.description || typeof instructions.description !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'description', 
        error: 'Missing or invalid description field'
      });
    }
    
    if (!instructions.version || typeof instructions.version !== 'string') {
      errors.push({
        templateName: 'root',
        field: 'version',
        error: 'Missing or invalid version field'
      });
    }
    
    if (!instructions.templates || typeof instructions.templates !== 'object') {
      errors.push({
        templateName: 'root',
        field: 'templates',
        error: 'Missing or invalid templates object'
      });
      return { valid: false, errors };
    }
    
    // Validate each required template
    for (const [templateName, schema] of Object.entries(TEMPLATE_SCHEMAS)) {
      const template = instructions.templates[templateName];
      
      if (!template) {
        errors.push({
          templateName,
          field: 'template',
          error: `Missing template: ${templateName}`
        });
        continue;
      }
      
      // Validate template structure
      const templateErrors = this.validateTemplate(templateName, template, schema);
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
  private static validateTemplate(templateName: string, template: any, schema: any): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Validate prompt object exists
    if (!template.prompt || typeof template.prompt !== 'object') {
      errors.push({
        templateName,
        field: 'prompt',
        error: 'Missing or invalid prompt object'
      });
      return errors;
    }
    
    // Validate required prompt fields (user, system)
    for (const field of schema.requiredPromptFields) {
      if (!template.prompt[field] || typeof template.prompt[field] !== 'string') {
        errors.push({
          templateName,
          field: `prompt.${field}`,
          error: `Missing or invalid prompt.${field} field`
        });
      }
    }
    
    // Validate variables array exists
    if (!Array.isArray(template.variables)) {
      errors.push({
        templateName,
        field: 'variables',
        error: 'Missing or invalid variables array'
      });
      return errors;
    }
    
    // Validate required variables are present
    for (const requiredVar of schema.requiredVariables) {
      if (!template.variables.includes(requiredVar)) {
        errors.push({
          templateName,
          field: 'variables',
          error: `Missing required variable: ${requiredVar}`
        });
      }
    }
    
    // Validate that all variables in template are declared
    const userPromptVars = this.extractVariablesFromPrompt(template.prompt.user);
    const systemPromptVars = this.extractVariablesFromPrompt(template.prompt.system);
    const allPromptVars = [...userPromptVars, ...systemPromptVars];
    
    for (const promptVar of allPromptVars) {
      if (!template.variables.includes(promptVar)) {
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
      matches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  }
  
  /**
   * Validate and throw if invalid
   */
  static validateAndThrow(instructions: any): AgentInstructions {
    const result = this.validate(instructions);
    
    if (!result.valid) {
      const errorMessages = result.errors.map(err => 
        `[${err.templateName}] ${err.field}: ${err.error}`
      ).join('\n');
      
      throw new Error(`Template validation failed:\n${errorMessages}`);
    }
    
    return instructions as AgentInstructions;
  }

  nonstatic() {


  }
  
}
