# PDFMan Development Tasks

## Project Setup & Core Backend
- [x] Initialize Node.js project (`npm init`)
- [x] Set up Express server (`server.js`)
- [x] Install dependencies: `express`, `axios`, `dotenv`, `nodemon`, `pdf-parse`, `@google/generative-ai`, `xml2js`, `multer`, `cors`
- [x] Configure `nodemon` for auto-restarting the server during development.
- [x] Implement startup check for `GEMINI_API_KEY`.
- [x] Set up basic routing for API.
- [x] Implement data management structure (topics as folders, documents as JSON).
- [x] Create default `data` directory.
- [ ] Create default `userprompt.json` file.

## Frontend Setup (React + Vite)
- [x] Set up React project using Vite.
- [x] Install dependencies: `react`, `react-dom`.
- [x] Structure frontend folders (`src`, `components`, `pages`).
- [x] Implement basic layout with a collapsible side menu.

## API Endpoint Development
- [x] **Topics API:**
    - [x] `GET /api/topics`: List all topics with document counts.
    - [x] `POST /api/topics`: Create a new topic.
    - [x] `DELETE /api/topics/:topicName`: Delete a topic.
- [x] **Documents API:**
    - [x] `GET /api/topics/:topicName/documents`: Get documents for a topic.
    - [x] `POST /api/topics/:topicName/documents/upload`: Upload a PDF file.
    - [ ] `POST /api/topics/:topicName/documents/url`: Add a document from a URL.
    - [x] `PUT /api/documents/:hash`: Update document details (title, author, year, tags).
    - [x] `DELETE /api/documents/:hash`: Delete a document.
    - [x] `PATCH /api/documents/:hash`: Move a document to another topic.
- [ ] **AI Summary API:**
    - [ ] `POST /api/summarize/:hash`: Generate and stream summary for a document.
    - [ ] `DELETE /api/summarize/:hash`: Delete a summary file.
- [ ] **Settings API:**
    - [ ] `GET /api/settings`: Get current settings (data path, API key).
    - [ ] `POST /api/settings`: Update settings.
    - [ ] `GET /api/prompts`: Get user prompts.
    - [ ] `POST /api/prompts`: Update user prompts.

## Frontend Feature Implementation
- [x] **Topic List Page:**
    - [x] Fetch and display topics as cards.
    - [ ] Implement search/filter functionality.
    - [ ] Implement form to add a new topic.
    - [ ] Implement topic deletion with confirmation and error handling.
    - [ ] Navigate to Document List on topic click.
- [ ] **Document List Page:**
    - [ ] Display current topic name and "Back to Topics" link.
    - [ ] Fetch and display list of documents.
    - [ ] Implement sorting (default: year, then title) and searching.
    - [ ] Implement UI for uploading PDFs (file & URL).
    - [ ] Implement inline editing for document metadata.
    - [ ] Implement document deletion and moving.
    - [ ] Navigate to Document Detail on document click.
- [ ] **Document Detail Page:**
    - [ ] Create two-panel layout.
    - [ ] Left Panel: Implement a PDF viewer.
    - [ ] Right Panel (Top): Display document info.
    - [ ] Right Panel (Middle):
        - [ ] Display summary or "Summarize" button.
        - [ ] Trigger summary generation on button click.
        - [ ] Render streamed Markdown summary in real-time.
        - [ ] Add MathJax support for formulas.
        - [ ] Implement summary deletion.
    - [ ] Right Panel (Bottom): Implement AI chat interface.
    - [ ] Side Menu: Display table of contents from summary.
- [ ] **Settings Page:**
    - [ ] Create form to set data folder path.
    - [ ] Create form to set `GEMINI_API_KEY`.
    - [ ] Implement UI to manage custom prompts.

## Electron Packaging
- [ ] Install `electron` and `electron-builder`.
- [ ] Create `main.js` for the Electron main process.
- [ ] Configure `package.json` for building the app.
- [ ] Test packaging for different platforms.

## Finalization
- [ ] Ensure all UI text is in English.
- [x] Add English docstrings to all functions.
- [ ] Code cleanup and refactoring.
- [ ] Final testing and bug fixing.