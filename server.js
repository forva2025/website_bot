const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const KnowledgeBaseManager = require('./knowledge_base_manager');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize knowledge base manager
const knowledgeBaseManager = new KnowledgeBaseManager();

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

// Initialize knowledge base on startup
async function initializeKnowledgeBase() {
  try {
    await knowledgeBaseManager.initialize();
    console.log('Knowledge base initialized successfully');
  } catch (error) {
    console.error('Failed to initialize knowledge base:', error);
    console.log('Continuing with basic functionality...');
  }
}

// Enhanced search function using the knowledge base manager
async function searchKnowledgeBase(query) {
  try {
    // Use the enhanced knowledge base manager
    const results = await knowledgeBaseManager.search(query);
    
    if (results && results.length > 0) {
      // Format results for the AI context
      return results.map(doc => {
        let sourceInfo = '';
        switch (doc.type) {
          case 'pdf':
            sourceInfo = `[PDF Document: ${doc.title}]`;
            break;
          case 'website':
            sourceInfo = `[Website: ${doc.title}]`;
            break;
          case 'markdown':
            sourceInfo = `[Documentation: ${doc.title}]`;
            break;
          case 'text':
            sourceInfo = `[Text File: ${doc.title}]`;
            break;
          default:
            sourceInfo = `[${doc.title}]`;
        }
        
        return `${sourceInfo}\n${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}`;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Knowledge base search error:', error);
    // Fallback to basic search if enhanced search fails
    return searchBasicKnowledgeBase(query);
  }
}

// Fallback basic search function (original implementation)
function searchBasicKnowledgeBase(query) {
  const results = [];
  const searchQuery = query.toLowerCase();

  try {
    // Load basic knowledge base as fallback
    const knowledgeBase = require('./knowledge_base.json');

    // Search company info
    knowledgeBase.company_info?.forEach(item => {
      if (item.topic.includes(searchQuery) || item.content.toLowerCase().includes(searchQuery)) {
        results.push(item.content);
      }
    });

    // Search FAQ
    knowledgeBase.faq?.forEach(item => {
      if (item.question.toLowerCase().includes(searchQuery) || item.answer.toLowerCase().includes(searchQuery)) {
        results.push(`Q: ${item.question}\nA: ${item.answer}`);
      }
    });

    // Search pricing
    knowledgeBase.pricing?.forEach(item => {
      if (item.service.includes(searchQuery) || item.content.toLowerCase().includes(searchQuery)) {
        results.push(item.content);
      }
    });
  } catch (error) {
    console.error('Basic knowledge base search error:', error);
  }

  return results.slice(0, 3); // Return top 3 results
}

// Helper function to call Deepseek API
async function callDeepseekAPI(messages, context = '') {
  try {
    const systemPrompt = `You are a helpful customer service assistant with access to a comprehensive knowledge base including company information, FAQs, pricing, PDF documents, website content, and other resources. ${context ? `Use this context to answer questions: ${context}` : ''} 
    Be friendly, professional, and concise. If you don't know something specific about the company, admit it and offer to help connect them with someone who can assist. When referencing information from documents or websites, mention the source type.`;

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

// Knowledge base statistics
app.get('/api/knowledge/stats', async (req, res) => {
  try {
    const stats = knowledgeBaseManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to get knowledge base stats:', error);
    res.status(500).json({ error: 'Failed to get knowledge base statistics' });
  }
});

// Manual knowledge base update
app.post('/api/knowledge/update', async (req, res) => {
  try {
    await knowledgeBaseManager.updateIndex();
    res.json({ message: 'Knowledge base updated successfully' });
  } catch (error) {
    console.error('Failed to update knowledge base:', error);
    res.status(500).json({ error: 'Failed to update knowledge base' });
  }
});

// Search knowledge base directly
app.get('/api/knowledge/search', async (req, res) => {
  try {
    const { q: query, limit } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await knowledgeBaseManager.search(query, limit ? parseInt(limit) : null);
    res.json({ 
      query, 
      results, 
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Knowledge base search error:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
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
    message: 'Hello! I\'m here to help you with any questions about our services. I have access to our company information, documentation, PDFs, and website content. How can I assist you today?'
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
    const relevantContext = await searchKnowledgeBase(message);
    const contextString = relevantContext.length > 0 
      ? `Context from knowledge base:\n${relevantContext.join('\n\n')}` 
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
      sessionId,
      contextSources: relevantContext.length > 0 ? relevantContext.length : 0
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

// Start server
app.listen(PORT, async () => {
  console.log(`Chatbot backend running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  
  // Initialize knowledge base
  await initializeKnowledgeBase();
});