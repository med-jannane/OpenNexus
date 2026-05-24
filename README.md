# Open Nexus

Open Nexus is an AI-assisted network simulation platform.
It lets you design a topology visually, generate network graphs from natural language, and deploy nodes as Docker containers.

## 1) What This Project Does

Open Nexus combines:
- A visual topology editor (React Flow)
- An AI assistant (OpenAI, Ollama, or fallback heuristic)
- A deployment engine (Docker API from FastAPI)
- A live terminal panel (xterm.js UI, currently simulated execution output)

Main user workflow:
1. Create or edit a topology on the canvas.
2. Optionally ask AI to generate or extend the topology from a prompt.
3. Validate and customize node networking values (IP/CIDR/hostname/name).
4. Deploy the topology to Docker.

---

## 2) Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Flow (graph/canvas)
- xterm.js (+ fit addon)
- lucide-react (icons)

### Backend
- FastAPI
- Pydantic models/validation
- httpx (LLM HTTP calls)
- docker SDK for Python (container/network deployment)

### AI Providers
- OpenAI Chat Completions API
- Ollama Chat API (`/api/chat`)
- Built-in fallback heuristic parser (French/English device counting)

---

## 3) Repository Structure

```
OpenNexus/
  backend/
    main.py                 # Full API logic, AI generation, Docker deploy
    requirements.txt
    venv/                   # Local Python environment (if present)
  frontend/
    package.json
    index.html
    src/
      App.jsx               # Main dashboard, canvas controls, state orchestration
      main.jsx              # React entrypoint
      index.css             # Global styling (dark/brutalist)
      lib/
        api.js              # Backend API client
        topology.js         # Topology transforms, validation, auto-layout
      components/
        AssistantPanel.jsx
        NexusNode.jsx
        TerminalPanel.jsx
```

---

## 4) Core Concepts and Data Model

The topology follows this structure:

```json
{
  "nodes": [
    {
      "id": "1",
      "type": "router",
      "position": { "x": 0, "y": 0 },
      "name": "Router-1",
      "hostname": "router-1",
      "ip_address": "172.28.0.10",
      "cidr": "172.28.0.0/24",
      "subnet_group": 0
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" }
  ]
}
```

### Node Types used in UI and generation
- firewall
- router
- switch
- pc
- server
- sql-server
- subnet

---

## 5) Frontend Logic (How It Works)

### 5.1 Canvas and graph editing
The dashboard is controlled by `App.jsx`.
It manages:
- nodes and edges state
- selected node/edge
- wiring mode (manual cable mode)
- auto-layout trigger
- node/edge deletion

Ways to add nodes:
- Click a palette item
- Drag-and-drop a palette item into the canvas

Ways to add edges:
- Standard React Flow connect interaction
- Manual wiring mode (select source node, then target node)

Editing features:
- Edit node display name
- Edit hostname
- Edit IP address
- Edit CIDR
- Delete selected node
- Delete selected edge

### 5.2 Real-time validation
`topology.js` validates network fields live:
- IPv4 syntax checks
- CIDR syntax checks
- duplicate IP detection

Deployment is blocked until validation errors are fixed.

### 5.3 Auto-layout
Auto-layout computes graph levels from edge directions and repositions nodes into clean columns and rows.

### 5.4 AI panel behavior
The assistant panel provides:
- Prompt input
- Quick prompts
- AI provider/model settings
- Optional endpoint/API key
- "Append to current network" option

When append mode is enabled, the current topology is sent to backend and merged with generated topology.

### 5.5 Terminal panel
The terminal panel is rendered with xterm.js.
- It displays selected node context (hostname, IP, mapped container)
- Commands currently produce simulated output in UI
- The component handles resize safely using `ResizeObserver` and delayed open to prevent xterm dimension errors

---

## 6) Backend Logic (How It Works)

All backend logic is implemented in `backend/main.py`.

### 6.1 API routes
- `GET /` basic service info
- `GET /health` health check
- `POST /generate-topology` AI/fallback generation
- `POST /deploy` Docker deployment

### 6.2 Topology generation path
`POST /generate-topology` accepts:
- `prompt`
- `append_to_current` (bool)
- `current_topology` (optional)
- `llm_config` (optional manual provider/model/endpoint/key)

Generation flow:
1. Resolve provider config (`openai`, `ollama`, `fallback`)
2. Build strict JSON instruction prompt
3. Call provider API
4. Parse/validate into `NetworkTopology`
5. On provider/parse failure, fallback to heuristic generation

