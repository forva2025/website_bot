const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const pdfParse = require('pdf-parse');
const natural = require('natural');
const { v4: uuidv4 } = require('uuid');

class KnowledgeBaseManager {
    constructor() {
        this.config = null;
        this.index = new Map();
        this.documentCache = new Map();
        this.lastUpdate = null;
        this.isUpdating = false;
        this.naturalTokenizer = new natural.WordTokenizer();
    }

    async initialize() {
        try {
            // Load configuration
            const configPath = path.join(__dirname, 'knowledge_base_config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);

            // Create document directories if they don't exist
            await this.createDirectories();

            // Load existing index or create new one
            await this.loadOrCreateIndex();

            // Start auto-update if enabled
            if (this.config.indexing.auto_update) {
                this.startAutoUpdate();
            }

            console.log('Knowledge base manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize knowledge base manager:', error);
            throw error;
        }
    }

    async createDirectories() {
        const dirs = [
            this.config.sources.pdf_documents.directory,
            this.config.sources.markdown_files.directory,
            this.config.sources.text_files.directory
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.warn(`Warning: Could not create directory ${dir}:`, error.message);
                }
            }
        }
    }

    async loadOrCreateIndex() {
        const indexPath = path.join(__dirname, 'knowledge_index.json');
        
        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            this.index = new Map(JSON.parse(indexData));
            console.log(`Loaded existing index with ${this.index.size} documents`);
        } catch (error) {
            console.log('No existing index found, creating new one...');
            await this.updateIndex();
        }
    }

    async updateIndex() {
        if (this.isUpdating) {
            console.log('Index update already in progress, skipping...');
            return;
        }

        this.isUpdating = true;
        console.log('Starting knowledge base index update...');

        try {
            const newIndex = new Map();

            // Index JSON data
            if (this.config.sources.json_data.enabled) {
                await this.indexJsonData(newIndex);
            }

            // Index PDF documents
            if (this.config.sources.pdf_documents.enabled) {
                await this.indexPdfDocuments(newIndex);
            }

            // Index website content
            if (this.config.sources.website_links.enabled) {
                await this.indexWebsiteContent(newIndex);
            }

            // Index markdown files
            if (this.config.sources.markdown_files.enabled) {
                await this.indexMarkdownFiles(newIndex);
            }

            // Index text files
            if (this.config.sources.text_files.enabled) {
                await this.indexTextFiles(newIndex);
            }

            // Update index and save
            this.index = newIndex;
            this.lastUpdate = new Date();
            await this.saveIndex();

            console.log(`Index update completed. Total documents: ${this.index.size}`);
        } catch (error) {
            console.error('Index update failed:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    async indexJsonData(index) {
        try {
            const jsonPath = path.join(__dirname, this.config.sources.json_data.file_path);
            const jsonData = await fs.readFile(jsonPath, 'utf8');
            const data = JSON.parse(jsonData);

            // Index company info
            data.company_info?.forEach((item, idx) => {
                const docId = `json_company_${idx}`;
                index.set(docId, {
                    id: docId,
                    type: 'company_info',
                    title: item.topic,
                    content: item.content,
                    source: 'json_data',
                    keywords: this.extractKeywords(item.content),
                    lastUpdated: new Date().toISOString()
                });
            });

            // Index FAQ
            data.faq?.forEach((item, idx) => {
                const docId = `json_faq_${idx}`;
                index.set(docId, {
                    id: docId,
                    type: 'faq',
                    title: item.question,
                    content: item.answer,
                    source: 'json_data',
                    keywords: this.extractKeywords(item.question + ' ' + item.answer),
                    lastUpdated: new Date().toISOString()
                });
            });

            // Index pricing
            data.pricing?.forEach((item, idx) => {
                const docId = `json_pricing_${idx}`;
                index.set(docId, {
                    id: docId,
                    type: 'pricing',
                    title: item.service,
                    content: item.content,
                    source: 'json_data',
                    keywords: this.extractKeywords(item.content),
                    lastUpdated: new Date().toISOString()
                });
            });

            console.log('JSON data indexed successfully');
        } catch (error) {
            console.error('Failed to index JSON data:', error);
        }
    }

    async indexPdfDocuments(index) {
        try {
            const pdfDir = this.config.sources.pdf_documents.directory;
            const files = await this.getFilesInDirectory(pdfDir, this.config.sources.pdf_documents.supported_extensions);

            for (const file of files) {
                try {
                    const filePath = path.join(pdfDir, file);
                    const fileStats = await fs.stat(filePath);
                    
                    // Check file size limit
                    if (fileStats.size > this.config.sources.pdf_documents.max_file_size_mb * 1024 * 1024) {
                        console.warn(`PDF file ${file} exceeds size limit, skipping...`);
                        continue;
                    }

                    const docId = `pdf_${path.parse(file).name}`;
                    const content = await this.extractPdfText(filePath);
                    
                    if (content) {
                        index.set(docId, {
                            id: docId,
                            type: 'pdf',
                            title: path.parse(file).name.replace(/_/g, ' '),
                            content: content,
                            source: 'pdf_documents',
                            filePath: filePath,
                            fileSize: fileStats.size,
                            keywords: this.extractKeywords(content),
                            lastUpdated: fileStats.mtime.toISOString()
                        });
                    }
                } catch (error) {
                    console.error(`Failed to index PDF file ${file}:`, error.message);
                }
            }

            console.log(`PDF documents indexed: ${Array.from(index.values()).filter(doc => doc.type === 'pdf').length}`);
        } catch (error) {
            console.error('Failed to index PDF documents:', error);
        }
    }

    async indexWebsiteContent(index) {
        try {
            for (const source of this.config.sources.website_links.sources) {
                if (!source.scraping.enabled) continue;

                try {
                    console.log(`Indexing website: ${source.name} (${source.url})`);
                    const pages = await this.scrapeWebsite(source.url, source.scraping.max_pages);
                    
                    pages.forEach((page, idx) => {
                        const docId = `website_${source.name.replace(/\s+/g, '_')}_${idx}`;
                        index.set(docId, {
                            id: docId,
                            type: 'website',
                            title: page.title,
                            content: page.content,
                            source: 'website_links',
                            url: page.url,
                            keywords: this.extractKeywords(page.content),
                            lastUpdated: new Date().toISOString()
                        });
                    });

                    // Add delay between requests to be respectful
                    await this.delay(this.config.indexing.request_delay_ms);
                } catch (error) {
                    console.error(`Failed to index website ${source.name}:`, error.message);
                }
            }

            console.log('Website content indexed successfully');
        } catch (error) {
            console.error('Failed to index website content:', error);
        }
    }

    async indexMarkdownFiles(index) {
        try {
            const mdDir = this.config.sources.markdown_files.directory;
            const files = await this.getFilesInDirectory(mdDir, this.config.sources.markdown_files.supported_extensions);

            for (const file of files) {
                try {
                    const filePath = path.join(mdDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const fileStats = await fs.stat(filePath);
                    
                    const docId = `markdown_${path.parse(file).name}`;
                    index.set(docId, {
                        id: docId,
                        type: 'markdown',
                        title: path.parse(file).name.replace(/_/g, ' '),
                        content: content,
                        source: 'markdown_files',
                        filePath: filePath,
                        keywords: this.extractKeywords(content),
                        lastUpdated: fileStats.mtime.toISOString()
                    });
                } catch (error) {
                    console.error(`Failed to index markdown file ${file}:`, error.message);
                }
            }

            console.log(`Markdown files indexed: ${Array.from(index.values()).filter(doc => doc.type === 'markdown').length}`);
        } catch (error) {
            console.error('Failed to index markdown files:', error);
        }
    }

    async indexTextFiles(index) {
        try {
            const txtDir = this.config.sources.text_files.directory;
            const files = await this.getFilesInDirectory(txtDir, this.config.sources.text_files.supported_extensions);

            for (const file of files) {
                try {
                    const filePath = path.join(txtDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const fileStats = await fs.stat(filePath);
                    
                    const docId = `text_${path.parse(file).name}`;
                    index.set(docId, {
                        id: docId,
                        type: 'text',
                        title: path.parse(file).name.replace(/_/g, ' '),
                        content: content,
                        source: 'text_files',
                        filePath: filePath,
                        keywords: this.extractKeywords(content),
                        lastUpdated: fileStats.mtime.toISOString()
                    });
                } catch (error) {
                    console.error(`Failed to index text file ${file}:`, error.message);
                }
            }

            console.log(`Text files indexed: ${Array.from(index.values()).filter(doc => doc.type === 'text').length}`);
        } catch (error) {
            console.error('Failed to index text files:', error);
        }
    }

    async getFilesInDirectory(dirPath, extensions) {
        try {
            const files = await fs.readdir(dirPath);
            return files.filter(file => 
                extensions.some(ext => file.toLowerCase().endsWith(ext))
            );
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async extractPdfText(filePath) {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } catch (error) {
            console.error(`Failed to extract text from PDF ${filePath}:`, error.message);
            return null;
        }
    }

    async scrapeWebsite(baseUrl, maxPages) {
        const pages = [];
        const visited = new Set();
        const queue = [baseUrl];
        
        while (queue.length > 0 && pages.length < maxPages) {
            const url = queue.shift();
            
            if (visited.has(url)) continue;
            visited.add(url);
            
            try {
                const response = await axios.get(url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ChatbotBot/1.0)'
                    }
                });
                
                const $ = cheerio.load(response.data);
                
                // Extract page content
                const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
                const content = $('body').text().replace(/\s+/g, ' ').trim();
                
                if (content.length > 100) { // Only index pages with substantial content
                    pages.push({ url, title, content });
                }
                
                // Find links to other pages on the same domain
                $('a[href]').each((i, link) => {
                    const href = $(link).attr('href');
                    if (href && href.startsWith('/') || href.startsWith(baseUrl)) {
                        const fullUrl = href.startsWith('/') ? new URL(href, baseUrl).href : href;
                        if (!visited.has(fullUrl) && fullUrl.startsWith(baseUrl)) {
                            queue.push(fullUrl);
                        }
                    }
                });
                
            } catch (error) {
                console.warn(`Failed to scrape ${url}:`, error.message);
            }
        }
        
        return pages;
    }

    extractKeywords(text) {
        if (!text) return [];
        
        // Tokenize and remove common words
        const tokens = this.naturalTokenizer.tokenize(text.toLowerCase());
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
        
        const keywords = tokens
            .filter(token => token.length > 2 && !stopWords.has(token))
            .slice(0, 20); // Limit to top 20 keywords
        
        return keywords;
    }

    async search(query, maxResults = null) {
        const searchQuery = query.toLowerCase();
        const results = [];
        const maxResultsCount = maxResults || this.config.search.max_results;
        
        // Calculate relevance scores for each document
        for (const [docId, doc] of this.index) {
            let score = 0;
            
            // Keyword matching
            const queryTokens = this.naturalTokenizer.tokenize(searchQuery);
            const docKeywords = doc.keywords;
            
            for (const token of queryTokens) {
                if (docKeywords.includes(token)) {
                    score += 2; // High score for keyword matches
                }
                if (doc.title.toLowerCase().includes(token)) {
                    score += 3; // Higher score for title matches
                }
                if (doc.content.toLowerCase().includes(token)) {
                    score += 1; // Lower score for content matches
                }
            }
            
            // Boost score for exact phrase matches
            if (doc.content.toLowerCase().includes(searchQuery)) {
                score += 5;
            }
            
            if (score > 0) {
                results.push({
                    ...doc,
                    relevanceScore: score
                });
            }
        }
        
        // Sort by relevance score and return top results
        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, maxResultsCount);
    }

    async saveIndex() {
        try {
            const indexPath = path.join(__dirname, 'knowledge_index.json');
            const indexData = JSON.stringify(Array.from(this.index.entries()));
            await fs.writeFile(indexPath, indexData, 'utf8');
            console.log('Knowledge index saved successfully');
        } catch (error) {
            console.error('Failed to save knowledge index:', error);
        }
    }

    startAutoUpdate() {
        const intervalMs = this.config.indexing.update_interval_hours * 60 * 60 * 1000;
        
        setInterval(async () => {
            console.log('Auto-updating knowledge base index...');
            await this.updateIndex();
        }, intervalMs);
        
        console.log(`Auto-update scheduled every ${this.config.indexing.update_interval_hours} hours`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStats() {
        const stats = {
            totalDocuments: this.index.size,
            lastUpdate: this.lastUpdate,
            documentTypes: {},
            sources: {}
        };
        
        for (const doc of this.index.values()) {
            stats.documentTypes[doc.type] = (stats.documentTypes[doc.type] || 0) + 1;
            stats.sources[doc.source] = (stats.sources[doc.source] || 0) + 1;
        }
        
        return stats;
    }
}

module.exports = KnowledgeBaseManager; 