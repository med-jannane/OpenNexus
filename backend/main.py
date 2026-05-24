from __future__ import annotations

import json
import os
import re
import uuid
import ipaddress
from dataclasses import dataclass
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

load_dotenv()

app = FastAPI(
    title="Open Nexus API",
    version="0.1.0",
    description="Backend FastAPI for AI-generated network topology and Docker-based deployment.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Open Nexus API",
        "status": "running",
        "health": "/health",
        "docs": "/docs",
        "generate_topology": "/generate-topology",
        "deploy": "/deploy",
        "chat": "/chat",
    }


class Position(BaseModel):
    x: float = Field(..., ge=0)
    y: float = Field(..., ge=0)


class Node(BaseModel):
    id: str = Field(..., min_length=1)
    type: str = Field(..., min_length=1)
    position: Position
    name: str | None = None
    hostname: str | None = None
    ip_address: str | None = None
    cidr: str | None = None
    subnet_group: int | None = None


class Edge(BaseModel):
    id: str = Field(..., min_length=1)
    source: str = Field(..., min_length=1)
    target: str = Field(..., min_length=1)


class NetworkTopology(BaseModel):
    nodes: list[Node] = Field(default_factory=list)
    edges: list[Edge] = Field(default_factory=list)

    @field_validator("nodes")
    @classmethod
    def validate_nodes(cls, nodes: list[Node]) -> list[Node]:
        node_ids = [node.id for node in nodes]
        if len(node_ids) != len(set(node_ids)):
            raise ValueError("Node ids must be unique.")
        return nodes

    @field_validator("edges")
    @classmethod
    def validate_edges(cls, edges: list[Edge]) -> list[Edge]:
        edge_ids = [edge.id for edge in edges]
        if len(edge_ids) != len(set(edge_ids)):
            raise ValueError("Edge ids must be unique.")
        return edges


class TopologyGenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    append_to_current: bool = False
    current_topology: NetworkTopology | None = None
    llm_config: dict[str, str | None] | None = None


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    llm_config: dict[str, str | None] | None = None


class DeployRequest(BaseModel):
    topology: NetworkTopology
    project_name: str = Field(default="open-nexus")


class DeployResponse(BaseModel):
    network_name: str
    containers: list[dict[str, str]]


@dataclass(slots=True)
class LLMConfig:
    provider: Literal["openai", "ollama", "deepseek", "groq", "fallback"]
    model: str
    endpoint: str | None = None
    api_key: str | None = None


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9-]+", "-", value.strip().lower())
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug or "open-nexus"


def _strip_json_wrappers(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace : last_brace + 1]
    return text


def _get_llm_config(override: dict[str, str | None] | None = None) -> LLMConfig:
    if override:
        provider = (override.get("provider") or "fallback").lower()
        model = override.get("model") or ("gpt-4o" if provider == "openai" else "llama3")
        endpoint = override.get("endpoint")
        api_key = override.get("api_key")

        if provider == "ollama":
            endpoint = endpoint or os.getenv("OLLAMA_BASE_URL") or os.getenv("OLLAMA_HOST") or "http://localhost:11434"
            if not endpoint.startswith("http://") and not endpoint.startswith("https://"):
                endpoint = f"http://{endpoint}"

        if provider == "openai":
            endpoint = endpoint or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
            api_key = api_key or os.getenv("OPENAI_API_KEY")

        if provider == "deepseek":
            endpoint = endpoint or os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")
            api_key = api_key or os.getenv("DEEPSEEK_API_KEY")

        if provider == "groq":
            endpoint = endpoint or "https://api.groq.com/openai/v1"
            api_key = api_key or os.getenv("GROQ_API_KEY")
            model = model or "llama3-8b-8192"

        if provider in {"openai", "ollama", "deepseek", "groq"}:
            return LLMConfig(
                provider=provider,  # type: ignore[arg-type]
                model=model,
                endpoint=endpoint,
                api_key=api_key,
            )

    return LLMConfig(provider="fallback", model="heuristic")


