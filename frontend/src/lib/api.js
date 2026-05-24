const DEFAULT_API_BASE = 'http://localhost:8001';

async function requestJson(path, payload) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof body === 'string' ? body : body?.detail || 'Request failed';
    throw new Error(detail);
  }

  return body;
}

export function generateTopology(prompt, options = {}) {
  const payload = {
    prompt,
  };

  if (options.appendToCurrent) {
    payload.append_to_current = true;
  }

  if (options.currentTopology) {
    payload.current_topology = options.currentTopology;
  }

  if (options.llmConfig) {
    payload.llm_config = options.llmConfig;
  }

  return requestJson('/generate-topology', payload);
}

export function deployTopology(topology, project_name = 'open-nexus') {
  return requestJson('/deploy', {
    topology,
    project_name,
  });
}