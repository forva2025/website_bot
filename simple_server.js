const http = require('http');
const url = require('url');

// Simple in-memory storage
const sessions = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Parse JSON body for POST requests
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Health check endpoint
      if (path === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'OK',
          message: 'Chatbot backend is running',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      // Chat initialization endpoint
      if (path === '/api/chat/init' && req.method === 'POST') {
        const sessionId = 'session-' + Date.now();
        sessions.set(sessionId, {
          messages: [],
          createdAt: new Date()
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          sessionId: sessionId,
          message: 'Hello! I\'m here to help you with any questions about our services. How can I assist you today?'
        }));
        return;
      }

      // Chat message endpoint
      if (path === '/api/chat/message' && req.method === 'POST') {
        let data;
        try {
          data = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        const { sessionId, message } = data;
        
        if (!sessionId || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session ID and message are required' }));
          return;
        }

        // Get or create session
        let session = sessions.get(sessionId);
        if (!session) {
          session = {
            messages: [],
            createdAt: new Date()
          };
          sessions.set(sessionId, session);
        }

        // Add user message
        session.messages.push({ role: 'user', content: message });

        // Simple AI response
        const aiResponse = `Thank you for your message: "${message}". I'm here to help you with any questions about our services. How can I assist you today?`;
        
        // Add AI response
        session.messages.push({ role: 'assistant', content: aiResponse });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: aiResponse,
          sessionId: sessionId
        }));
        return;
      }

      // Chat history endpoint
      if (path.startsWith('/api/chat/history/') && req.method === 'GET') {
        const sessionId = path.split('/').pop();
        const session = sessions.get(sessionId);

        if (!session) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ messages: session.messages }));
        return;
      }

      // Default response
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));

    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

// Clean up old sessions every hour
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.createdAt < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 Simple Chatbot Backend Server Started!');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat/init`);
  console.log('📱 Your frontend can now connect to this backend!');
  console.log('🔧 No external dependencies required - uses Node.js built-in modules only');
}); 