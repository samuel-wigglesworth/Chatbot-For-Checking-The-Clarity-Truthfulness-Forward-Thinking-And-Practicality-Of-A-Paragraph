// Cloudflare Worker for Paragraph Evaluator
// This worker handles the /api/evaluate endpoint and connects to llama3.1

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Serve static files - removed assets binding
    // Static files should be served separately (e.g., Cloudflare Pages)
    if (request.method === 'GET' && url.pathname !== '/api/evaluate') {
      return new Response('Static files not served by this worker. Use Cloudflare Pages or similar for static hosting.', { status: 404 });
    }

    // Handle API endpoint
    if (url.pathname === '/api/evaluate' && request.method === 'POST') {
      try {
        const { text, prompt } = await request.json();

        if (!text || !prompt) {
          return jsonResponse({ error: 'Missing text or prompt' }, 400);
        }

        // Get config from environment variables with defaults
        const ollamaUrl = env.OLLAMA_API_URL;
        if (!ollamaUrl) {
          return jsonResponse({ error: 'OLLAMA_API_URL is not configured. Please set this variable or secret in your Cloudflare Worker.' }, 500);
        }
        const model = env.OLLAMA_MODEL || 'llama3.1:latest';
        const temperature = parseFloat(env.TEMPERATURE) || 0.3;
        const maxTokens = parseInt(env.MAX_TOKENS) || 256;
        
        const ollamaResponse = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: prompt,
            stream: false,
            temperature,
            max_tokens: maxTokens
          })
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama API error: ${ollamaResponse.status}`);
        }

        const ollamaData = await ollamaResponse.json();
        const responseText = ollamaData.response;

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
          return jsonResponse({ error: 'Could not parse evaluation scores' }, 500);
        }

        const scores = JSON.parse(jsonMatch[0]);

        return jsonResponse(scores);

      } catch (error) {
        console.error('Error processing evaluation:', error);
        return jsonResponse({ error: error.message }, 500);
      }
    }

    // Health check endpoint
    if (url.pathname === '/api/evaluate' && request.method === 'GET') {
      const model = env.OLLAMA_MODEL || 'llama3.1:latest';
      return jsonResponse({ 
        status: 'ok', 
        model,
        provider: 'Ollama'
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
