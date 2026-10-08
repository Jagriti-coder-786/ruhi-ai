async function test() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'can you give me prompt' }],
      modelId: 'ruhi-balanced'
    })
  });
  
  if (!res.ok) {
    console.error('HTTP Error:', res.status, await res.text());
    return;
  }
  
  // The response might be streaming, we can just read the text chunks
  const text = await res.text();
  console.log("STREAM TEXT:");
  console.log(text);
}

test().catch(console.error);
