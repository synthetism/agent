#!/usr/bin/env node

/**
 * OpenWeather API Direct Test
 * Test searchLocation functionality directly
 */

const API_KEY = '82d319ab6a33eea55aed0814f47ba576';

async function testSearchLocation(query) {
  console.log(`🔍 Testing search for: "${query}"`);
  
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    console.log(`📡 URL: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error response: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ Response data:`, JSON.stringify(data, null, 2));
    
    console.log(`📍 Formatted results:`);
    data.forEach((location, index) => {
      console.log(`  ${index + 1}. ${location.name}, ${location.country} (${location.lat}, ${location.lon})`);
    });
    
  } catch (error) {
    console.error(`💥 Error:`, error.message);
  }
  
  console.log('');
}

async function runTests() {
  console.log('🧪 OpenWeather Geocoding API Test');
  console.log('==================================\n');
  
  // Test various locations
  await testSearchLocation('Tokyo');
  await testSearchLocation('Miami');
  await testSearchLocation('Bali');
  await testSearchLocation('Malibu');
  await testSearchLocation('NonExistentCity12345');
  
  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);
