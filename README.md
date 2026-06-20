# Social Media Content Generator

AI-powered social media content generator that exports posts as a CSV ready to import into GoHighLevel Social Planner Advanced.

## Setup

```bash
# 1. Install dependencies for both client and server
npm install

# 2. Copy env template and fill in keys
cp .env.example .env

# 3. Run client + server together (dev mode)
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Project layout

```
/client    React + Vite + Tailwind frontend
/server    Express + TypeScript API
```

In production, the server serves the built client as static files, so the whole app deploys as one Coolify service.
