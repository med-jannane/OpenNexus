import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Plus, Trash2, Clock, Box, User, Bot, FolderSync, RefreshCw } from 'lucide-react';

const DiscussionPanel = ({ activeDiscussionId, onSelectDiscussion, onNewDiscussion, onRestoreTopology }) => {
    const [discussions, setDiscussions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    useEffect(() => {
        fetchDiscussions();
    }, []);

    useEffect(() => {
        if (activeDiscussionId) {
            fetchMessages(activeDiscussionId);
        } else {
            setMessages([]);
        }
    }, [activeDiscussionId]);

    const fetchDiscussions = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/discussions');
            setDiscussions(response.data);
        } catch (error) {
            console.error('Failed to fetch discussions', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (id) => {
        setIsLoadingMessages(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/history?discussion_id=${id}`);
            const data = response.data;
            setMessages(data);
            
            // AUTOMATIC TOPOLOGY RESTORATION (Copilot/Claude Style)
            // Find the most recent assistant message with topology data
            const lastAssistantWithData = [...data].reverse().find(m => m.role === 'assistant' && m.details && m.details.nodes);
            if (lastAssistantWithData) {
                onRestoreTopology(lastAssistantWithData.details);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Destroy this record permanently?')) return;
        try {
            await axios.delete(`http://localhost:8000/api/discussions/${id}`);
            setDiscussions(discussions.filter(d => d.id !== id));
            if (activeDiscussionId === id) onSelectDiscussion(null);
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-white text-black">
            {/* Sidebar: Project Records */}
            <div className="flex w-[220px] flex-col border-r-4 border-black bg-gray-50">
                <div className="p-4 border-b-4 border-black">
                    <button
                        onClick={onNewDiscussion}
                        className="w-full h-12 bg-black text-white text-[11px] font-black uppercase flex items-center justify-center gap-3 border-2 border-black hover:bg-white hover:text-black transition-all shadow-brutal-sm"
                    >
                        <Plus className="h-4 w-4" />
                        INIT_NEW_PROJECT
                    </button>
                </div>
                <div className="nexus-scroll flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoading ? (
                        <div className="py-8 text-center text-[9px] font-black uppercase text-gray-400 animate-pulse tracking-[0.2em]">Syncing_DB...</div>
                    ) : (
                        discussions.map((d) => (
                            <div
                                key={d.id}
                                onClick={() => onSelectDiscussion(d.id)}
                                className={`group flex items-center justify-between gap-3 cursor-pointer p-3 border-[3px] transition-all ${
                                    activeDiscussionId === d.id ? 'bg-black text-white border-black shadow-brutal' : 'bg-white border-black hover:bg-gray-100 text-black'
                                }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                    <span className="text-[10px] font-black uppercase truncate tracking-tight">{d.title}</span>
                                </div>
                                <button onClick={(e) => handleDelete(e, d.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main: Protocol Data Stream */}
            <div className="flex flex-1 flex-col overflow-hidden bg-white">
                <div className="h-14 border-b-4 border-black px-6 bg-white flex items-center justify-between shadow-sm">
                    <div className="panel-title flex items-center gap-3 text-black text-[12px]">
                        <FolderSync className="h-5 w-5" /> RECOVERED_PROTOCOL_DATA
                    </div>
                    {isLoadingMessages && <RefreshCw className="h-4 w-4 animate-spin opacity-40" />}
                </div>

                <div className="nexus-scroll flex-1 overflow-y-auto p-6 bg-white space-y-6">
                    {!activeDiscussionId ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 grayscale text-center">
                            <Box className="h-16 w-16 mb-4" />
                            <span className="font-black uppercase text-[11px] tracking-[0.4em]">SELECT_PROJECT_RECORD</span>
                        </div>
                    ) : (
                        <div className="space-y-8 max-w-4xl mx-auto">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`p-6 border-[4px] border-black transition-all ${
                                    msg.role === 'assistant' ? 'bg-gray-100 rotate-[-0.5deg] ml-0 mr-12' : 'bg-black text-white rotate-[0.5deg] ml-12 mr-0 shadow-brutal'
                                }`}>
                                    <div className={`flex items-center gap-3 mb-4 pb-3 border-b-2 ${msg.role === 'assistant' ? 'border-black/10' : 'border-white/10'}`}>
                                        <div className={`h-6 w-6 border-2 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-black text-white border-black' : 'bg-white text-black border-white'}`}>
                                            {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                        </div>
                                        <span className={`text-[9px] uppercase tracking-[0.4em] font-black ${msg.role === 'assistant' ? 'text-black/40' : 'text-white/40'}`}>{msg.role}</span>
                                        <span className={`ml-auto text-[8px] font-black opacity-30 uppercase tracking-widest`}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-[13px] leading-relaxed font-black uppercase tracking-tight">{msg.action}</div>
                                    
                                    {msg.role === 'assistant' && msg.details && msg.details.nodes && (
                                        <div className="mt-4 pt-4 border-t-2 border-black border-dashed flex gap-4">
                                            <div className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase">Topology_Linked</div>
                                            <div className="text-[8px] font-black text-black/40 uppercase">Nodes: {msg.details.nodes.length} | Edges: {msg.details.edges.length}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionPanel;
