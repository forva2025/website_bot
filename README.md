# Deepseek Chatbot for Website

A complete chatbot solution powered by Deepseek API with custom knowledge base integration.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Deepseek API key
- Basic web server (for frontend hosting)

### 1. Backend Setup

1. **Create project directory:**
   ```bash
   mkdir deepseek-chatbot
   cd deepseek-chatbot
   ```

2. **Copy all backend files:**
   - `package.json`
   - `server.js`
   - `knowledge_base.json`
   - `.env.example`

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file and add your Deepseek API key:
   ```
   DEEPSEEK_API_KEY=your_actual_deepseek_api_key
   PORT=3000
   CORS_ORIGIN=*
   ```

5. **Customize your knowledge base:**
   Edit `knowledge_base.json` with your company's information, FAQs, and services.

6. **Start the backend server:**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. **Copy the chatbot widget:**
   Save `chatbot-widget.html` to your web server or project directory.

2. **Update API URL:**
   In `chatbot-widget.html`, find this line:
   ```javascript
   this.apiUrl = 'http://localhost:3000/api';
   ```
   
   Change it to your deployed backend URL:
   ```javascript
   this.apiUrl = 'https://your-backend-domain.com/api';
   ```

3. **Embed in your website:**
   Add this to your HTML pages:
   ```html
   <script src="path/to/chatbot-widget.html"></script>
   ```
   
   Or copy the entire widget code into your existing pages.

## 📁 File Structure

```
deepseek-chatbot/
├── package.json              # Backend dependencies
├── server.js                 # Express server
├── knowledge_base.json       # Your custom data
├── .env                      # Environment variables
├── .env.example              # Template for env vars
└── chatbot-widget.html       # Frontend widget
```

## 🛠️ Customization

### Backend Customization

**Knowledge Base (`knowledge_base.json`):**
```json
{
  "company_info": [
    {
      "topic": "your_topic",
      "content": "Your information here"
    }
  ],
  "faq": [
    {
      "question": "Your question?",
      "answer": "Your answer here"
    }
  ],
  "pricing": [
    {
      "service": "service_name",
      "content": "Pricing information"
    }
  ]
}
```

**API Endpoints:**
- `GET /api/health` - Health check
- `POST /api/chat/init` - Initialize chat session
- `POST /api/chat/message` - Send message
- `GET /api/chat/history/:sessionId` - Get chat history

### Frontend Customization

**Colors and Styling:**
Edit the CSS variables in `chatbot-widget.html`:
```css
.chat-toggle {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**Widget Position:**
```css
.chatbot-container {
    bottom: 20px;  /* Distance from bottom */
    right: 20px;   /* Distance from right */
}
```

**Widget Size:**
```css
.chat-widget {
    width: 350px;  /* Widget width */
    height: 500px; /* Widget height */
}
```

## 🚀 Deployment

### Backend Deployment

**Option 1: Heroku**
1. Create `Procfile`:
   ```
   web: node server.js
   ```

2. Deploy to Heroku:
   ```bash
   heroku create your-chatbot-backend
   heroku config:set DEEPSEEK_API_KEY=your_api_key
   git add .
   git commit -m "Deploy chatbot backend"
   git push heroku main
   ```

**Option 2: Vercel**
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard.

**Option 3: Railway**
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

**Option 4: DigitalOcean/AWS/Google Cloud**
- Use PM2 for process management
- Set up reverse proxy with Nginx
- Configure SSL certificate

### Frontend Deployment

**Option 1: Same Domain**
Simply include the widget in your existing website files.

**Option 2: CDN**
Host the widget file on a CDN and include it via script tag:
```html
<script src="https://your-cdn.com/chatbot-widget.js"></script>
```

**Option 3: Separate Domain**
Host on a separate domain and update CORS settings in backend.

## 🔧 Configuration Options

### Environment Variables
```bash
DEEPSEEK_API_KEY=your_deepseek_api_key    # Required
PORT=3000                                  # Optional, default: 3000
CORS_ORIGIN=*                             # Optional, default: *
NODE_ENV=production                        # Optional
```

### Security Settings

**Rate Limiting:**
Current setting: 100 requests per 15 minutes per IP
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per windowMs
});
```

