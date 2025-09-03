const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chatbot backend is running',
    timestamp: new Date().toISOString()
  });
});

// Chat initialization endpoint
app.post('/api/chat/init', (req, res) => {
  res.json({
    sessionId: 'session-' + Date.now(),
    message: 'Hello! I\'m here to help you with any questions about our services. How can I assist you today?'
  });
});

// Chat message endpoint
app.post('/api/chat/message', (req, res) => {
  const { sessionId, message } = req.body;
  
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'Session ID and message are required' });
  }

  // Simple response for now
  const response = `Thank you for your message: "${message}". I'm here to help you with any questions about our services. How can I assist you today?`;
  
  res.json({
    response: response,
    sessionId: sessionId
  });
});

// Chat history endpoint
app.get('/api/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  res.json({
    messages: [
      {
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Chatbot backend server started successfully!');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat/init`);
  console.log('📱 Your frontend can now connect to this backend!');
}); 