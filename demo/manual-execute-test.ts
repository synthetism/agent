/**
 * Manual Tool Execution Test  
 * Tests if we can manually execute learned capabilities
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AI } from '@synet/ai';
import { WeatherUnit } from '../src/tools/weather.unit.js';

async function testManualExecution() {
  console.log('🔧 Testing Manual Tool Execution');
  console.log('=================================\n');

  try {
    // Load API keys
    const openaiConfig = JSON.parse(
      readFileSync(path.join('private', 'openai.json'), 'utf-8')
    );
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );

    // Create weather unit
    const weather = WeatherUnit.create({
      apiKey: weatherConfig.apiKey
    });

    // Create AI and teach it weather
    const ai = AI.openai({
      apiKey: openaiConfig.apiKey,
      model: 'gpt-4o-mini'
    });

    ai.learn([weather.teach()]);
    console.log('✅ AI learned capabilities:', ai.capabilities().list());
    console.log('✅ Can execute weather.getCurrentWeather?', ai.can('weather.getCurrentWeather'));
    
    // Test manual execute
    console.log('\n🎯 Testing manual execute...');
    try {
      const result = await ai.execute('weather.getCurrentWeather', 'Tokyo, Japan');
      console.log('✅ Manual execute result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Manual execute failed:', error);
    }

    // Test with object args like tool calling
    console.log('\n🎯 Testing manual execute with object args...');
    try {
      const result = await ai.execute('weather.getCurrentWeather', { location: 'Tokyo, Japan' });
      console.log('✅ Object args result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Object args failed:', error);
    }

    // Test with spread args
    console.log('\n🎯 Testing manual execute with spread args...');
    try {
      const argValues = Object.values({ location: 'Tokyo, Japan' });
      console.log('Calling execute with args:', argValues);
      const result = await ai.execute('weather.getCurrentWeather', ...argValues);
      console.log('✅ Spread args result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Spread args failed:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testManualExecution().catch(console.error);