**CORS Configuration:**
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
```

For production, set specific origins:
```bash
CORS_ORIGIN=https://yourwebsite.com,https://www.yourwebsite.com
```

## 📋 Features

### Backend Features
- ✅ Deepseek API integration
- ✅ Custom knowledge base search
- ✅ Session management
- ✅ Rate limiting
- ✅ Error handling
- ✅ CORS support
- ✅ Memory cleanup
- ✅ Health check endpoint

### Frontend Features
- ✅ Modern chat UI
- ✅ Responsive design
- ✅ Typing indicators
- ✅ Error handling
- ✅ Session persistence
- ✅ Mobile-friendly
- ✅ Smooth animations
- ✅ Keyboard shortcuts

## 🐛 Troubleshooting

### Common Issues

**1. "Failed to connect to chat service"**
- Check if backend server is running
- Verify API URL in frontend code
- Check network connectivity

**2. "Invalid API key"**
- Verify your Deepseek API key in `.env`
- Check if API key has proper permissions
- Ensure no extra spaces in the key

**3. CORS errors**
- Set proper CORS_ORIGIN in backend
- Ensure frontend domain is allowed

**4. Widget not appearing**
- Check if JavaScript is enabled
- Verify CSS is loading properly
- Check browser console for errors

**5. Messages not sending**
- Check browser network tab for failed requests
- Verify backend is receiving requests
- Check server logs for errors

### Debug Mode

Add debug logging to backend:
```javascript
console.log('Received message:', message);
console.log('Session ID:', sessionId);
console.log('AI Response:', aiResponse);
```

Add debug logging to frontend:
```javascript
console.log('Sending message:', message);
console.log('Session ID:', this.sessionId);
```

## 🔄 Updates and Maintenance

### Updating Knowledge Base
1. Edit `knowledge_base.json`
2. Restart the backend server
3. Changes take effect immediately

### Updating Deepseek Model
Change the model in `server.js`:
```javascript
const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
  model: 'deepseek-chat', // or 'deepseek-coder'
  // ... rest of config
});
```

### Monitoring
- Check server logs regularly
- Monitor API usage and costs
- Track user feedback and common questions
- Update knowledge base based on frequent queries

## 📊 Analytics (Optional Enhancement)

Add analytics tracking to understand usage:

```javascript
// In frontend
function trackEvent(event, data) {
  // Send to your analytics service
  gtag('event', event, data);
}

// Track widget opens
trackEvent('chatbot_opened', { timestamp: new Date() });

// Track messages sent
trackEvent('message_sent', { message_length: message.length });
```

## 🔐 Security Best Practices

1. **Never expose API keys in frontend code**
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Validate all user inputs**
5. **Set proper CORS policies**
6. **Use environment variables for sensitive data**
7. **Regularly update dependencies**

## 📞 Support

For issues with this chatbot implementation:
1. Check the troubleshooting section
2. Review server and browser console logs
3. Verify all configuration settings
4. Test with minimal example

For Deepseek API issues:
- Check Deepseek documentation
- Verify API key and permissions
- Check API status page

## 📄 License

This chatbot implementation is provided as-is for educational and commercial use. Make sure to comply with Deepseek's terms of service when using their API.

---

## 🎉 You're Ready!

Your chatbot is now ready to deploy. Follow these steps:

1. ✅ Set up backend with your Deepseek API key
2. ✅ Customize knowledge base with your company info
3. ✅ Deploy backend to your preferred hosting service
4. ✅ Update frontend API URL
5. ✅ Integrate widget into your website
6. ✅ Test thoroughly before going live

**Happy chatting! 🚀**