If append mode is enabled, backend merges generated topology into current topology:
- remaps IDs on collisions
- remaps edges accordingly
- creates a bridge edge from old graph tail to new graph head

### 6.3 Heuristic AI fallback
Fallback parser supports French/English counts and device keywords.
It can extract counts for routers, switches, PCs, servers, and subnets from phrases like:
- "deux pc"
- "2 switches"
- "1 routeur"

### 6.4 Docker deployment path
`POST /deploy` flow:
1. Create isolated Docker bridge network with IPAM (`172.28.0.0/16` by default)
2. For each node:
   - resolve and validate IP
   - create Alpine container (`sleep infinity`)
   - set labels and env vars with node metadata
   - connect to network with static IPv4 and aliases
3. Return network name + per-node container mapping

Robustness:
- Handles duplicate container names (`409`)
- Handles invalid/duplicate IPs (`422`/`409`)
- Handles Docker unavailable (`503`)
- Rolls back created resources on failure

---

## 7) AI Provider Configuration

Open Nexus can be configured from UI or environment.

### 7.1 Ollama (recommended local AI)
1. Install Ollama
2. Pull model:

```powershell
ollama pull llama3
```

3. Ensure Ollama service is running (usually background service on Windows)
4. In Open Nexus AI settings:
- Provider: `ollama`
- Model: `llama3` or `llama3:latest`
- Base URL: leave empty (defaults to `http://localhost:11434`) or set manually

### 7.2 OpenAI
Set in UI or env:
- Provider: `openai`
- Model: e.g. `gpt-4o`
- API key: your key
- Endpoint: optional (`https://api.openai.com/v1` default)

### 7.3 Environment variables (optional)
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_API_BASE`
- `OLLAMA_BASE_URL` or `OLLAMA_HOST`
- `OLLAMA_MODEL`
- `OPEN_NEXUS_DOCKER_SUBNET`

---

## 8) How To Run (Local Development)

### 8.1 Backend

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you do not have `backend/venv`, create one and install dependencies:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 8.2 Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 8.3 Access URLs
- Frontend: `http://localhost:5173`
- Backend root: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

---

## 9) API Quick Reference

### POST `/generate-topology`
Example request:

```json
{
  "prompt": "Create a network with 2 PCs and 1 switch",
  "append_to_current": true,
  "current_topology": { "nodes": [], "edges": [] },
  "llm_config": {
    "provider": "ollama",
    "model": "llama3:latest",
    "endpoint": "http://localhost:11434",
    "api_key": null
  }
}
```

Response: `NetworkTopology` JSON.

### POST `/deploy`
Example request:

```json
{
  "project_name": "open-nexus",
  "topology": {
    "nodes": [
      { "id": "1", "type": "router", "position": { "x": 120, "y": 80 } }
    ],
    "edges": []
  }
}
```

Example response:

```json
{
  "network_name": "open-nexus-a1b2c3d4",
  "containers": [
    {
      "node_id": "1",
      "container_name": "open-nexus-1-router",
      "ip_address": "172.28.0.10",
      "hostname": "router"
    }
  ]
}
```

---

## 10) Current Limitations

- Terminal panel currently simulates shell output in frontend (not yet true websocket/exec stream from Docker).
- Auto-layout is lightweight and not yet using an external graph layout engine.
- AI quality depends on selected provider/model and prompt clarity.

---

## 11) Troubleshooting

### `http://localhost:8000` returns `Not Found`
A root route exists in current backend; if you still see 404, restart backend server.

### `npm run dev` says script missing
Run command inside `frontend` or use:

```powershell
npm --prefix c:\Users\map45\OpenNexus\frontend run dev
```

### Ollama bind error on `ollama serve`
If port 11434 is already in use, Ollama is likely already running in background. Use:

```powershell
ollama list
ollama run llama3
```

### Docker deploy fails
- Ensure Docker Desktop is running
- Ensure no container name collisions
- Check IP/CIDR validation in UI

---

## 12) Suggested Next Improvements

- Real terminal execution stream from backend to xterm.js
- Persist topologies (database + projects)
- Add authentication and multi-user workspaces
- Add import/export for topologies (JSON files)
- Add graph history/undo-redo

---

## 13) Project Status

This repository currently contains a functional MVP with:
- AI-assisted topology generation
- Visual editing and validation
- Docker-based deployment
- Dark/brutalist dashboard UI

It is ready for iterative improvement toward a production-grade network simulation platform.
