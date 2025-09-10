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

const dataDir = path.join(__dirname, 'data');
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
            res.sendFile(pdfPath);
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
            const settingsPath = path.join(dataDir, 'settings.json');
            const settings = JSON.parse(await fs.readFile(settingsPath));
            res.json(settings);
        } catch (err) {
            res.status(500).send('Error reading settings.');
        }
    });

    app.post('/api/settings', async (req, res) => {
        try {
            const settingsPath = path.join(dataDir, 'settings.json');
            const existingSettings = JSON.parse(await fs.readFile(settingsPath));
            const newSettings = { ...existingSettings, ...req.body };
            await fs.writeFile(settingsPath, JSON.stringify(newSettings, null, 2));
            res.json(newSettings);
        } catch (err) {
            res.status(500).send('Error saving settings.');
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

    app.post('/api/summarize/:hash', async (req, res) => {
        const { hash } = req.params;
        const docInfo = await findDocument(hash);
        if (!docInfo) return res.status(404).send('Document not found.');
        try {
            const pdfPath = path.join(path.dirname(docInfo.filePath), `${hash}.pdf`);
            const pdfData = await fs.readFile(pdfPath);
            const pdfText = (await pdf(pdfData)).text;
            const prompts = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'userprompt.json')));
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