# PDFMan

PDFMan is a Node.js-based web application for managing PDF documents. It features a React frontend and can be packaged as a desktop application using Electron. It also integrates with the Gemini API for summarizing PDF documents.

## Features

### Core Functionality

* **Backend:** Node.js with Express.js.
* **Frontend:** React with Vite.
* **Desktop Application:** Can be packaged using Electron.
* **Environment Check:** Verifies `GEMINI_API_KEY` and `userprompt.json` on startup.
* **UI Language:** English.
* **Code Style:** All functions have English docstrings.

### Topic List Screen

* **Management:** Add, delete, and view topics.
* **Search:** Filter topic list.
* **Display:** Topics shown as cards with document counts.
* **Deletion:** Topics can only be deleted if they contain no documents.
* **Navigation:** Selecting a topic navigates to the Document List screen.

### Document List Screen

* **Document Management:** Upload PDF files, add documents from URLs, edit metadata (title, author, year, tags), delete documents, and move documents between topics.
* **Display:** Documents are listed and sorted by year (descending) then title (ascending).
* **Drag-and-Drop:** Supports drag-and-drop for PDF uploads.
* **Navigation:** Selecting a document navigates to the Document Detail screen.

### Document Detail Screen

* **Layout:** Two-panel view with PDF content on the left and information/summary on the right.
* **PDF Viewer:** Displays PDF content using the browser's native capabilities.
* **AI Summarization:** Generates summaries of PDF content using the Gemini 2.5 Flash model. Summaries are streamed in real-time and saved as Markdown files.
* **Prompt Management:** Allows users to manage custom AI prompts (add, edit, delete).

### Settings Screen

* **Configuration:** Manage data folder path and Gemini API key.
* **Custom Prompts:** Add, edit, and delete custom prompts for AI interactions. The 'summarize' prompt is protected from deletion.

## Technologies Used

* **Backend:** Node.js, Express.js, `dotenv`, `multer`, `cors`, `axios`, `pdf-parse`, `@google/generative-ai`.
* **Frontend:** React, Vite.
* **Desktop:** Electron, `electron-builder`.

## How to Run

### Quick Start

1.  **Run Backend Server:** In the project root directory (`pdfman/`), run:
    ```bash
    npm start
    ```

2.  **Run Frontend Server:** In the `client` directory (`pdfman/client/`), run:
    ```bash
    npm run dev
    ```

### Prerequisites

* Node.js (LTS version recommended)
* npm (Node Package Manager)

### Setup

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd pdfman
    ```

2. **Install Backend Dependencies:**

    ```bash
    npm install
    ```

3. **Install Frontend Dependencies:**

    ```bash
    cd client
    npm install
    cd ..
    ```

4. **Create Environment File:**
    Create a `.env` file in the project root (`pdfman/`) and add your Gemini API Key:

    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

    (Replace `YOUR_GEMINI_API_KEY` with your actual key.)

5. **Create `userprompt.json` File:**
    Create a `userprompt.json` file in the `data` directory (`pdfman/data/`) with the following content:
    ```json
    {
    "summarize": "Please summarize the following paper.\n\nThe summary **must be written in Korean** and **must follow Markdown syntax** using a clear hierarchical structure with headings, bullet points, and formatting where appropriate.\nEnsure the content is **concise, accurate, and easy to understand** for a technical but general audience.\n\nPlease follow these formatting rules:\n\n- At the very top, display:\n  - The **paper title** on the first line as a \"#\" heading.\n  - The **author list** on the second line as plain text (comma-separated), below the title.\n\n- Then use the following summary structure:\n  - ## 🧩 Problem to Solve\n    - Clearly describe the main research problem or question the paper aims to address.\n  - ## ✨ Key Contributions\n    - List the core findings and novel contributions as bullet points.\n  - ## 📎 Related Works\n    - Mention key prior works referenced in the paper.\n  - ## 🛠️ Methodology\n    - Describe the approach or algorithm used, preferably with steps or bullet points.\n  - ## 📊 Results\n    - Summarize quantitative or qualitative results briefly.\n  - ## 🧠 Insights & Discussion\n    - Explain the implications, any limitations, or significance of the results.\n  - ## 📌 TL;DR\n    - Provide a TL;DR summary of this paper, highlighting the main problem, proposed method, and key findings.\n\n- Guidelines for writing in Markdown format:\n  1. Use braces around multi-character subscripts or superscripts in MathJax to avoid rendering errors.\n  2. Use $...$ for inline math and $$...$$ for block math to ensure compatibility with MathJax.\n  3. Do not use backticks (`) for math; use dollar signs ($) to allow proper MathJax rendering.\n\nHere is the paper content:\n\n{context}"
    }
    ```

### Running the Application

#### 1. Run the Backend Server

In the project root directory (`pdfman/`):

```bash
npm start
```

This will start the Express backend server, typically on `http://localhost:3000`.

#### 2. Run the Frontend Development Server

In a separate terminal, navigate to the `client` directory (`pdfman/client/`):

```bash
npm run dev
```

This will start the React development server, typically on `http://localhost:5173`. Open your browser to this address to access the web UI.

#### 3. Run the Electron Desktop Application (Development)

After starting the backend server, you can run the Electron app in development mode from the project root directory (`pdfman/`):

```bash
npm run electron-dev
```

### Building the Electron Desktop Application

To create a distributable desktop application, run the following command from the project root directory (`pdfman/`):

```bash
npm run build-electron
```

This command will first build the React frontend and then package the Electron application into an executable for your operating system in the `dist_electron` directory.

## Service Registration

```bash
sudo cp pdfman-server.service /etc/systemd/system/
sudo cp pdfman-client.service /etc/systemd/system/
sudo systemctl enable pdfman-server
sudo systemctl enable pdfman-client
sudo systemctl start pdfman-server
sudo systemctl start pdfman-client
sudo systemctl status pdfman-server
sudo systemctl status pdfman-client
```
