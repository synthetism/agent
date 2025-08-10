/**
 * Weather Unit Direct Test
 * Tests if the weather API is working properly
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WeatherUnit } from '../src/tools/weather.unit.js';

async function testWeatherDirect() {
  console.log('🌤️  Testing Weather Unit Direct');
  console.log('=================================\n');

  try {
    // Load API key
    const weatherConfig = JSON.parse(
      readFileSync(path.join('private', 'openweather.json'), 'utf-8')
    );
    console.log('✅ Weather API key loaded\n');

    // Create weather unit
    const weather = WeatherUnit.create({
      apiKey: weatherConfig.apiKey
    });
    console.log('✅ Weather unit created');
    console.log(weather.whoami());
    console.log();

    // Test direct weather call
    console.log('🌍 Testing Tokyo weather...');
    const tokyoWeather = await weather.getCurrentWeather('Tokyo, Japan');
    console.log('✅ Tokyo weather:', JSON.stringify(tokyoWeather, null, 2));
    console.log();

    console.log('🌍 Testing London weather...');
    const londonWeather = await weather.getCurrentWeather('London, UK');
    console.log('✅ London weather:', JSON.stringify(londonWeather, null, 2));
    console.log();

  } catch (error) {
    console.error('❌ Weather test failed:', error);
  }
}

testWeatherDirect().catch(console.error);
