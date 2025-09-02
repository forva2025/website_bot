const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load knowledge base
const knowledgeBase = require('./knowledge_base.json');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Store for conversation sessions
const sessions = new Map();

// Helper function to search knowledge base
function searchKnowledgeBase(query) {
  const results = [];
  const searchQuery = query.toLowerCase();

  // Search company info
  knowledgeBase.company_info.forEach(item => {
    if (item.topic.includes(searchQuery) || item.content.toLowerCase().includes(searchQuery)) {
      results.push(item.content);
    }
  });

  // Search FAQ
  knowledgeBase.faq.forEach(item => {
    if (item.question.toLowerCase().includes(searchQuery) || item.answer.toLowerCase().includes(searchQuery)) {
      results.push(`Q: ${item.question}\nA: ${item.answer}`);
    }
  });

  // Search pricing
  knowledgeBase.pricing.forEach(item => {
    if (item.service.includes(searchQuery) || item.content.toLowerCase().includes(searchQuery)) {
      results.push(item.content);
    }
  });

  return results.slice(0, 3); // Return top 3 results
}

// Helper function to call Deepseek API
async function callDeepseekAPI(messages, context = '') {
  try {
    const systemPrompt = `You are a helpful customer service assistant. ${context ? `Use this context to answer questions: ${context}` : ''} 
    Be friendly, professional, and concise. If you don't know something specific about the company, admit it and offer to help connect them with someone who can assist.`;

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Deepseek API Error:', error.response?.data || error.message);
    throw new Error('Sorry, I\'m having trouble connecting to my AI service right now. Please try again in a moment.');
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Chatbot backend is running' });
});

// Initialize chat session
app.post('/api/chat/init', (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    messages: [],
    createdAt: new Date()
  });
  
  res.json({
    sessionId,
    message: 'Hello! I\'m here to help you with any questions about our services. How can I assist you today?'
  });
});

// Send message
app.post('/api/chat/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
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

    // Add user message to session
    session.messages.push({ role: 'user', content: message });

    // Search knowledge base for relevant context
    const relevantContext = searchKnowledgeBase(message);
    const contextString = relevantContext.length > 0 
      ? `Context from company knowledge base:\n${relevantContext.join('\n\n')}` 
      : '';

    // Get AI response
    const aiResponse = await callDeepseekAPI(session.messages, contextString);

    // Add AI response to session
    session.messages.push({ role: 'assistant', content: aiResponse });

    // Clean up old sessions (keep last 50 messages per session)
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }

    res.json({
      response: aiResponse,
      sessionId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while processing your message' 
    });
  }
});

// Get chat history
app.get('/api/chat/history/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ messages: session.messages });
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

app.listen(PORT, () => {
  console.log(`Chatbot backend running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});