require('dotenv').config();
const express = require('express');
const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');

const dataDir = process.env.PDFMAN_DATA_DIR || path.join(__dirname, 'data');
const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function findDocument(hash) {
    try {
        const topics = await fs.readdir(dataDir, { withFileTypes: true });
        for (const dirent of topics) {
            if (dirent.isDirectory()) {
                const topicPath = path.join(dataDir, dirent.name);
                const filePath = path.join(topicPath, `${hash}.json`);
                try {
                    await fs.access(filePath);
                    return { filePath, topic: dirent.name };
                } catch (e) {}
            }
        }
    } catch (e) {
        console.error("Error finding document:", e);
    }
    return null;
}

function checkEnvironmentVariables() {
    const requiredVars = ['GEMINI_API_KEY'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
        console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }
}

function initializeExpressApp() {
    const app = express();
    app.use(cors({ origin: 'http://localhost:5173' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('public'));

    app.get('/', (req, res) => {
        res.send('<h1>PDFMan Backend</h1>');
    });

    // --- TOPIC API ---
    app.get('/api/topics', async (req, res) => {
        try {
            const files = await fs.readdir(dataDir, { withFileTypes: true });
            const topics = await Promise.all(files
                .filter(dirent => dirent.isDirectory())
                .map(async (dirent) => {
                    const topicPath = path.join(dataDir, dirent.name);
                    try {
                        const docFiles = await fs.readdir(topicPath);
                        return { name: dirent.name, doc_count: docFiles.filter(file => file.endsWith('.json')).length };
                    } catch (e) { return { name: dirent.name, doc_count: 0 }; }
                }));
            res.json(topics);
        } catch (err) { res.status(500).send('Error reading topics directory.'); }
    });

    app.post('/api/topics', async (req, res) => {
        const { topicName } = req.body;
        if (!topicName || topicName.includes('..') || topicName.includes('/')) {
            return res.status(400).send('Invalid topic name.');
        }
        const newTopicPath = path.join(dataDir, topicName);
        try {
            await fs.mkdir(newTopicPath, { recursive: true });
            res.status(201).send({ message: 'Topic created successfully.' });
        } catch (err) { res.status(500).send('Error creating topic.'); }
    });

    app.delete('/api/topics/:topicName', async (req, res) => {
        const { topicName } = req.params;
        const topicPath = path.join(dataDir, topicName);
        try {
            const files = await fs.readdir(topicPath);
            if (files.filter(file => file.endsWith('.json')).length > 0) {
                return res.status(400).send('Cannot delete topic with documents.');
            }
            await fs.rmdir(topicPath);
            res.send({ message: 'Topic deleted successfully.' });
        } catch (err) { res.status(500).send('Error deleting topic.'); }
    });

    // --- DOCUMENT API ---
    app.get('/api/topics/:topicName/documents', async (req, res) => {
        const { topicName } = req.params;
        const topicPath = path.join(dataDir, topicName);
        try {
            const files = await fs.readdir(topicPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            let documents = [];
            for (const file of jsonFiles) {
                const filePath = path.join(topicPath, file);
                const fileContent = await fs.readFile(filePath);
                documents.push(JSON.parse(fileContent));
            }
            documents.sort((a, b) => {
                if (a.year !== b.year) return (b.year || 0) - (a.year || 0);
                return (a.title || '').localeCompare(b.title || '');
            });
            res.json(documents);
        } catch (err) {
            if (err.code === 'ENOENT') return res.status(404).send('Topic not found.');
            res.status(500).send('Error reading documents directory.');
        }
    });
    
    app.get('/api/documents/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const fileContent = await fs.readFile(docInfo.filePath);
            res.json(JSON.parse(fileContent));
        } catch (err) {
            res.status(500).send('Error reading document data.');
        }
    });

    app.get('/api/pdfs/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const pdfPath = docInfo.filePath.replace(/\.json$/, '.pdf');
            res.sendFile(path.resolve(pdfPath));
        } catch (err) {
            console.error(err);
            res.status(500).send('Error sending PDF file.');
        }
    });

    app.post('/api/topics/:topicName/documents/upload', upload.single('file'), async (req, res) => {
        const { topicName } = req.params;
        if (!req.file) return res.status(400).send('No file uploaded.');
        const topicPath = path.join(dataDir, topicName);
        const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
        const jsonPath = path.join(topicPath, `${hash}.json`);
        try {
            await fs.writeFile(path.join(topicPath, `${hash}.pdf`), req.file.buffer);
            const docData = { hash, title: req.file.originalname.replace(/\.pdf$/i, ''), authors: [], year: new Date().getFullYear(), tags: [], uploadDate: new Date().toISOString() };
            await fs.writeFile(jsonPath, JSON.stringify(docData, null, 2));
            res.status(201).send(docData);
        } catch (err) { res.status(500).send('Error saving document.'); }
    });

    app.post('/api/topics/:topicName/documents/url', async (req, res) => {
        const { topicName } = req.params;
        const { url } = req.body;
        if (!url) return res.status(400).send('URL is required.');
        const topicPath = path.join(dataDir, topicName);
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const pdfBuffer = response.data;
            const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
            await fs.writeFile(path.join(topicPath, `${hash}.pdf`), pdfBuffer);
            const docData = { hash, title: path.basename(new URL(url).pathname).replace(/\.pdf$/i, '') || 'Untitled', authors: [], year: new Date().getFullYear(), tags: [], source_url: url, uploadDate: new Date().toISOString() };
            await fs.writeFile(path.join(topicPath, `${hash}.json`), JSON.stringify(docData, null, 2));
            res.status(201).send(docData);
        } catch (err) { res.status(500).send('Failed to download or save PDF from URL.'); }
    });

    app.put('/api/documents/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const fileContent = await fs.readFile(docInfo.filePath);
            let docData = { ...JSON.parse(fileContent), ...req.body };
            await fs.writeFile(docInfo.filePath, JSON.stringify(docData, null, 2));
            res.send(docData);
        } catch (err) { res.status(500).send('Error updating document.'); }
    });

    app.delete('/api/documents/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const topicPath = path.join(dataDir, docInfo.topic);
            await fs.unlink(docInfo.filePath);
            await fs.unlink(path.join(topicPath, `${hash}.pdf`));
            await fs.unlink(path.join(topicPath, `${hash}.md`)).catch(() => {});
            res.send({ message: 'Document deleted successfully.' });
        } catch (err) { res.status(500).send('Error deleting document.'); }
    });

    app.patch('/api/documents/:hash', async (req, res) => {
        const { hash } = req.params;
        const { newTopic } = req.body;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        const newTopicPath = path.join(dataDir, newTopic);
        try {
            await fs.access(newTopicPath);
            const oldTopicPath = path.join(dataDir, docInfo.topic);
            await fs.rename(docInfo.filePath, path.join(newTopicPath, `${hash}.json`));
            await fs.rename(path.join(oldTopicPath, `${hash}.pdf`), path.join(newTopicPath, `${hash}.pdf`));
            await fs.rename(path.join(oldTopicPath, `${hash}.md`), path.join(newTopicPath, `${hash}.md`)).catch(() => {});
            res.send({ message: `Document moved to ${newTopic}.` });
        } catch (err) { res.status(500).send('Error moving document.'); }
    });

    // --- SETTINGS API ---
    app.get('/api/settings', async (req, res) => {
        try {
            const settings = {
                data_folder: dataDir,
                gemini_api_key: process.env.GEMINI_API_KEY || ''
            };
            res.json(settings);
        } catch (err) {
            console.error("Error fetching settings:", err);
            res.status(500).send('Error fetching settings.');
        }
    });

    

    // --- PROMPT API ---
    app.get('/api/prompts', async (req, res) => {
        try {
            const userPromptPath = path.join(dataDir, 'userprompt.json');
            const prompts = JSON.parse(await fs.readFile(userPromptPath));
            res.json(prompts);
        } catch (err) {
            if (err.code === 'ENOENT') return res.json({}); // Return empty if file not found
            res.status(500).send('Error reading prompts.');
        }
    });

    app.post('/api/prompts', async (req, res) => {
        const { key, content } = req.body;
        if (!key || !content) return res.status(400).send('Key and content are required.');
        try {
            const userPromptPath = path.join(dataDir, 'userprompt.json');
            let prompts = {};
            try {
                prompts = JSON.parse(await fs.readFile(userPromptPath));
            } catch (e) { /* file might not exist, start with empty object */ }
            prompts[key] = content;
            await fs.writeFile(userPromptPath, JSON.stringify(prompts, null, 2));
            res.status(201).send({ message: 'Prompt saved successfully.' });
        } catch (err) {
            res.status(500).send('Error saving prompt.');
        }
    });

    app.put('/api/prompts/:promptKey', async (req, res) => {
        const { promptKey } = req.params;
        const { content } = req.body;
        if (!content) return res.status(400).send('Content is required.');
        try {
            const userPromptPath = path.join(dataDir, 'userprompt.json');
            let prompts = JSON.parse(await fs.readFile(userPromptPath));
            if (!prompts[promptKey]) return res.status(404).send('Prompt not found.');
            prompts[promptKey] = content;
            await fs.writeFile(userPromptPath, JSON.stringify(prompts, null, 2));
            res.send({ message: 'Prompt updated successfully.' });
        } catch (err) {
            res.status(500).send('Error updating prompt.');
        }
    });

    app.delete('/api/prompts/:promptKey', async (req, res) => {
        const { promptKey } = req.params;
        if (promptKey === 'summarize') {
            return res.status(403).send('The "summarize" prompt cannot be deleted.');
        }
        try {
            const userPromptPath = path.join(dataDir, 'userprompt.json');
            let prompts = JSON.parse(await fs.readFile(userPromptPath));
            if (!prompts[promptKey]) return res.status(404).send('Prompt not found.');
            delete prompts[promptKey];
            await fs.writeFile(userPromptPath, JSON.stringify(prompts, null, 2));
            res.send({ message: 'Prompt deleted successfully.' });
        } catch (err) {
            res.status(500).send('Error deleting prompt.');
        }
    });

    // --- SUMMARY API ---
    app.get('/api/summaries/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const summaryPath = path.join(path.dirname(docInfo.filePath), `${hash}.md`);
            const summaryContent = await fs.readFile(summaryPath, 'utf-8');
            res.send(summaryContent);
        } catch (err) {
            if (err.code === 'ENOENT') return res.status(404).send('Summary not found.');
            res.status(500).send('Error reading summary.');
        }
    });

    app.delete('/api/summaries/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const summaryPath = path.join(path.dirname(docInfo.filePath), `${hash}.md`);
            await fs.unlink(summaryPath);
            res.send({ message: 'Summary deleted successfully.' });
        } catch (err) {
            if (err.code === 'ENOENT') return res.status(404).send('Summary file not found.');
            res.status(500).send('Error deleting summary.');
        }
    });

    app.post('/api/summarize/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const pdfPath = path.join(path.dirname(docInfo.filePath), `${hash}.pdf`);
            const pdfData = await fs.readFile(pdfPath);
            const pdfText = (await pdf(pdfData)).text;
            let prompts;
            try {
                prompts = JSON.parse(await fs.readFile(path.join(dataDir, 'userprompt.json')));
            } catch (promptError) {
                if (promptError.code === 'ENOENT') {
                    return res.status(404).send('userprompt.json not found. Please create it in your data directory.');
                }
                console.error("Summarization error:", promptError);
                return res.status(500).send("Failed to read prompts.");
            }
            const prompt = prompts.summarize.replace('{context}', pdfText);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContentStream(prompt);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            let fullSummary = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullSummary += chunkText;
                res.write(chunkText);
            }
            const summaryPath = path.join(path.dirname(docInfo.filePath), `${hash}.md`);
            await fs.writeFile(summaryPath, fullSummary);
            res.end();
        } catch (error) {
            console.error("Summarization error:", error);
            res.status(500).send("Failed to generate summary.");
        }
    });

    app.post('/api/chat/:hash', async (req, res) => {
        const { hash } = req.params;
        const { message } = req.body;
        if (!message) return res.status(400).send('Message is required.');

        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');

        try {
            const pdfPath = path.join(path.dirname(docInfo.filePath), `${hash}.pdf`);
            const pdfData = await fs.readFile(pdfPath);
            const pdfText = (await pdf(pdfData)).text;

            // For chat, we can use a more general prompt or a specific chat prompt if defined in userprompt.json
            // For now, let's combine the PDF text and the user's message.
            const chatPrompt = `You are a helpful assistant. Answer the following question based on the provided document text.
Document Text:
'''
${pdfText}
'''

User Question: ${message}
`;
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContentStream(chatPrompt);

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                res.write(chunkText);
            }
            res.end();
        } catch (error) {
            console.error("Chat error:", error);
            res.status(500).send("Failed to generate chat response.");
        }
    });

    return app;
}

function main() {
    checkEnvironmentVariables();
    if (!fsSync.existsSync(dataDir)) {
        fsSync.mkdirSync(dataDir);
    }
    const app = initializeExpressApp();
    const server = http.createServer(app);
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

main();