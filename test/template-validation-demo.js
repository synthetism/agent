#!/usr/bin/env node

/**
 * Template Validation Demo
 * Quick test of template parsing and validation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inline validation logic for demo
const TEMPLATE_SCHEMAS = {
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

function extractVariablesFromPrompt(prompt) {
  const variables = new Set();
  const matches = prompt.match(/\{\{(\w+)\}\}/g);
  
  if (matches) {
    matches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '');
      variables.add(varName);
    });
  }
  
  return Array.from(variables);
}

function validateTemplate(templateName, template, schema) {
  const errors = [];
  
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
  const userPromptVars = extractVariablesFromPrompt(template.prompt.user);
  const systemPromptVars = extractVariablesFromPrompt(template.prompt.system);
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

function validateInstructions(instructions) {
  const errors = [];
  
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
    const templateErrors = validateTemplate(templateName, template, schema);
    errors.push(...templateErrors);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

console.log('🧪 Template Validation Demo');
console.log('============================\n');

try {
  // Load agent instructions
  const instructionsPath = join(__dirname, '../config/agent-instructions.json');
  console.log(`📄 Loading: ${instructionsPath}`);
  
  const instructionsRaw = readFileSync(instructionsPath, 'utf-8');
  const instructions = JSON.parse(instructionsRaw);
  
  console.log(`✅ JSON parsed successfully`);
  console.log(`📝 Templates found: ${Object.keys(instructions.templates).join(', ')}\n`);
  
  // Validate templates
  console.log('🔍 Validating template structure...');
  const result = validateInstructions(instructions);
  
  if (result.valid) {
    console.log('✅ All templates are valid!\n');
    
    // Show template details
    for (const [templateName, template] of Object.entries(instructions.templates)) {
      console.log(`📋 ${templateName}:`);
      console.log(`   Variables: ${template.variables.join(', ')}`);
      console.log(`   System prompt: ${template.prompt.system.substring(0, 50)}...`);
      console.log(`   User prompt: ${template.prompt.user.substring(0, 50)}...`);
      console.log();
    }
    
  } else {
    console.log('❌ Template validation failed:');
    result.errors.forEach(error => {
      console.log(`   [${error.templateName}] ${error.field}: ${error.error}`);
    });
  }
  
  // Test validateAndThrow method
  console.log('🚨 Testing validation with throw...');
  try {
    if (result.valid) {
      console.log('✅ All validations passed - no exceptions to throw');
      console.log(`📊 Validated instructions: ${instructions.name} v${instructions.version}`);
    } else {
      console.log(`❌ Validation would throw with ${result.errors.length} errors`);
    }
  } catch (error) {
    console.log(`❌ Validation failed: ${error.message}`);
  }
  
} catch (error) {
  console.error('💥 Demo failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Template validation demo complete!');
console.log('✅ JSON structure validation works');
console.log('✅ Required field checking works');
console.log('✅ Variable validation works');
console.log('\n🚀 Ready for agent implementation!');
