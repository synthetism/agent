/**
 * Simple Template Engine for Generic Agent
 * Focus: Basic variable replacement for template-based prompts
 */

import type { TemplateVariables } from '../types/agent.types.js';

export class SimpleTemplateEngine {
  
  /**
   * Render template with basic variable replacement
   * Supports {{variable}} syntax only - keep it simple
   */
  render(template: string, variables: TemplateVariables): string {
    let rendered = template;
    
    // Replace simple variables {{variableName}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName as keyof TemplateVariables];
      return value !== undefined ? String(value) : match;
    });
    
    return rendered.trim();
  }
  
  /**
   * Create context with defaults
   */
  createContext(variables: Partial<TemplateVariables>): TemplateVariables {
    return {
      task: '',
      availableTools: '',
      promptTemplate: '',
      systemEvents: '',
      workerResponse: '',
      conversationHistory: '',
      ...variables
    };
  }
  
  /**
   * Format event context for templates
   */
  static formatEventContext(events: any[]): string {
    if (events.length === 0) {
      return 'No recent events.';
    }
    
    const recentEvents = events.slice(-5); // Last 5 events
    return recentEvents.map(event => 
      `[${event.timestamp.toISOString()}] ${event.type}: ${JSON.stringify(event.data)}`
    ).join('\n');
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
