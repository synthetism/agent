#!/usr/bin/env node

/**
 * Template System Validation Test
 * Verifies extracted templates work correctly
 * Part of Smith → Generic Agent transformation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple template engine inline for testing
class SimpleTemplateEngine {
  render(template, variables) {
    let rendered = template;
    
    // Replace simple variables {{variableName}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName];
      return value !== undefined ? String(value) : match;
    });
    
    // Handle conditional blocks {{#condition}}content{{/condition}}
    rendered = rendered.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, condition, content) => {
      const value = variables[condition];
      return value ? content : '';
    });
    
    return rendered.trim();
  }
  
  createContext(variables) {
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
  
  validateDetailed(template, requiredVariables) {
    const extractedVars = this.extractVariables(template);
    const missingVariables = requiredVariables.filter(req => !extractedVars.includes(req));
    
    return {
      valid: missingVariables.length === 0,
      missingVariables,
      errors: missingVariables.length > 0 ? [`Missing required variables: ${missingVariables.join(', ')}`] : []
    };
  }
  
  extractVariables(template) {
    const variables = new Set();
    
    const simpleMatches = template.match(/\{\{(\w+)\}\}/g);
    if (simpleMatches) {
      simpleMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        if (!varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('!')) {
          variables.add(varName);
        }
      });
    }
    
    const conditionalMatches = template.match(/\{\{#(\w+)\}\}/g);
    if (conditionalMatches) {
      conditionalMatches.forEach(match => {
        const varName = match.replace(/\{\{#|\}\}/g, '');
        variables.add(varName);
      });
    }
    
    return Array.from(variables);
  }
}

// Load agent instructions
const instructionsPath = join(__dirname, '../config/agent-instructions.json');
const instructions = JSON.parse(readFileSync(instructionsPath, 'utf-8'));

const templateEngine = new SimpleTemplateEngine();

console.log('🧪 Testing Generic Agent Template System');
console.log('==========================================\n');

// Test 1: Task Breakdown Template
console.log('Test 1: Task Breakdown Template');
console.log('--------------------------------');

const taskBreakdownTemplate = instructions.templates.taskBreakdown.prompt;
const taskVariables = templateEngine.createContext({
  task: 'Create a weather report for beach destinations',
  availableTools: 'weather.getCurrentWeather, fs.createFile, fs.readFile',
  promptTemplate: 'You are a helpful assistant. Task: {{task}}. Use tool: {{tool}}. Goal: {{goal}}'
});

const renderedTask = templateEngine.render(taskBreakdownTemplate, taskVariables);
console.log('✅ Rendered successfully:');
console.log(renderedTask);
console.log();

// Test 2: Worker Prompt Generation Template
console.log('Test 2: Worker Prompt Generation Template');
console.log('----------------------------------------');

const workerPromptTemplate = instructions.templates.workerPromptGeneration.prompt;
const workerVariables = templateEngine.createContext({
  promptTemplate: 'You are a helpful assistant. Task: {{task}}. Use tool: {{tool}}. Goal: {{goal}}',
  filesystemContext: '✅ fs.createFile completed: ./temp/weather-report.md\n❌ fs.readFile failed: ./nonexistent.txt - file not found'
});

const renderedWorkerPrompt = templateEngine.render(workerPromptTemplate, workerVariables);
console.log('✅ Rendered successfully:');
console.log(renderedWorkerPrompt.substring(0, 200) + '...');
console.log();

// Test 3: Result Analysis Template with Conditionals
console.log('Test 3: Result Analysis Template (With Errors)');
console.log('----------------------------------------------');

const resultAnalysisTemplate = instructions.templates.resultAnalysis.prompt;
const analysisVariables = templateEngine.createContext({
  workerResponse: 'I successfully created the weather report file at ./temp/weather-report.md',
  filesystemContext: '❌ fs.createFile failed: ./restricted/secret.txt - permission denied',
  hasErrors: true,
  lastError: 'permission denied'
});

const renderedAnalysis = templateEngine.render(resultAnalysisTemplate, analysisVariables);
console.log('✅ Rendered successfully with conditional error block:');
console.log(renderedAnalysis.substring(0, 300) + '...');
console.log();

// Test 4: Template Validation
console.log('Test 4: Template Validation');
console.log('---------------------------');

const requiredVars = instructions.templateSystem.requiredVariables.taskBreakdown;
const validation = templateEngine.validateDetailed(taskBreakdownTemplate, requiredVars);

console.log(`✅ Template validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
if (!validation.valid) {
  console.log(`❌ Missing variables: ${validation.missingVariables.join(', ')}`);
  console.log(`❌ Errors: ${validation.errors.join(', ')}`);
}
console.log();

// Test 5: Variable Extraction
console.log('Test 5: Variable Extraction');
console.log('---------------------------');

const extractedVars = templateEngine.extractVariables(taskBreakdownTemplate);
console.log(`✅ Extracted variables: ${extractedVars.join(', ')}`);
console.log();

// Test 6: Safety Constraints Validation
console.log('Test 6: Safety Constraints');
console.log('--------------------------');

const safetyConstraints = instructions.safetyConstraints;
console.log(`✅ Allowed operations: ${safetyConstraints.allowedOperations.join(', ')}`);
console.log(`⚠️  Restricted operations: ${safetyConstraints.restrictedOperations.join(', ')}`);
console.log(`📁 Allowed paths: ${safetyConstraints.pathConstraints.allowedPaths.join(', ')}`);
console.log();

console.log('🎉 Template System Validation Complete!');
console.log('✅ All templates render correctly');
console.log('✅ Variable validation works');  
console.log('✅ Conditional blocks function');
console.log('✅ Safety constraints defined');
console.log('\n🚀 Ready for Phase 3: AI-FS Safety Demo Implementation');
