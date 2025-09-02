# 🚀 Enhanced Knowledge Base System

This enhanced knowledge base system allows your chatbot to access and search through multiple types of information sources including PDFs, websites, markdown files, text files, and structured JSON data.

## ✨ Features

- **Multi-format Support**: PDFs, websites, markdown, text files, and JSON
- **Intelligent Indexing**: Automatic content extraction and keyword generation
- **Smart Search**: Relevance-based search with semantic understanding
- **Auto-updates**: Scheduled indexing of new content
- **Web Scraping**: Automatic website content indexing
- **PDF Text Extraction**: Convert PDF content to searchable text
- **Natural Language Processing**: Advanced keyword extraction and search

## 📁 Directory Structure

```
website_bot/
├── documents/
│   ├── pdfs/           # PDF documents
│   ├── markdown/       # Markdown files
│   └── text/          # Text files
├── knowledge_base.json # Structured company data
├── knowledge_base_config.json # Configuration file
├── knowledge_base_manager.js  # Core manager class
└── knowledge_index.json      # Generated search index
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env` with your settings:
```bash
DEEPSEEK_API_KEY=your_actual_api_key
CORS_ORIGIN=https://yourwebsite.com
```

### 3. Configure Knowledge Base Sources

Edit `knowledge_base_config.json` to specify your information sources:

```json
{
  "sources": {
    "website_links": {
      "sources": [
        {
          "name": "Your Company Website",
          "url": "https://yourcompany.com",
          "scraping": {
            "enabled": true,
            "max_pages": 100
          }
        }
      ]
    }
  }
}
```

### 4. Add Your Documents

Place your documents in the appropriate directories:

- **PDFs**: `documents/pdfs/`
- **Markdown**: `documents/markdown/`
- **Text files**: `documents/text/`

### 5. Start the Server

```bash
npm start
```

The system will automatically index all your documents on startup.

## 📚 Adding Content

### PDF Documents

Simply place PDF files in `documents/pdfs/`. The system will:
- Extract text content automatically
- Generate keywords for search
- Index the content for chatbot queries

**Supported formats**: `.pdf`

**Size limit**: Configurable (default: 50MB)

### Website Content

Configure websites in `knowledge_base_config.json`:

```json
{
  "name": "Documentation Site",
  "url": "https://docs.yourcompany.com",
  "scraping": {
    "enabled": true,
    "max_pages": 200,
    "update_interval_hours": 6
  }
}
```

The system will:
- Crawl the website automatically
- Extract page content and titles
- Follow internal links (respecting robots.txt)
- Update content periodically

### Markdown Files

Place `.md` or `.markdown` files in `documents/markdown/`:

```markdown
# Service Guide

Our services include:
- Web Development
- Mobile Apps
- AI Integration
```

### Text Files

Place `.txt` or `.text` files in `documents/text/`:

```
Company Policies
===============

1. Working Hours: 9 AM - 6 PM EST
2. Contact: support@company.com
```

## 🔍 Using the Knowledge Base

### API Endpoints

#### Search Knowledge Base
```bash
GET /api/knowledge/search?q=web development&limit=5
```

#### Get Statistics
```bash
GET /api/knowledge/stats
```

#### Manual Update
```bash
POST /api/knowledge/update
```

### Chatbot Integration

The chatbot automatically searches the knowledge base when users ask questions. It will:

1. Search across all document types
2. Find the most relevant content
3. Provide context to the AI
4. Reference sources in responses

Example chatbot response:
> "Based on our service manual, we offer web development packages starting from $2,999. According to our company policies, we provide 24/7 support for critical client issues."

## ⚙️ Configuration Options

### Update Intervals

```json
{
  "indexing": {
    "auto_update": true,
    "update_interval_hours": 6
  }
}
```

### Search Settings

```json
{
  "search": {
    "max_results": 5,
    "relevance_threshold": 0.3,
    "enable_semantic_search": true
  }
}
```

### Website Scraping

```json
{
  "website_links": {
    "sources": [
      {
        "scraping": {
          "max_pages": 100,
          "update_interval_hours": 12
        }
      }
    ]
  }
}
```

## 🚀 Management Commands

### Update Knowledge Base Index
```bash
npm run index
```

### View Statistics
```bash
npm run stats
```

### Start Development Mode
```bash
npm run dev
```

## 📊 Monitoring and Maintenance

### Check Knowledge Base Status

```bash
curl http://localhost:3000/api/knowledge/stats
```

### Monitor Indexing Progress

The system logs all indexing activities:
```
[INFO] Starting knowledge base index update...
[INFO] PDF documents indexed: 5
[INFO] Website content indexed successfully
[INFO] Index update completed. Total documents: 25
```

### Performance Optimization

- **Large PDFs**: Consider splitting into smaller files
- **Website Updates**: Adjust update intervals based on content change frequency
- **Search Performance**: Limit max results and adjust relevance thresholds

## 🔒 Security Considerations

### File Upload Security
- PDF files are processed locally
- No executable files are allowed
- File size limits are enforced

### Website Scraping
- Respects robots.txt
- Includes delays between requests
- Uses proper user agent headers

### Access Control
- Knowledge base endpoints can be protected with authentication
- Rate limiting prevents abuse
- CORS settings control access origins

## 🐛 Troubleshooting

### Common Issues

#### 1. PDF Text Extraction Fails
- Ensure PDF is not password-protected
- Check if PDF contains actual text (not just images)
- Verify file size is within limits

#### 2. Website Scraping Issues
- Check if website blocks automated access
- Verify URL is accessible
- Check network connectivity

#### 3. Search Not Working
- Ensure documents are properly indexed
- Check file permissions
- Verify configuration file syntax

### Debug Mode

Enable debug logging in your `.env`:
```bash
LOG_LEVEL=debug
```

### Manual Indexing

Force a manual index update:
```bash
curl -X POST http://localhost:3000/api/knowledge/update
```

## 📈 Scaling Considerations

### For Large Document Collections
- Increase `max_concurrent_requests` in config
- Adjust `update_interval_hours` for less frequent updates
- Consider using a database instead of file-based storage

### For High-Traffic Websites
- Implement caching for search results
- Use CDN for static document delivery
- Consider distributed indexing across multiple servers

## 🔄 Migration from Basic System

If you're upgrading from the basic knowledge base:

1. **Backup** your existing `knowledge_base.json`
2. **Install** new dependencies: `npm install`
3. **Configure** `knowledge_base_config.json`
4. **Restart** the server
5. **Verify** indexing completed successfully

## 📞 Support

For issues with the enhanced knowledge base:

1. Check the troubleshooting section
2. Review server logs for error messages
3. Verify configuration file syntax
4. Test with minimal document set

## 🎯 Best Practices

### Document Organization
- Use descriptive filenames
- Organize by topic or department
- Keep file sizes reasonable
- Update content regularly

### Configuration
- Start with conservative scraping limits
- Monitor system performance
- Adjust update intervals based on needs
- Test configuration changes in development

### Content Quality
- Ensure documents are well-structured
- Use clear headings and sections
- Include relevant keywords naturally
- Keep information current and accurate

---

## 🎉 You're Ready!

Your enhanced knowledge base is now configured to handle:
- ✅ PDF documents
- ✅ Website content
- ✅ Markdown files
- ✅ Text files
- ✅ Structured JSON data
- ✅ Automatic indexing
- ✅ Smart search
- ✅ Regular updates

The chatbot will now provide much more comprehensive and accurate responses based on all your available information sources! 