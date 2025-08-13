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
import { Switch } from '../src/switch.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import { NodeFileSystem, ObservableFileSystem, FilesystemEvent } from '@synet/fs/promises';
import { createAIFileSystem } from '@synet/fs-ai';
import { AsyncFileSystem } from "@synet/fs";
import { Weather, OpenWeather2 } from "@synet/weather"
import type { AgentInstructions} from "../src/types/agent.types.js"
import { Email } from "@synet/email"
import { Hasher } from "@synet/hasher"
import { Crypto } from "@synet/crypto"
import type { MemoryPushEvent } from '../src/memory.unit.js';


async function runSmithWeatherDemo() {
  console.log('Switch Simple Weather Demo');
  console.log('===============================\n');
  
  const provider = 'deepseek';
  const model = 'deepseek-chat';


  try {
    // Step 1: Load API keys and template instructions
    console.log('🔑 Loading API keys and templates...');
    const aiconfig = JSON.parse(
      readFileSync(path.join('private', `${provider}.json`), 'utf-8')
    );

    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    
    // Parse template instructions outside (lightweight approach)
    const templateInstructions = JSON.parse(
      readFileSync(path.join('config', 'switch-instructions.json'), 'utf-8')
    ) as AgentInstructions;
    console.log('✅ API keys and templates loaded');
    console.log(`📋 Template loaded: ${templateInstructions.name} v${templateInstructions.version}\n`);

    const credentialsPath = path.join(process.cwd(), "private", "smtp.json");
    const credentialsData = readFileSync(credentialsPath, "utf-8");
    const emailCConfig = JSON.parse(credentialsData);

    // Step 2: Create tools first
    /* console.log('🛠️  Creating tools...');
     const weather = WeatherUnit.create({
      apiKey: weatherConfig.apiKey
    });  */

   const openweather  = new OpenWeather2({ 
      apiKey:weatherConfig.apiKey,
      timeout: 10000 
    });
  
    // Create weather unit
    const weather = Weather.create({
      provider:openweather,
      defaultUnits: 'metric'
    }); 

 
    // Step 3: Setup AI-safe filesystem with event monitoring (like ai-demo-fs)
    console.log('Setting up AI-safe filesystem with Observable wrapper...');
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
    console.log(' Setting up filesystem event monitoring...');
    
 

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

    console.log('AI operator created');
    
    console.log('Teaching AI the tools...');
    ai.learn([
      weather.teach(),
      fs.teach(),
    ]);
    console.log('✅ AI learned tools\n');
    console.log('Available capabilities:', ai.capabilities().list());

    //process.exit(1);
    // Step 5: Create Agent Smith with parsed template instructions
    console.log('Creating Agent Switch with template support...');
    const switchUnit = Switch.create({ 
      ai,       
      maxIterations: 20,
      templateInstructions // Pass pre-parsed template object
    });
    console.log('✅', switchUnit.whoami());
    console.log('🎯 Switch now has template-driven task breakdown capability');

    const memory = switchUnit.getMemory();
    const unsubscribePush = memory.on('push', (event: MemoryPushEvent) => {
      console.log(`🧠 PUSH: Added item ${event.item.id} \n Memory contents ${JSON.stringify(event.item.data)} \n Total: ${event.total}`);
    });
    

    eventEmitter.subscribe('file.write', {
      update: (event) => {
        const { type, data } = event;
        if (data.error) {

          switchUnit.addEvent({
                type: type,
                message:`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`,
                timestamp: new Date().toISOString(),

          });

          console.log (`🔴 [FS-EVENT] ${type} - ERROR: ${data.error.message}`);      
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}`);
        } else {

           switchUnit.addEvent({
                type: type,
                message:`🟢 [FS-EVENT] ${type} - SUCCESS `,
                timestamp: new Date().toISOString(),

          });

          console.log(`🟢 [FS-EVENT] ${type} - SUCCESS`);
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}, Result: ${data.result} bytes written`);
      

        }
      }
    });

      eventEmitter.subscribe('file.ensureDir', {
      update: (event) => {
        const { type, data } = event;
        if (data.error) {

          switchUnit.addEvent({
                type: type,
                message:`🔴 [${type}] - ERROR: ${data.error.message}`,
                timestamp: new Date().toISOString(),

          });

          console.log (`🔴 [${type}] - ERROR: ${data.error.message}`);      
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}`);
        } else {

           switchUnit.addEvent({
                type: type,
                message:`🟢 [${type}] - SUCCESS `,
                timestamp: new Date().toISOString(),

          });

          console.log(`🟢 [${type}] - SUCCESS`);
          console.log(`   Path: ${data.filePath}, Operation: ${data.operation}`);
      

        }
      }
    });


    
    console.log('🧠 Teaching Switch tools (for context)...');
    switchUnit.learn([weather.teach(), fs.teach()]);
    console.log('✅', switchUnit.whoami());
    console.log();

    // Step 7: Smith creative beach destination mission with filesystem awareness
    console.log('🤖 Executing Smith creative beach destination mission...\n');

    const mission = 'Find out the weather in New York, ensure `vault` dir exists and save report to \'vault/new-york-weather-report.md\'';

    const result = await switchUnit.run(mission);
    
    console.log('\n📊 Mission Summary:');
    console.log('==================');
    console.log('Goal: Ultimate Beach Destination Intelligence');
    console.log(`Completed: ${result.completed}`);
    console.log(`Iterations: ${result.iterations}`);
    console.log(`Messages: ${result.messages.length}`);
    
    unsubscribePush();

    if (result.completed) {

      console.log('✅ Switch demo completed successful!');   

    } else {

      console.log('⚠️  Switch  mission incomplete ');

    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo
runSmithWeatherDemo().catch(console.error);
