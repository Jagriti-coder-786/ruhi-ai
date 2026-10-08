import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local manually
config({ path: resolve(process.cwd(), '.env.local') });

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set');
    process.exit(1);
  }

  console.log('Testing Groq API with Llama-3.1-8b...');
  
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say "Hello, Groq is working perfectly!" and nothing else.' }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log('\n--- GROQ RESPONSE ---');
    console.log(data.choices[0]?.message?.content);
    console.log('---------------------\n');
    console.log('Test successful!');
  } catch (err: any) {
    console.error('Test failed:', err.message);
  }
}

testGroq();
