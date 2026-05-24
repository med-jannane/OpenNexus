import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History as HistoryIcon, Clock, Box } from 'lucide-react';

const HistoryPanel = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        
        const fetchHistory = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/history');
                if (isMounted) {
                    setHistory(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch history', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchHistory();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-slate-950/70">
            <div className="border-b border-white/10 px-4 py-4">
                <div className="panel-title flex items-center gap-2 text-[11px] text-cyan-300">
                    <HistoryIcon className="h-3 w-3" />
                    <span>Activity Log</span>
                </div>
            </div>
            
            <div className="nexus-scroll flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-slate-500">
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        <span>Loading history...</span>
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                        No activity recorded yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div key={item.id} className="border border-white/5 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="text-sm font-medium text-slate-200">
                                        {item.action}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {new Date(item.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {item.details && (
                                    <div className="mt-2 text-[11px] text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Box className="h-3 w-3" />
                                            <span>Nodes: {item.details.nodes?.length || 0} | Edges: {item.details.edges?.length || 0}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
