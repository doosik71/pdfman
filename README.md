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
