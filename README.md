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
PORTAI_API_KEY=
PORTAI_BASE_URL=
PORTAI_MODEL=
PORTAI_TIMEOUT_MS=20000
```

You can copy `.env.example` to `.env` and replace the MongoDB URI with your actual connection string.

### AI provider health check

Use `GET /api/ai/health` to verify the backend can reach the configured AI provider.

For Ollama, the route checks the local Ollama API and reports whether the configured model is installed.

### Team setup: mock vs Ollama

This POC supports provider-based AI routing for assistant chat and two local development modes for insights.

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

#### Assistant provider routing

Use `GET /api/ai/providers/status` to fetch safe provider availability metadata for the frontend selector.

Use `POST /api/ai/chat` with a body like `{ "provider": "ollama", "message": "Show my latest spending insights" }`.

Only the provider id is sent by the browser. Secrets, base URLs, models, and API keys remain backend-only.

PortAI configuration is stored only in backend environment variables:

```env
LLM_PROVIDER=portai
PORTAI_PROVIDER_NAME=portkey
PORTAI_BASE_URL=https://portkeygateway.perficient.com/v1
PORTAI_API_KEY=your_portkey_api_key_here
PORTAI_MODEL=@aws-bedrock-use2/us.amazon.nova-micro-v1:0
PORTAI_MAX_TOKENS=512
PORTAI_HEALTH_ENDPOINT=/models
PORTAI_TIMEOUT_MS=20000
```

If PortAI is not configured, the status endpoint reports it as unavailable and the backend does not fall back silently.

The backend is now aligned to the config shape you shared for Portkey:

- `PORTAI_PROVIDER_NAME`
- `PORTAI_BASE_URL`
- `PORTAI_API_KEY`
- `PORTAI_MODEL`
- `PORTAI_MAX_TOKENS`
- `PORTAI_HEALTH_ENDPOINT`
- `PORTAI_TIMEOUT_MS`

`GET /api/ai/health` now performs a live PortAI HTTP connectivity check against the configured health endpoint and verifies whether the configured model appears in the returned model list.

When you add the `portkey-ai` package, the PortAI adapter should be switched from the temporary HTTP implementation to the SDK-based client using the same env values.

#### Automatic fallback behavior

If `LLM_PROVIDER=ollama` but Ollama is unavailable, the backend automatically falls back to mock insight generation for the existing insights flow only.

This keeps the existing insights experience working and avoids blocking teammates.

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
