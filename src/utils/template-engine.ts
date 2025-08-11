/**
 * Template Engine for Generic Agent
 * Handles variable replacement and validation
 * Part of AI-FS safety demonstration
 */

import { TemplateEngine, TemplateVariables, ValidationResult } from '../types/agent.types.js';

export class SimpleTemplateEngine implements TemplateEngine {
  
  /**
   * Render template with variable replacement
   * Supports {{variable}} syntax and {{#condition}}content{{/condition}}
   */
  render(template: string, variables: TemplateVariables): string {
    let rendered = template;
    
    // Replace simple variables {{variableName}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName as keyof TemplateVariables];
      return value !== undefined ? String(value) : match;
    });
    
    // Handle conditional blocks {{#condition}}content{{/condition}}
    rendered = rendered.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, condition, content) => {
      const value = variables[condition as keyof TemplateVariables];
      return value ? content : '';
    });
    
    // Remove comments {{! comment }}
    rendered = rendered.replace(/\{\{!.*?\}\}/g, '');
    
    return rendered.trim();
  }
  
  /**
   * Validate template has all required variables
   */
  validate(template: string, requiredVariables: string[]): boolean {
    const result = this.validateDetailed(template, requiredVariables);
    return result.valid;
  }
  
  /**
   * Detailed validation with error reporting
   */
  validateDetailed(template: string, requiredVariables: string[]): ValidationResult {
    const extractedVars = this.extractVariables(template);
    const missingVariables = requiredVariables.filter(req => !extractedVars.includes(req));
    
    const errors: string[] = [];
    const invalidSyntax: string[] = [];
    
    // Check for unmatched brackets
    const openBrackets = (template.match(/\{\{/g) || []).length;
    const closeBrackets = (template.match(/\}\}/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      invalidSyntax.push('Unmatched template brackets');
    }
    
    // Check for unclosed conditional blocks
    const conditionalOpens = (template.match(/\{\{#\w+\}\}/g) || []).length;
    const conditionalCloses = (template.match(/\{\{\/\w+\}\}/g) || []).length;
    
    if (conditionalOpens !== conditionalCloses) {
      invalidSyntax.push('Unclosed conditional blocks');
    }
    
    if (missingVariables.length > 0) {
      errors.push(`Missing required variables: ${missingVariables.join(', ')}`);
    }
    
    if (invalidSyntax.length > 0) {
      errors.push(`Syntax errors: ${invalidSyntax.join(', ')}`);
    }
    
    return {
      valid: missingVariables.length === 0 && invalidSyntax.length === 0,
      missingVariables,
      invalidSyntax,
      errors
    };
  }
  
  /**
   * Extract all variable names from template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract simple variables {{variableName}}
    const simpleMatches = template.match(/\{\{(\w+)\}\}/g);
    if (simpleMatches) {
      simpleMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('!')) {
          variables.add(varName);
        }
      });
    }
    
    // Extract conditional variables {{#condition}}
    const conditionalMatches = template.match(/\{\{#(\w+)\}\}/g);
    if (conditionalMatches) {
      conditionalMatches.forEach(match => {
        const varName = match.replace(/\{\{#|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  }
  
  /**
   * Create template context helper
   */
  createContext(variables: Partial<TemplateVariables>): TemplateVariables {
    return {
      task: '',
      availableTools: '',
      promptTemplate: '',
      filesystemContext: '',
      hasErrors: false,
      lastError: '',
      workerResponse: '',
      conversationHistory: '',
      ...variables
    };
  }
  
  /**
   * Format filesystem context for templates
   */
  static formatFilesystemContext(events: any[], hasErrors: boolean, lastError: string | null): string {
    if (events.length === 0) {
      return 'No recent filesystem operations.';
    }
    
    const recentEvents = events.slice(-5); // Last 5 operations
    const context = recentEvents.map(event => 
      event.success 
        ? `✅ ${event.operation} completed: ${event.path}`
        : `❌ ${event.operation} failed: ${event.path} - ${event.error}`
    ).join('\n');
    
    return `Recent operations (${events.length}):\n${context}`;
  }
  
  /**
   * Format conversation history for templates
   */
  static formatConversationHistory(messages: any[]): string {
    return messages
      .slice(1) // Skip system message
      .map((msg, i) => `${i + 1}. ${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');
  }
}
