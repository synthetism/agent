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
import { AI } from '@synet/ai';
import { Smith } from '../src/smith.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import { NodeFileSystem, ObservableFileSystem } from '@synet/fs/promises';
import { createAIFileSystem } from '@synet/fs-ai';
import { AsyncFileSystem } from "@synet/fs";

async function runSmithWeatherDemo() {
  console.log('🕶️  Agent Smith Weather Demo');
  console.log('===============================\n');

  try {
    // Step 1: Load API keys
    console.log('🔑 Loading API keys...');
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    console.log('✅ API keys loaded\n');

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
    
    eventEmitter.subscribe('file.write', {
      update: (event) => {
        const { type, data } = event;
        if (data.error) {
          console.log(`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}`);
        } else {
          console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}, Result: ${data.result} bytes written`);
        }
      }
    });

    // Create the AsyncFileSystem unit
    const fs = AsyncFileSystem.create({ adapter: observableFs });
    console.log('✅ FS-AI tool ready with event monitoring\n');

    // Step 4: Create AI operator and teach it tools
    console.log('🤖 Creating AI operator...');
    const ai = AI.openai({
      apiKey: openaiConfig.apiKey,
      model: 'gpt-4o-mini'
    });
    console.log('✅ AI operator created');
    
    console.log('🧠 Teaching AI the tools...');
    ai.learn([weather.teach(), fs.teach()]);
    console.log('✅ AI learned tools\n');

    // Step 5: Create Agent Smith with tool-trained AI
    console.log('🕶️  Creating Agent Smith...');
    const smith = Smith.create({ ai });
    console.log('✅', smith.whoami());
    
    console.log('🧠 Teaching Smith tools (for context)...');
    smith.learn([weather.teach(), fs.teach()]);
    console.log('✅', smith.whoami());
    console.log();

    // Step 7: Smith mission with tools
    console.log('🎯 Executing Smith weather mission...\n');
    
    const mission = `
    
    Mission: Weather Intelligence Report

Task: 

1. Get current weather for Tokyo, Japan
2. Get current weather for London, UK  
3. Based on collected information, create intelligence report.
4. Ask to save the report to 'vault/weather-report.md' in markdown format using tools. Prompt AI to use the file system tool.

Requirements:
- You are manager. Use only prompts to gather information from other AI Workers.
- You need to think how to implement the overall mission and prompt the AI Worker to complete tasks.
- Use context to pass collected information to the worker when the task is asked for it.
- Determine if the mission is complete  "MISSION_COMPLETE"`;

    const result = await smith.executeMission(mission);
    
    console.log('\n📊 Mission Summary:');
    console.log('==================');
    console.log(`Goal: Weather Intelligence Report`);
    console.log(`Completed: ${result.completed}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Messages: ${result.messages.length}`);
    
    if (result.completed) {
      console.log('✅ Smith weather mission successful!');
      console.log('\n📄 Check weather-report.txt for the saved report');
    } else {
      console.log('⚠️  Smith weather mission incomplete');
    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo
runSmithWeatherDemo().catch(console.error);
