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
import { AI, AIOperator } from '@synet/ai';
import { Smith } from '../src/smith.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import { NodeFileSystem, ObservableFileSystem } from '@synet/fs/promises';
import { createAIFileSystem } from '@synet/fs-ai';
import { AsyncFileSystem } from "@synet/fs";
import { Weather, OpenWeather2 } from "@synet/weather"
import type { AgentInstructions} from "../src/types/agent.types.js"
import { Email } from "@synet/email"
import { Hasher } from "@synet/hasher"
import { Crypto } from "@synet/crypto"


async function runSmithWeatherDemo() {
  console.log('🕶️  Agent Smith Weather Demo');
  console.log('===============================\n');
  
  const provider = 'openai';
  const model = 'gpt-5-mini';

  const agent_provider = 'openai';
  const agent_model = 'gpt-5-mini';

  try {
    // Step 1: Load API keys and template instructions
    console.log('🔑 Loading API keys and templates...');
    const aiconfig = JSON.parse(
      readFileSync(path.join('private', `${provider}.json`), 'utf-8')
    );

    const agentconfig = JSON.parse(
      readFileSync(path.join('private', `${agent_provider}.json`), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    
    // Parse template instructions outside (lightweight approach)
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

    /*  const openweather  = new OpenWeather2({ 
      apiKey:weatherConfig.apiKey,
      timeout: 10000 
    });
  
    // Create weather unit
    const weather = Weather.create({
      provider:openweather,
      defaultUnits: 'metric'
    }); */

        // Enable hasher for cryptographic operations - now using Unit Architecture v1.0.8!
    const hasher = Hasher.create();

    //const crypto = Crypto.create();

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
    console.log('Setting up filesystem event monitoring...');


    eventEmitter.on('file.write', (event) => {
      const { type, data, error } = event;
      if (error) {

          smith.addEvent({
                type: type,
                message:`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`,
                timestamp: new Date().toISOString(),

          });

          console.log (`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);      
          console.log(`   Path: ${data.filePath}, `);
        } else {

           smith.addEvent({
                type: type,
                message:`🟢 [FS-EVENT] ${type} - SUCCESS `,
                timestamp: new Date().toISOString(),

          });

          console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
          console.log(`   Path: ${data.filePath}, Result: ${data.result} bytes written`);
      

        }
      });

       eventEmitter.on('file.read', (event) => {
      const { type, data, error } = event;
      if (error) {

          smith.addEvent({
                type: type,
                message:`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`,
                timestamp: new Date().toISOString(),

          });

          console.log (`🔴 [FS-EVENT] ${type} - ERROR: ${error.message}`);      
          console.log(`   Path: ${data.filePath}, `);
        } else {

           smith.addEvent({
                type: type,
                message:`🟢 [FS-EVENT] ${type} - SUCCESS `,
                timestamp: new Date().toISOString(),

          });

          console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
          console.log(`   Path: ${data.filePath}, Result: ${data.result} bytes written`);
      
        }
      });

      eventEmitter.on('file.ensureDir', (event) => {
        const { type, data, error } = event;
        if (error) {

          smith.addEvent({
                type: type,
                message:`🔴 [${type}] - ERROR: ${error.message}`,
                timestamp: new Date().toISOString(),

          });
          console.log (`🔴 [${type}] - ERROR: ${error.message}`);
          console.log(`   Path: ${data.filePath}`);
        } else {

           smith.addEvent({
                type: type,
                message:`🟢 [${type}] - SUCCESS `,
                timestamp: new Date().toISOString(),

          });

          console.log(`🟢 [${type}] - SUCCESS`);
          console.log(`   Path: ${data.filePath}`);
      

        }
    })
    
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

      const agent = AIOperator.create({
        type: agent_provider,
        options: {
          apiKey: agentconfig.apiKey,
          model: agent_model,
        },
     });
    console.log('✅ AI operator created');
    
    console.log('🧠 Teaching AI the tools...');
    ai.learn([
      weather.teach(),
      fs.teach(),
    ]);
    console.log('✅ AI learned tools\n');
    console.log('Available capabilities:', ai.capabilities().list());

    //process.exit(1);
    // Step 5: Create Agent Smith with parsed template instructions
    console.log('🕶️  Creating Agent Smith with template support...');
    const smith = Smith.create({ 
      ai, 
      agent,
      maxIterations: 20,
      templateInstructions // Pass pre-parsed template object
    });
    console.log('✅', smith.whoami());
    console.log('🎯 Smith now has template-driven task breakdown capability');
    
   
    console.log('Teaching Smith tools (for context)...');
    smith.learn([weather.teach(), fs.teach()]);
    console.log('✅', smith.whoami());
    console.log();

    // Step 7: Smith creative beach destination mission with filesystem awareness
    console.log('�️  Executing Smith simple demo mission...\n');
  const mission = 'Find out the weather in New York, and save report to \'vault/new-york-weather-report.md\'';
   
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
