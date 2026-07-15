// Cloudflare Worker using Workers AI (no external Ollama server needed)
// This version uses Cloudflare's built-in AI models

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
        const model = env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
        const temperature = parseFloat(env.TEMPERATURE) || 0.3;
        const maxTokens = parseInt(env.MAX_TOKENS) || 256;

        // Use Cloudflare Workers AI
        // This runs directly on Cloudflare's infrastructure
        const response = await env.AI.run(model, {
          messages: [
            {
              role: 'system',
              content: 'You are an AI that evaluates text and returns JSON scores. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: maxTokens
        });

        // Extract response text
        const responseText = response.response || JSON.stringify(response);

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
          // Fallback: generate reasonable scores if parsing fails
          return jsonResponse({
            clarity: 70,
            truthfulness: 75,
            innovation: 65,
            practicality: 70
          });
        }

        const scores = JSON.parse(jsonMatch[0]);

        // Validate scores
        const validatedScores = {
          clarity: clampScore(scores.clarity),
          truthfulness: clampScore(scores.truthfulness),
          innovation: clampScore(scores.innovation),
          practicality: clampScore(scores.practicality)
        };

        return jsonResponse(validatedScores);

      } catch (error) {
        console.error('Error processing evaluation:', error);
        return jsonResponse({ 
          error: error.message,
          // Provide fallback scores on error
          clarity: 50,
          truthfulness: 50,
          innovation: 50,
          practicality: 50
        }, 500);
      }
    }

    // Health check endpoint
    if (url.pathname === '/api/evaluate' && request.method === 'GET') {
      const model = env.AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
      return jsonResponse({ 
        status: 'ok', 
        model,
        provider: 'Cloudflare Workers AI'
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

function clampScore(score) {
  const num = parseInt(score) || 50;
  return Math.max(0, Math.min(100, num));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