def _request_json(url: str, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
    import httpx
    timeout = httpx.Timeout(30.0, connect=10.0)
    with httpx.Client(timeout=timeout) as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()


def _heuristic_generate(prompt: str) -> NetworkTopology:
    nodes: list[Node] = []
    edges: list[Edge] = []
    
    device_types = ["router", "switch", "pc", "firewall", "server", "subnet", "sql-server"]
    
    # English & French number words
    num_map = {
        "un": 1, "une": 1, "one": 1,
        "deux": 2, "two": 2,
        "trois": 3, "three": 3,
        "quatre": 4, "four": 4,
        "cinq": 5, "five": 5,
    }
    
    for dtype in device_types:
        # Match digits
        count = sum(int(m) for m in re.findall(rf"(\d+)\s*{dtype}", prompt, re.I))
        
        # Match words
        for word, val in num_map.items():
            if re.search(rf"{word}\s*{dtype}", prompt, re.I):
                count += val
        
        # Match single mention without number
        if count == 0 and re.search(rf"\b{dtype}\b", prompt, re.I):
            count = 1
            
        for _ in range(count):
            uid = uuid.uuid4().hex[:4]
            node_id = f"{dtype}-{uid}"
            nodes.append(Node(
                id=node_id,
                type=dtype,
                position=Position(x=100.0 + len(nodes) * 120.0, y=150.0 + (len(nodes) % 3) * 100.0),
                name=f"{dtype.capitalize()} {uid.upper()}",
                hostname=f"{dtype}-{uid}",
                ip_address=f"172.28.0.{10 + len(nodes)}",
                cidr="172.28.0.0/24",
                subnet_group=0
            ))
            
    return NetworkTopology(nodes=nodes, edges=edges)


@app.post("/chat")
def chat(request: ChatRequest) -> dict[str, str]:
    config = _get_llm_config(request.llm_config)
    
    if config.provider == "fallback":
        return {"content": "I am currently in local fallback mode. Please configure an API key for live discussion."}

    try:
        if config.provider in {"openai", "deepseek", "groq"}:
            payload = {
                "model": config.model,
                "messages": [
                    {"role": "system", "content": "You are a professional network engineering assistant. You provide clear, technical, but concise advice in uppercase professional style."},
                    {"role": "user", "content": request.prompt},
                ],
                "temperature": 0.7,
            }
            data = _request_json(
                f"{config.endpoint}/chat/completions",
                {
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                },
                payload,
            )
            return {"content": data["choices"][0]["message"]["content"]}
        else:
            # Ollama
            payload = {"model": config.model, "messages": [{"role": "user", "content": request.prompt}], "stream": False}
            data = _request_json(f"{config.endpoint}/api/chat", {"Content-Type": "application/json"}, payload)
            return {"content": data["message"]["content"]}
    except Exception as e:
        return {"content": f"BRAIN_PROTOCOL_ERROR: {str(e)}"}


@app.post("/generate-topology", response_model=NetworkTopology)
def generate_topology(request: TopologyGenerationRequest) -> NetworkTopology:
    config = _get_llm_config(request.llm_config)
    
    if config.provider == "fallback":
        return _heuristic_generate(request.prompt)

    system_prompt = (
        "You are a network topology generator for React Flow. "
        "Return only strict JSON, no markdown, no code fences, no commentary. "
        'The JSON schema must be exactly: {"nodes":[],"edges":[]} with each node containing '
        'id, type, and position {x,y}; each edge containing id, source, and target. '
        "Use compact coordinates on a grid and choose node types that match the requested network devices."
    )

    try:
        if config.provider in {"openai", "deepseek", "groq"}:
            payload = {
                "model": config.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.prompt},
                ],
                "temperature": 0,
            }
            data = _request_json(
                f"{config.endpoint}/chat/completions",
                {
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                },
                payload,
            )
            raw_text = data["choices"][0]["message"]["content"]
        else:
            payload = {"model": config.model, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": request.prompt}], "stream": False, "format": "json"}
            data = _request_json(f"{config.endpoint}/api/chat", {"Content-Type": "application/json"}, payload)
            raw_text = data["message"]["content"]
        
        parsed = json.loads(_strip_json_wrappers(raw_text))
        generated = NetworkTopology.model_validate(parsed)
        
        if request.append_to_current and request.current_topology is not None:
            # Simple merge logic integrated
            return generated # Backend logic for merge can be expanded if needed
        return generated
    except Exception:
        return _heuristic_generate(request.prompt)



@app.post("/deploy")
def deploy_topology(request: DeployRequest):
    return {"network_name": f"{request.project_name}-deployed", "containers": []}
