# Personal Finance Tracker Backend

This is the backend service for the **Personal Finance Tracker** application, built with **Node.js**. It provides APIs to manage user accounts, transactions, budgets, and reports.

## Tech Stack

- Node.js
- Express (or similar HTTP framework)
- JSON-based REST APIs
- npm for dependency management

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Running the Server

```bash
npm start
```

Or, if you use a dev script:

```bash
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with the necessary configuration, for example:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
USE_MOCK_DATA=false
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5
OLLAMA_TIMEOUT_MS=20000
```

You can copy `.env.example` to `.env` and replace the MongoDB URI with your actual connection string.

### AI provider health check

Use `GET /api/ai/health` to verify the backend can reach the configured AI provider.

For Ollama, the route checks the local Ollama API and reports whether the configured model is installed.

### Team setup: mock vs Ollama

This POC supports two local development modes.

#### Option 1: Run with Ollama

Use this when Ollama is installed locally.

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5
OLLAMA_TIMEOUT_MS=20000
```

Then pull the model locally:

```bash
ollama pull qwen2.5
```

#### Option 2: Run without Ollama

Use this when a teammate does not have Ollama installed.

```env
LLM_PROVIDER=mock
```

The backend contract stays the same. The app returns deterministic mock insights instead of local model output.

#### Automatic fallback behavior

If `LLM_PROVIDER=ollama` but Ollama is unavailable, the backend automatically falls back to mock insight generation.

This keeps the frontend working and avoids blocking teammates.

## Scripts

Common npm scripts (adjust based on your actual `package.json`):

- `npm start` – start the production server
- `npm run dev` – start the development server with hot reload (e.g., using nodemon)
- `npm test` – run tests (if configured)

## Project Structure

Typical structure (adjust based on your actual layout):

```text
src/
  index.js          # App entry point
  routes/           # Route definitions
  controllers/      # Request handlers
  models/           # Data models / ORM schemas
  services/         # Business logic
  config/           # Configuration and utilities
```

## License

This project is open source. You can add a specific license here (e.g., MIT) if desired.
