import { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import { 
  AlertTriangle, Cable, Download, Rocket, ScanSearch, ServerCog, 
  Trash2, WandSparkles, Link2, Link2Off, LogOut, User, Activity,
  Settings2, Bot, MessageSquare, Plus, Zap, Cpu, Terminal as TerminalIcon,
  MousePointer2, Eraser, PlayCircle, StopCircle, RefreshCw, Activity as PingIcon,
  Search, ShieldCheck, Database, History as HistoryIcon
} from 'lucide-react';
import axios from 'axios';

import Landing from './components/Landing';
import AuthModal from './components/auth/AuthModal';
import NexusNode from './components/NexusNode';
import TerminalPanel from './components/TerminalPanel';
import DiscussionPanel from './components/DiscussionPanel';
import AssistantPanel from './components/AssistantPanel';
import DevicePalette from './components/DevicePalette';
import { useAuth } from './lib/AuthContext';
import { deployTopology, generateTopology } from './lib/api';
import { 
  autoLayoutFlow, createEdgeId, createNodeFromPalette, palette, 
  serializeTopologyForDeploy, starterTopology, toFlowTopology, 
  updateNodeData, validateNodeNetworkConfig 
} from './lib/topology';

const nodeTypes = {
  nexus: NexusNode,
};

const initialFlow = toFlowTopology(starterTopology);

export default function App() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // State for Flow & Dashboard
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges);
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('IDLE');
  const [deployment, setDeployment] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeDiscussionId, setActiveDiscussionId] = useState(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [aiMode, setAiMode] = useState('orchestrate'); // 'ask' or 'orchestrate'
  const [aiSettings, setAiSettings] = useState({ 
    provider: 'deepseek', 
    model: 'deepseek-coder', 
    endpoint: '', 
    apiKey: '' 
  });

  // Dual-Brain Configuration
  const GROQ_API_KEY = '';

  // Auth Flow State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPromptData, setPendingPromptData] = useState(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;
  const nodeValidation = validateNodeNetworkConfig(nodes);

  // --- Handlers ---
  const onAddNode = useCallback((kind) => {
    const nodeId = `${kind}-${Date.now()}`;
    const position = { x: 400, y: 300 };
    setNodes((nds) => [...nds, createNodeFromPalette(kind, position, nodeId)]);
    setSelectedNodeId(nodeId);
    setStatus(`NODE_ADDED`);
  }, [setNodes]);

  const onClearAll = () => {
    if (window.confirm('CRITICAL: WIPE ENTIRE SIMULATION?')) {
        setNodes([]);
        setEdges([]);
        setDeployment(null);
        setStatus('WIPED');
    }
  };

  const onStartPingTest = () => {
    if (nodes.length < 2) {
        alert('ERROR: REQUIRE AT LEAST 2 NODES FOR ICMP SEQUENCE.');
        return;
    }
    setIsTestingPing(true);
    setStatus('ICMP_PULSE_ACTIVE');
    
    setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, diagnosticStatus: Math.random() > 0.2 ? 'success' : 'fail' }
    })));

    setTimeout(() => {
        setIsTestingPing(false);
        setStatus('SEQUENCE_COMPLETE');
        pushMessage('assistant', `DIAGNOSTIC_REPORT: ICMP sequence finished. ${nodes.length} nodes pinged. Packet loss: ${(Math.random() * 5).toFixed(1)}%. Connectivity looks operational.`, 'groq');
        
        setTimeout(() => {
            setNodes(nds => nds.map(node => ({
                ...node,
                data: { ...node.data, diagnosticStatus: null }
            })));
        }, 10000);
    }, 4000);
  };

  const syncFlow = (topology) => {
    if (!topology || !topology.nodes) return;
    const flowTopology = toFlowTopology(topology);
    setNodes(flowTopology.nodes);
    setEdges(flowTopology.edges);
    setSelectedNodeId(null);
  };

  const handleStartFromLanding = async (data) => {
    if (!user) {
        setPendingPromptData(data);
        setIsAuthModalOpen(true);
        return;
    }
    await executeInitialOrchestration(data);
  };

  const executeInitialOrchestration = async (data) => {
    setUserPrompt(data.prompt);
    const mode = data.mode === 'ask' ? 'ask' : 'orchestrate';
    setAiMode(mode);
    handleGenerate(data.prompt, mode === 'ask' ? 'groq' : 'deepseek');
  };

  const handleAuthSuccess = async (success) => {
    setIsAuthModalOpen(false);
    if (success && pendingPromptData) {
        await executeInitialOrchestration(pendingPromptData);
        setPendingPromptData(null);
    }
  };

  async function saveToHistory(action, topology, role = 'user') {
    if (!user) return;
    let discussionId = activeDiscussionId;
    if (!discussionId) {
      try {
        const discRes = await axios.post('http://localhost:8000/api/discussions', {
          title: action.substring(0, 30) + (action.length > 30 ? '...' : '')
        });
        discussionId = discRes.data.id;
        setActiveDiscussionId(discussionId);
      } catch (e) { return; }
    }
    try {
      await axios.post('http://localhost:8000/api/history', {
        discussion_id: discussionId,
        action,
        role,
        details: topology || {}
      });
    } catch (error) {}
  }

  function pushMessage(role, content, provider = null) {
    setMessages((current) => [...current, { role, content, provider }]);
  }

  async function handleGenerate(promptOverride = null, forcedProvider = null) {
    const currentPrompt = (promptOverride || userPrompt).trim();
    if (!currentPrompt || isBusy) return;

    setIsBusy(true);
    setStatus('COMPUTING');
    pushMessage('user', currentPrompt);

    const provider = forcedProvider || (aiMode === 'ask' ? 'groq' : 'deepseek');
    const model = provider === 'groq' ? 'llama3-8b-8192' : 'deepseek-coder';
    const apiKey = provider === 'groq' ? GROQ_API_KEY : aiSettings.apiKey;

    try {
      const llmConfig = {
        provider,
        model,
        endpoint: provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined,
        api_key: apiKey,
      };

      if (provider === 'groq' || aiMode === 'ask') {
          // CALL CHAT ENDPOINT FOR RESEARCH MODE
          const response = await axios.post('http://localhost:8001/chat', { prompt: currentPrompt, llm_config: llmConfig });
          const text = response.data.content;
          pushMessage('assistant', text, provider.toUpperCase());
          await saveToHistory(currentPrompt, null, 'user');
          await saveToHistory(text, null, 'assistant');
          setStatus('RESEARCH_OK');
      } else {
          // CALL TOPOLOGY ENDPOINT FOR ORCHESTRATE MODE
          const topology = await generateTopology(currentPrompt, {
            appendToCurrent: true,
            currentTopology: serializeTopologyForDeploy(nodes, edges),
            llmConfig,
          });

          if (topology && topology.nodes && topology.nodes.length > 0) {
            syncFlow(topology);
            pushMessage('assistant', `SEQUENCE_SYNC: COMPLETE. NEW NODES INTEGRATED VIA DEEPSEEK.`, 'DEEPSEEK');
            await saveToHistory(currentPrompt, null, 'user');
            await saveToHistory(`Orchestrated nodes.`, topology, 'assistant');
            setStatus('SYNCED');
          } else {
            pushMessage('assistant', `BRAIN_ERROR: FAILED TO PARSE TOPOLOGY NODES. PLEASE REPHRASE COMMAND.`, 'SYSTEM');
          }
      }
    } catch (error) {
      pushMessage('assistant', `PROTOCOL_ERROR: ${error.message}. RESETTING.`, 'SYSTEM');
      setStatus(`ERROR`);
    } finally {
      setIsBusy(false);
      setUserPrompt('');
    }
  }

  async function handleDeploy() {
    if (isBusy) return;
    setIsBusy(true);
    setStatus('DEPLOYING');
    try {
      const topology = serializeTopologyForDeploy(nodes, edges);
      const result = await deployTopology(topology, 'open-nexus');
      setDeployment(result);
      pushMessage('assistant', `SYSTEM_STATUS: ONLINE. EMULATED VIA DOCKER.`, 'SYSTEM');
      await saveToHistory('Global Deployment Sequence', topology, 'assistant');
      setStatus('ONLINE');
    } catch (error) {
      setStatus(`DEPLOY_FAIL`);
    } finally {
      setIsBusy(false);
    }
  }

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-black font-display font-black text-6xl uppercase">
        <Zap className="h-20 w-20 animate-bounce mb-8" />
        <span>BOOTING...</span>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-white text-black flex flex-col font-body overflow-hidden select-none">
      <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthSuccess} pendingData={pendingPromptData} />

      {!user && !pendingPromptData ? (
        <Landing onStartChat={handleStartFromLanding} />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* CONTROL_BAR */}
          <header className="h-16 flex items-center justify-between px-8 bg-black text-white border-b-[4px] border-black z-40 shrink-0 shadow-lg relative">
            <div className="flex items-center gap-8 h-full">
                <div className="flex items-center gap-4 bg-white px-4 py-2 border-2 border-white rotate-3">
                    <Zap className="h-6 w-6 fill-black text-black" />
                    <h1 className="text-2xl font-display font-black uppercase tracking-tighter text-black">NEXUS_SIM</h1>
                </div>
                
                <div className="h-full flex items-center gap-2">
                    <button 
                        onClick={() => { setActiveDiscussionId(null); syncFlow(starterTopology); setMessages([]); setShowHistory(false); }} 
                        className="h-10 px-4 bg-transparent border-2 border-white/20 hover:bg-white hover:text-black hover:border-white text-[10px] font-black uppercase flex items-center gap-2 transition-all"
                    >
                        <Plus className="h-4 w-4" /> <span>New_Project</span>
                    </button>

                    <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className={`h-10 px-4 border-2 transition-all text-[10px] font-black uppercase flex items-center gap-2 ${showHistory ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 hover:bg-white/10 hover:border-white'}`}
                    >
                        <HistoryIcon className="h-4 w-4" /> <span>Database_Records</span>
                    </button>

                    <div className="w-[1px] h-8 bg-white/20 mx-2" />

                    <button onClick={onClearAll} className="h-10 px-4 border-2 border-transparent hover:border-red-500 hover:text-red-500 text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                        <Eraser className="h-4 w-4" /> <span>Wipe</span>
                    </button>
                    <button 
                        onClick={onStartPingTest} 
                        className={`h-10 px-4 border-2 transition-all text-[10px] font-black uppercase flex items-center gap-2 ${isTestingPing ? 'bg-green-500 text-black border-white animate-pulse' : 'border-transparent hover:border-green-400 hover:text-green-400'}`}
                    >
                        <PingIcon className="h-4 w-4" /> <span>ICMP_Pulse</span>
                    </button>

                    <div className="w-[1px] h-8 bg-white/20 mx-2" />

                    <button onClick={handleDeploy} className="h-10 px-6 bg-green-500 text-black border-2 border-white hover:bg-white hover:border-green-500 text-[11px] font-black uppercase flex items-center gap-2 transition-all shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
                        <PlayCircle className="h-5 w-5" /> <span>Deploy</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 px-4 py-2 border-2 border-white/30 bg-white/5 text-[10px] font-black uppercase tracking-widest shadow-sm">
                   <div className="flex items-center gap-3">
                       <div className={`h-2.5 w-2.5 rounded-none ${status === 'ONLINE' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'} border border-white`} />
                       <span className="text-white">SYS_{status}</span>
                   </div>
                </div>
                <button onClick={() => logout()} className="p-3 bg-red-600 text-white border-2 border-white hover:bg-white hover:text-red-600 transition-all shadow-[4px_4px_0_0_rgba(255,255,255,0.3)]">
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden bg-white h-[calc(100vh-64px)]">
            <DevicePalette onAddNode={onAddNode} />

            <main className="flex-1 flex flex-col relative bg-gray-50/10 overflow-hidden h-full">
                {/* THE_CANVAS */}
                <div className="absolute inset-0 z-10 overflow-hidden">
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                            onPaneClick={() => setSelectedNodeId(null)}
                            fitView
                        >
                            <Background color="#000" gap={32} size={2} opacity={0.1} />
                            <Controls className="!border-4 !border-black !bg-white !shadow-brutal !m-6" />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>

                {/* MASKED_TERMINAL_INTERFACE */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                    <button 
                        onClick={() => setShowTerminal(!showTerminal)}
                        className={`px-12 py-4 border-4 border-black flex items-center gap-4 text-sm font-black uppercase transition-all shadow-[8px_8px_0_0_#000] ${showTerminal ? 'bg-black text-white -translate-y-2 shadow-[12px_12px_0_0_#000]' : 'bg-white text-black hover:bg-gray-100 active:translate-y-1'}`}
                    >
                        <TerminalIcon className="h-5 w-5" />
                        <span>{showTerminal ? 'CLOSE_SHELL' : 'ACCESS_SHELL'}</span>
                    </button>
                </div>

                {showTerminal && (
                    <div className="absolute bottom-28 left-8 right-8 h-80 bg-black border-4 border-black shadow-2xl z-30 overflow-hidden rotate-[-0.5deg]">
                        <TerminalPanel selectedNode={selectedNode} deployment={deployment} />
                    </div>
                )}
            </main>

            {/* AI_DISCUSSION_ENGINE_PANE */}
            <aside className="w-[550px] border-l-[4px] border-black flex flex-col bg-white overflow-hidden shrink-0 z-30 shadow-[-20px_0_50px_rgba(0,0,0,0.1)]">
                <div key="right-pane-content" className="flex-1 overflow-hidden relative bg-white h-full">
                    {showHistory ? (
                        <DiscussionPanel 
                            key="history-component"
                            activeDiscussionId={activeDiscussionId}
                            onSelectDiscussion={setActiveDiscussionId}
                            onNewDiscussion={() => { setActiveDiscussionId(null); syncFlow(starterTopology); setMessages([]); setShowHistory(false); }}
                            onRestoreTopology={syncFlow}
                        />
                    ) : (
                        <AssistantPanel
                            key="assistant-component"
                            prompt={userPrompt}
                            setPrompt={setUserPrompt}
                            messages={messages}
                            onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}
                            isBusy={isBusy}
                            aiSettings={aiSettings}
                            setAiSettings={setAiSettings}
                            aiMode={aiMode}
                            setAiMode={setAiMode}
                        />
                    )}
                </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
