/**
 * AI Tool Execution Test
 * Tests if AI can execute tools directly
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AI } from '@synet/ai';
import { WeatherUnit } from '../src/tools/weather.unit.js';

async function testAIToolExecution() {
  console.log('🤖 Testing AI Tool Execution Direct');
  console.log('====================================\n');

  try {
    // Load API keys
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    console.log('✅ API keys loaded\n');

    // Create weather unit
    const weather = WeatherUnit.create({
      apiKey: weatherConfig.apiKey
    });
    console.log('✅ Weather unit created');

    // Create AI and teach it weather
    const ai = AI.openai({
      apiKey: openaiConfig.apiKey,
      model: 'gpt-4o-mini'
    });
    console.log('✅ AI created');

    ai.learn([weather.teach()]);
    console.log('✅ AI learned weather tools');
    console.log('Available capabilities:', ai.capabilities().list());
    console.log();

    // Test direct AI call with tools
    console.log('🎯 Testing AI call with useTools: true...');
    const result = await ai.call('Get the current weather for Tokyo, Japan', { 
      useTools: true 
    });
    
    console.log('✅ AI Response:', result.content);
    console.log('Tool calls made:', result.toolCalls?.length || 0);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIToolExecution().catch(console.error);
