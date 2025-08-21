// Debug script to test authentication
const fetch = require('node-fetch');

async function testCreditsEndpoint() {
  try {
    console.log('Testing /api/user/credits endpoint...');
    
    const response = await fetch('http://localhost:3000/api/user/credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testCreditsEndpoint();