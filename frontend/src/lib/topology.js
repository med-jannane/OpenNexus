export const palette = [
  { kind: 'firewall', label: 'Firewall', color: '#ff8a3d' },
  { kind: 'router', label: 'Router', color: '#23e6a8' },
  { kind: 'switch', label: 'Switch', color: '#7dd3fc' },
  { kind: 'pc', label: 'PC', color: '#60a5fa' },
  { kind: 'server', label: 'Server', color: '#c084fc' },
  { kind: 'sql-server', label: 'SQL Server', color: '#f59e0b' },
  { kind: 'subnet', label: 'Subnet', color: '#f472b6' },
];

export const starterTopology = {
  nodes: [
    { id: '1', type: 'router', position: { x: 180, y: 120 } },
    { id: '2', type: 'firewall', position: { x: 20, y: 120 } },
    { id: '3', type: 'subnet', position: { x: 380, y: 60 } },
    { id: '4', type: 'subnet', position: { x: 380, y: 220 } },
    { id: '5', type: 'sql-server', position: { x: 600, y: 220 } },
  ],
  edges: [
    { id: 'e2-1', source: '2', target: '1' },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e1-4', source: '1', target: '4' },
    { id: 'e4-5', source: '4', target: '5' },
  ],
};

const typeLabels = {
  firewall: 'Firewall',
  router: 'Router',
  switch: 'Switch',
  pc: 'PC',
  server: 'Server',
  'sql-server': 'SQL Server',
  subnet: 'Subnet',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function createDefaultName(node, index) {
  const label = typeLabels[node.type] || node.type;
  return `${label}-${index + 1}`;
}

function createDefaultHostname(name, node) {
  return slugify(name || `${node.type}-${node.id}`) || `${node.type}-${node.id}`;
}

function getSubnetOrder(topology) {
  return topology.nodes
    .filter((node) => node.type === 'subnet')
    .slice()
    .sort((left, right) => left.position.x - right.position.x || left.position.y - right.position.y);
}

function getNearestSubnetIndex(node, subnetNodes) {
  if (!subnetNodes.length) {
    return 0;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  subnetNodes.forEach((subnetNode, index) => {
    const distance = Math.abs(subnetNode.position.x - node.position.x) + Math.abs(subnetNode.position.y - node.position.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export function autoConfigureTopology(topology) {
  const subnetNodes = getSubnetOrder(topology);
  const subnetUsage = new Map();

  const nodes = topology.nodes.map((node, index) => {
    const label = node.name || createDefaultName(node, index);
    const hostname = node.hostname || createDefaultHostname(label, node);
    const subnetIndex = node.type === 'subnet' ? subnetNodes.findIndex((entry) => entry.id === node.id) : getNearestSubnetIndex(node, subnetNodes);
    const subnetGroup = subnetIndex >= 0 ? subnetIndex : 0;

    if (node.type === 'subnet') {
      return {
        ...node,
        name: label,
        hostname,
        ip_address: node.ip_address || '',
        cidr: node.cidr || `172.28.${subnetGroup}.0/24`,
        subnet_group: subnetGroup,
      };
    }

    const usedHosts = subnetUsage.get(subnetGroup) || 0;
    subnetUsage.set(subnetGroup, usedHosts + 1);

    return {
      ...node,
      name: label,
      hostname,
      ip_address: node.ip_address || `172.28.${subnetGroup}.${10 + usedHosts}`,
      cidr: node.cidr || `172.28.${subnetGroup}.0/24`,
      subnet_group: subnetGroup,
    };
  });

  return {
    nodes,
    edges: topology.edges.map((edge) => ({ ...edge })),
  };
}

export function toFlowTopology(topology) {
  const configuredTopology = autoConfigureTopology(topology);

  return {
    nodes: configuredTopology.nodes.map((node) => ({
      id: node.id,
      type: 'nexus',
      position: node.position,
      data: {
        kind: node.type,
        label: node.name || typeLabels[node.type] || node.type,
        name: node.name || '',
        hostname: node.hostname || '',
        ipAddress: node.ip_address || '',
        cidr: node.cidr || '',
        subnetGroup: node.subnet_group ?? 0,
        id: node.id,
      },
    })),
    edges: configuredTopology.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: 'rgba(35, 230, 168, 0.85)',
        strokeWidth: 2,
      },
    })),
  };
}

export function createNodeFromPalette(kind, position, id) {
  return {
    id,
    type: 'nexus',
    position,
    data: {
      kind,
      label: typeLabels[kind] || kind,
      name: typeLabels[kind] || kind,
      hostname: slugify(`${kind}-${id}`) || `${kind}-${id}`,
      ipAddress: '',
      cidr: '',
      subnetGroup: 0,
      id,
    },
  };
}

export function createEdgeId(source, target) {
  return `e${source}-${target}-${Date.now()}`;
}

export function getNodeSummary(kind) {
  return typeLabels[kind] || kind;
}

export function serializeTopologyForDeploy(nodes, edges) {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.kind,
      position: node.position,
      name: node.data.name || node.data.label || typeLabels[node.data.kind] || node.data.kind,
      hostname: node.data.hostname || slugify(node.data.name || node.data.label || node.id),
      ip_address: node.data.ipAddress || '',
      cidr: node.data.cidr || '',
      subnet_group: node.data.subnetGroup ?? 0,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

export function updateNodeData(nodes, nodeId, patch) {
  return nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

    const nextData = {
      ...node.data,
      ...patch,
    };

    if (patch.name && !patch.label) {
      nextData.label = patch.name;
    }

    return {
      ...node,
      data: nextData,
    };
  });
}

function isValidIpv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function isValidCidr(value) {
  const [ip, mask] = value.split('/');
  if (!ip || mask === undefined) return false;
  if (!isValidIpv4(ip)) return false;
  if (!/^\d+$/.test(mask)) return false;
  const maskValue = Number(mask);
  return maskValue >= 0 && maskValue <= 32;
}

export function validateNodeNetworkConfig(nodes) {
  const errors = {};
  const usedIps = new Map();

  nodes.forEach((node) => {
    const nodeErrors = {};
    const ip = String(node.data.ipAddress || '').trim();
    const cidr = String(node.data.cidr || '').trim();

    if (ip) {
      if (!isValidIpv4(ip)) {
        nodeErrors.ip = 'Adresse IP invalide';
      } else if (usedIps.has(ip)) {
        nodeErrors.ip = `IP deja utilisee par ${usedIps.get(ip)}`;
      } else {
        usedIps.set(ip, node.data.label || node.id);
      }
    }

    if (cidr && !isValidCidr(cidr)) {
      nodeErrors.cidr = 'CIDR invalide (ex: 172.28.0.0/24)';
    }

    if (Object.keys(nodeErrors).length > 0) {
      errors[node.id] = nodeErrors;
    }
  });

  return errors;
}

export function autoLayoutFlow(nodes, edges) {
  const incoming = new Map();
  const outgoing = new Map();

  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  });

  edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }
    outgoing.get(edge.source).push(edge.target);
  });

  const queue = [];
  const level = new Map();

  nodes
    .filter((node) => (incoming.get(node.id) || 0) === 0)
    .forEach((node) => {
      queue.push(node.id);
      level.set(node.id, 0);
    });

  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    level.set(nodes[0].id, 0);
  }

  for (let i = 0; i < queue.length; i += 1) {
    const current = queue[i];
    const currentLevel = level.get(current) || 0;
    (outgoing.get(current) || []).forEach((next) => {
      const candidateLevel = currentLevel + 1;
      if (!level.has(next) || candidateLevel > level.get(next)) {
        level.set(next, candidateLevel);
      }
      if (!queue.includes(next)) {
        queue.push(next);
      }
    });
  }

  const groups = new Map();
  nodes.forEach((node) => {
    const nodeLevel = level.get(node.id) || 0;
    if (!groups.has(nodeLevel)) {
      groups.set(nodeLevel, []);
    }
    groups.get(nodeLevel).push(node);
  });

  const sortedLevels = Array.from(groups.keys()).sort((a, b) => a - b);
  const positioned = [];

  sortedLevels.forEach((nodeLevel) => {
    const group = groups.get(nodeLevel);
    group.sort((left, right) => left.id.localeCompare(right.id));
    group.forEach((node, index) => {
      positioned.push({
        ...node,
        position: {
          x: 140 + nodeLevel * 260,
          y: 80 + index * 150,
        },
      });
    });
  });

  return positioned;
}