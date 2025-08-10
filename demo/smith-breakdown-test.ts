/**
 * Smith Task Breakdown Test
 * 
 * Tests Smith's ability to break down a complex mission into discrete steps
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AI } from '@synet/ai';
import { Smith } from '../src/smith.unit.js';
import { WeatherUnit } from '../src/tools/weather.unit.js';
import { FS } from '@synet/fs';

async function testSmithTaskBreakdown() {
  console.log('🕶️  Testing Smith Task Breakdown');
  console.log('==================================\n');

  try {
    // Load API keys
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );

    // Create tools and AI
    const weather = WeatherUnit.create({ apiKey: weatherConfig.apiKey });
    const fs = FS.sync.node();
    const ai = AI.openai({
      apiKey: openaiConfig.apiKey,
      model: 'gpt-4o-mini'
    });

    // Teach AI the tools
    ai.learn([weather.teach(), fs.teach()]);

    // Create Smith
    const smith = Smith.create({ ai });
    smith.learn([weather.teach(), fs.teach()]);

    console.log('✅ Setup complete');
    console.log('✅', smith.whoami());
    console.log();

    // Get available tools for the prompt
    const availableTools = [
      'weather.getCurrentWeather',
      'weather.getForecast', 
      'weather.getWeatherByCoords',
      'weather.searchLocation',
      'fs.readFileSync',
      'fs.writeFileSync',
      'fs.existsSync',
      'fs.deleteFileSync',
      'fs.readDirSync',
      'fs.ensureDirSync',
      'fs.deleteDirSync',
      'fs.chmodSync',
      'fs.statSync',
      'fs.clear'
    ];

    // ENTRY PROMPT: Ask Smith to break down the mission
    const mission = `Mission: Weather Intelligence Report

Task: 
1. Get current weather for Tokyo, Japan
2. Get current weather for London, UK  
3. Compare the temperatures and conditions
4. Create a weather intelligence report
5. Save the report to 'weather-report.txt'

Requirements:
- Use actual weather data
- Include temperature comparison
- Format as professional intelligence report
- Save file successfully
- End with "MISSION_COMPLETE"`;

    const entryPrompt = `You are Agent Smith, mission orchestrator. 

MISSION: ${mission}

AVAILABLE TOOLS: ${availableTools.join(', ')}

Your task is to break this mission down into discrete, executable steps. Each step should be:
- One specific action
- Use one tool
- Have clear success criteria

Please respond with a numbered list of steps that will accomplish this mission. Be specific about which tools to use and what parameters.

Example format:
1. Use weather.getCurrentWeather with location: "Tokyo, Japan"
2. Use weather.getCurrentWeather with location: "London, UK"
3. Create comparison report using the collected data
4. Use fs.writeFileSync to save report to "weather-report.txt"

Please break down the mission above:`;

    console.log('🎯 Entry Prompt - Asking Smith to break down mission...\n');
    
    const response = await smith.chat([
      { role: 'user', content: entryPrompt }
    ]);

    console.log('📋 Smith\'s Task Breakdown:');
    console.log('===========================');
    console.log(response.content);
    console.log();

    console.log('🔍 Analysis:');
    console.log('- How many steps did Smith identify?');
    console.log('- Are the steps specific and actionable?');
    console.log('- Does each step use one tool?');
    console.log('- Is the sequence logical?');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSmithTaskBreakdown().catch(console.error);
