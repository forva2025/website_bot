# 🚀 Deployment Guide

This guide covers multiple deployment options for your Deepseek chatbot.

## 🏠 Local Development

```bash
# 1. Clone/setup your project
mkdir deepseek-chatbot && cd deepseek-chatbot

# 2. Copy all the provided files
# - package.json
# - server.js  
# - knowledge_base.json
# - .env.example

# 3. Install dependencies
npm install

# 4. Setup environment
cp .env.example .env
# Edit .env with your Deepseek API key

# 5. Start development server
npm run dev

# 6. Test the API
npm run test
```

## ☁️ Cloud Deployment Options

### Option 1: Heroku (Easiest)

1. **Prepare for Heroku:**
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Create .gitignore
cat > .gitignore << EOF
node_modules/
.env
*.log
.DS_Store
EOF
```

2. **Deploy to Heroku:**
```bash
# Install Heroku CLI first
heroku login
heroku create your-chatbot-name

# Set environment variables
heroku config:set DEEPSEEK_API_KEY=your_api_key
heroku config:set NODE_ENV=production

# Deploy
git init
git add .
git commit -m "Initial deploy"
git push heroku main
```

3. **Your API will be available at:**
`https://your-chatbot-name.herokuapp.com/api`

### Option 2: Vercel (Serverless)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Create vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "DEEPSEEK_API_KEY": "@deepseek-api-key"
  }
}
```

3. **Deploy:**
```bash
vercel --prod
# Follow the prompts
# Add your API key in Vercel dashboard
```

### Option 3: Railway

1. **Connect GitHub repository to Railway**
2. **Set environment variables in Railway dashboard:**
   - `DEEPSEEK_API_KEY`
   - `NODE_ENV=production`
3. **Deploy automatically from GitHub**

### Option 4: DigitalOcean App Platform

1. **Create App Spec (app.yaml):**
```yaml
name: deepseek-chatbot
services:
- name: api
  source_dir: /
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DEEPSEEK_API_KEY
    value: your_api_key
    type: SECRET
  - key: NODE_ENV
    value: production
  http_port: 3000
```

2. **Deploy via DigitalOcean dashboard or CLI**

### Option 5: AWS (Advanced)

#### Using AWS Lambda + API Gateway

1. **Install Serverless Framework:**
```bash
npm install -g serverless
serverless create --template aws-nodejs --path deepseek-chatbot-lambda
```

2. **Create serverless.yml:**
```yaml
service: deepseek-chatbot
frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DEEPSEEK_API_KEY: ${env:DEEPSEEK_API_KEY}

functions:
  api:
    handler: lambda.handler
    events:
      - httpApi: '*'

plugins:
  - serverless-offline
```

3. **Create lambda.js:**
```javascript
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
```

#### Using EC2

1. **Launch EC2 instance (Ubuntu 20.04)**
2. **Connect and setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone your repository
git clone your-repo-url
cd your-repo

# Install dependencies
npm install --production

# Create ecosystem file for PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'deepseek-chatbot',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DEEPSEEK_API_KEY: 'your_api_key'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/chatbot
```

3. **Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Optional: Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🐳 Docker Deployment

### Basic Docker

1. **Build and run:**
```bash
# Build image
docker build -t deepseek-chatbot .

# Run container
docker run -p 3000:3000 -e DEEPSEEK_API_KEY=your_api_key deepseek-chatbot
```

### Docker Compose

1. **Create .env file:**
```bash
DEEPSEEK_API_KEY=your_api_key
CORS_ORIGIN=https://yourwebsite.com
```

2. **Run with compose:**
```bash
docker-compose up -d
```

### Docker Swarm (Production)

```bash
# Initialize swarm
docker swarm init

# Create secret
echo "your_api_key" | docker secret create deepseek_api_key -

# Deploy stack
docker stack deploy -c docker-compose.yml chatbot-stack
```

## 🌐 Frontend Deployment

### Option 1: Same Server
Simply serve your HTML files from the same server as your API.

### Option 2: CDN (Recommended)
Host your chatbot widget on a CDN:

1. **Prepare widget file:**
```javascript
// Create chatbot-widget.js (without HTML wrapper)
(function() {
    const API_URL = 'https://your-api-domain.com/api';
    
    // Insert all the chatbot JavaScript code here
    // ... (chatbot implementation)
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
```

2. **Upload to CDN (Cloudflare, AWS CloudFront, etc.)**

3. **Include in websites:**
```html
<script src="https://your-cdn.com/chatbot-widget.js"></script>
```

### Option 3: NPM Package
Create an npm package for easy installation:

```json
{
  "name": "@yourcompany/chatbot-widget",
  "version": "1.0.0",
  "main": "dist/chatbot.js",
  "files": ["dist/"]
}
```

## 📊 Monitoring & Logging

### Application Monitoring

1. **PM2 Monitoring:**
```bash
pm2 monit
pm2 logs deepseek-chatbot
```

2. **Custom Health Monitoring:**
```javascript
// Add to server.js
const os = require('os');

app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: os.loadavg(),
        timestamp: new Date().toISOString()
    });
});
```

### Error Tracking

1. **Add error tracking service:**
```bash
npm install @sentry/node
```

2. **Initialize in server.js:**
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: 'your-sentry-dsn'
});

app.use(Sentry.Handlers.errorHandler());
```

### Logging

1. **Add Winston logging:**
```bash
npm install winston
```

2. **Setup logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Use HTTPS in production
- [ ] Set proper CORS origins (not `*`)
- [ ] Implement rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Keep dependencies updated
- [ ] Use a reverse proxy (Nginx)
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

### Security Headers

```javascript
// Add to server.js
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    next();
});
```

## 🚀 Post-Deployment

### 1. Test Everything
```bash
# Test health endpoint
curl https://your-domain.com/api/health

# Test chat initialization
curl -X POST https://your-domain.com/api/chat/init
```

### 2. Update Frontend URLs
Update the `apiUrl` in your chatbot widget to point to your deployed backend.

### 3. Monitor Performance
- Check response times
- Monitor error rates
- Track API usage and costs
- Monitor server resources

### 4. Setup Backup Strategy
- Database backups (if using one)
- Configuration backups
- Regular data exports

## 🔄 Updates and Maintenance

### Rolling Updates
```bash
# Zero-downtime updates with PM2
pm2 reload ecosystem.config.js

# Docker updates
docker-compose pull
docker-compose up -d
```

### Automated Deployments
Set up CI/CD with GitHub Actions, GitLab CI, or similar.

## 📞 Troubleshooting

### Common Issues

1. **CORS errors**: Check CORS_ORIGIN environment variable
2. **API key issues**: Verify DEEPSEEK_API_KEY is set correctly
3. **Port conflicts**: Ensure PORT environment variable is set
4. **Memory issues**: Monitor and increase server resources if needed
5. **Rate limiting**: Adjust rate limits or upgrade API plan

### Debug Commands
```bash
# Check logs
docker-compose logs -f chatbot-backend
pm2 logs deepseek-chatbot

# Check service status
systemctl status nginx
pm2 status

# Test connectivity
nc -zv your-domain.com 80
nc -zv your-domain.com 443
```

---

Choose the deployment method that best fits your needs and infrastructure. For most users, Heroku or Vercel provides the easiest getting started experience, while AWS or DigitalOcean offers more control and potentially lower costs at scale.