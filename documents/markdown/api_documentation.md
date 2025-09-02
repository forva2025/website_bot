# API Documentation

## Overview
This document describes the REST API endpoints available for our chatbot service.

## Base URL
```
https://api.yourcompany.com
```

## Authentication
All API requests require a valid API key in the Authorization header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### 1. Health Check
**GET** `/api/health`

Returns the health status of the API service.

**Response:**
```json
{
  "status": "OK",
  "message": "Chatbot backend is running",
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 2. Chat Session Initialization
**POST** `/api/chat/init`

Creates a new chat session and returns a session ID.

**Request Body:** None required

**Response:**
```json
{
  "sessionId": "uuid-string",
  "message": "Hello! I'm here to help you with any questions about our services. I have access to our company information, documentation, PDFs, and website content. How can I assist you today?"
}
```

### 3. Send Message
**POST** `/api/chat/message`

Sends a message to the chatbot and receives a response.

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "message": "What services do you offer?"
}
```

**Response:**
```json
{
  "response": "We offer a comprehensive range of services including web development, mobile app development, AI integration, and digital marketing solutions. Our web development packages start from $2,999 for basic websites and go up to $15,000+ for complex enterprise solutions.",
  "sessionId": "uuid-string",
  "contextSources": 2
}
```

### 4. Chat History
**GET** `/api/chat/history/:sessionId`

Retrieves the conversation history for a specific session.

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What services do you offer?",
      "timestamp": "2025-01-27T10:30:00.000Z"
    },
    {
      "role": "assistant",
      "content": "We offer web development, mobile app development...",
      "timestamp": "2025-01-27T10:30:05.000Z"
    }
  ]
}
```

### 5. Knowledge Base Search
**GET** `/api/knowledge/search?q=query&limit=5`

Searches the knowledge base for relevant information.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Maximum number of results (default: 5)

**Response:**
```json
{
  "query": "web development",
  "results": [
    {
      "id": "json_pricing_0",
      "type": "pricing",
      "title": "web_development",
      "content": "Our web development packages start from $2,999...",
      "source": "json_data",
      "relevanceScore": 8
    }
  ],
  "total": 1,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 6. Knowledge Base Statistics
**GET** `/api/knowledge/stats`

Returns statistics about the knowledge base.

**Response:**
```json
{
  "totalDocuments": 15,
  "lastUpdate": "2025-01-27T10:00:00.000Z",
  "documentTypes": {
    "company_info": 3,
    "faq": 3,
    "pricing": 2,
    "pdf": 2,
    "website": 3,
    "markdown": 1,
    "text": 1
  },
  "sources": {
    "json_data": 8,
    "pdf_documents": 2,
    "website_links": 3,
    "markdown_files": 1,
    "text_files": 1
  }
}
```

### 7. Knowledge Base Update
**POST** `/api/knowledge/update`

Manually triggers a knowledge base index update.

**Response:**
```json
{
  "message": "Knowledge base updated successfully"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (missing parameters)
- **401**: Unauthorized (invalid API key)
- **404**: Not Found (session not found)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @yourcompany/chatbot-sdk
```

```javascript
import { ChatbotClient } from '@yourcompany/chatbot-sdk';

const client = new ChatbotClient('YOUR_API_KEY');
const response = await client.sendMessage('Hello!');
```

### Python
```bash
pip install yourcompany-chatbot
```

```python
from yourcompany_chatbot import ChatbotClient

client = ChatbotClient('YOUR_API_KEY')
response = client.send_message('Hello!')
```

## Support

For API support and questions:
- Email: api-support@yourcompany.com
- Documentation: https://docs.yourcompany.com/api
- Status Page: https://status.yourcompany.com 