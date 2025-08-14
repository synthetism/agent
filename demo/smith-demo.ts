/**
 * Agent Smith Demo - Simple Mission Execution
 * 
 * Tests Smith's ability to:
 * - Execute goals using AI chat workflow
 * - Basic mission completion detection
 * - AI-driven workflow management
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AI } from '@synet/ai';
import { Smith } from '../src/smith.unit.js';
import type { AgentInstructions} from "../src/types/agent.types.js"

async function runSmithDemo() {
  console.log('🕶️  Agent Smith Demo');
  console.log('===================\n');

  try {
    // Step 1: Load API key and instructions
    console.log('🔑 Loading OpenAI API key...');
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );

    // Load instruction templates for the agent
    const templateInstructions = JSON.parse(
        readFileSync(path.join('config', 'smith-instructions.json'), 'utf-8')
      ) as AgentInstructions;
      console.log('✅ API keys and templates loaded');
     console.log(`📋 Template loaded: ${templateInstructions.name} v${templateInstructions.version}\n`);
    

    console.log('✅ API key loaded\n');

    // Step 2: Create AI operator
    console.log('Creating AI operator...');
    const ai = AI.openai({
      apiKey: openaiConfig.apiKey,
      model: 'gpt-4o-mini'
    });
    console.log('✅ AI operator ready\n');

    // Step 3: Create Agent Smith
    console.log('Creating Agent Smith...');
    const smith = Smith.create({ ai, templateInstructions });
    console.log('✅', smith.whoami());
    console.log();

    // Step 4: Give Smith a simple mission (no tools for now)
    console.log('Executing Smith mission...\n');
    
    const mission = `Mission: Analyze current date and provide intelligence briefing.

Task: Create a brief intelligence report about today's date (August 10, 2025):
- What day of the week is it?
- What season is it in the Northern Hemisphere?
- Any historical significance of this date?
- Brief weather expectations for summer

Format as a structured report and end with "MISSION_COMPLETE"`;

    const result = await smith.run(mission);
    
    console.log('\nMission Summary:');
    console.log('==================');
    console.log(`Goal: ${result.goal}`);
    console.log(`Completed: ${result.completed}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Messages: ${result.messages.length}`);
    
    if (result.completed) {
      console.log('✅ Smith mission successful!');
    } else {
      console.log('⚠️  Smith mission incomplete');
    }

    // Step 5: Test direct chat
    console.log('\n💬 Testing direct Smith chat...');
    const chatResponse = await smith.chat([
      { role: 'user', content: 'What is your primary function, Agent Smith?' }
    ]);
    console.log('Smith:', chatResponse);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo
runSmithDemo().catch(console.error);
