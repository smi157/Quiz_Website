export default {
  async fetch(request, env) {
    // Your secrets (set in Cloudflare Workers dashboard)
    const RAILWAY_API_URL = env.RAILWAY_API_URL;  
    const RAILWAY_API_KEY = env.RAILWAY_API_KEY;  

    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Parse the request URL
    const url = new URL(request.url);
    
    // Extract the endpoint path
    // e.g., /quiz?difficulty=1&num_questions=10
    const endpoint = url.pathname + url.search;

    try {
      // Forward request to Railway API with your API key
      const response = await fetch(`${RAILWAY_API_URL}${endpoint}`, {
        method: request.method,
        headers: {
          'Authorization': `Bearer ${RAILWAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: request.method !== 'GET' ? await request.text() : undefined
      });

      // Get the response data
      const data = await response.text();
      
      // Return response with CORS headers
      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};