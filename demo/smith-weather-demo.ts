/**
 * Agent Smith Weather Demo - Real Tool Orchestration
 * 
 * Tests Smith's ability to:
 * - Learn weather tools
 * - Generate prompts for AI to use weather tools
 * - Orchestrate multi-step weather analysis
 * - Save results to file
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AIOperator } from '@synet/ai';
import { Smith } from '../src/smith.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import { NodeFileSystem, ObservableFileSystem } from '@synet/fs/promises';
import { createAIFileSystem } from '@synet/fs-ai';
import { AsyncFileSystem } from "@synet/fs";
import type { AgentInstructions} from "../src/types/agent.types.js"

async function runSmithWeatherDemo() {
  console.log('🕶️  Agent Smith Weather Demo');
  console.log('===============================\n');
  
  const provider = 'mistral';
  const model = 'mistral-large-latest';

  try {
    // Step 1: Load API keys
    console.log('🔑 Loading API keys...');
    const aiconfig = JSON.parse(
      readFileSync(path.join('private', `${provider}.json`), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    console.log('✅ API keys loaded\n');


    const templateInstructions = JSON.parse(
        readFileSync(path.join('config', 'smith-instructions.json'), 'utf-8')
      ) as AgentInstructions;
    console.log('✅ API keys and templates loaded');
    console.log(`📋 Template loaded: ${templateInstructions.name} v${templateInstructions.version}\n`);
        
    

    // Step 2: Create tools first
    console.log('🛠️  Creating tools...');
    const weather = WeatherUnit.create({
      apiKey: weatherConfig.apiKey
    });
    console.log('✅ Weather tool ready');

    // Step 3: Setup AI-safe filesystem with event monitoring (like ai-demo-fs)
    console.log('📁 Setting up AI-safe filesystem with Observable wrapper...');
    const baseFs = new NodeFileSystem();
    const aiFs = createAIFileSystem(baseFs, {
      homePath: process.cwd(), // Current directory as home
      allowedPaths: ['./'], // Allow current directory
      allowedOperations: ['readFile', 'writeFile', 'exists', 'ensureDir', 'readDir'],
      readOnly: false,
      maxDepth: 5
    });

    // Wrap with ObservableFileSystem to see events
    const observableFs = new ObservableFileSystem(aiFs);
    
    // Setup event monitoring
    const eventEmitter = observableFs.getEventEmitter();
    console.log('👁️  Setting up filesystem event monitoring...');

    eventEmitter.on('file.write', (event) => {
      const { type, data, error } = event;
      if (error) {
        console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);
        console.log(`   Path: ${data.filePath}`);
      } else {
        console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
        console.log(`   Path: ${data.filePath}, Result: ${data.result} bytes written`);
      }
    });

    // Create the AsyncFileSystem unit
    const fs = AsyncFileSystem.create({ adapter: observableFs });
    console.log('✅ FS-AI tool ready with event monitoring\n');

    // Step 4: Create AI operator and teach it tools
    console.log('🤖 Creating AI operator...');
    const ai = AIOperator.create({
        type: provider,
        options: {
          apiKey: aiconfig.apiKey,
          model: model,
        },
      });
    console.log('✅ AI operator created');
    
    console.log('🧠 Teaching AI the tools...');
    ai.learn([weather.teach(), fs.teach()]);
    console.log('✅ AI learned tools\n');

    // Step 5: Create Agent Smith with tool-trained AI
    console.log('🕶️  Creating Agent Smith...');
    const smith = Smith.create({ 
      ai, 
      maxIterations:10,
      templateInstructions
    });
    console.log('✅', smith.whoami());
    
    console.log('🧠 Teaching Smith tools (for context)...');
    smith.learn([weather.teach(), fs.teach()]);
    console.log('✅', smith.whoami());
    console.log();

    // Step 7: Smith creative beach destination mission with filesystem awareness
    console.log('�️  Executing Smith creative beach destination mission...\n');
    
    const mission = `
    
    Mission: Ultimate Beach Destination Intelligence

Task: 

You are a luxury travel intelligence analyst. Your mission is to discover and recommend the perfect beach destination for immediate travel based on current weather conditions and regional attractions.

Requirements:
1. Research weather conditions in diverse coastal locations worldwide (choose strategically from different regions/hemispheres) and find best destinations for travel for wealthy individuals.
2. Analyze current weather patterns to identify optimal beach conditions (temperature, precipitation, wind, visibility)
3. Consider seasonal factors and local attractions/activities available 
4. Generate a comprehensive travel intelligence report with your expert recommendation
5. Save the complete analysis and recommendation to 'vault/beach-destination-intelligence.md' in professional markdown format

Success Criteria:
- Weather data from multiple global coastal destinations
- Strategic analysis of optimal beach conditions
- Expert travel recommendation with reasoning
- Professional intelligence-grade report with actionable insights

Think like a luxury travel consultant with access to real-time weather intelligence. Make this recommendation count!
`;

    const result = await smith.run(mission);
    
    console.log('\n📊 Mission Summary:');
    console.log('==================');
    console.log('Goal: Ultimate Beach Destination Intelligence');
    console.log(`Completed: ${result.completed}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Messages: ${result.messages.length}`);
    
    if (result.completed) {
      console.log('✅ Smith beach destination mission successful!');
      console.log('\n🏖️ Check vault/beach-destination-intelligence.md for the luxury travel recommendation');
    } else {
      console.log('⚠️  Smith beach destination mission incomplete');
    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo
runSmithWeatherDemo().catch(console.error);
