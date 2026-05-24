import React, { useState } from 'react';
import { Send, Zap, MessageCircle, Settings2, Sparkles, ChevronRight } from 'lucide-react';

const Landing = ({ onStartChat }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('orchestrate'); // 'ask' or 'orchestrate'
  const [model, setModel] = useState('DeepSeek'); // 'Ollama', 'Llama3', 'DeepSeek'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onStartChat({ prompt, mode, model });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 bg-white overflow-hidden text-black select-none">
      {/* Cartoon Background Elements (Absolute) */}
      <div className="absolute top-10 left-10 h-32 w-32 border-4 border-black rotate-12 -z-10 bg-gray-50 opacity-20" />
      <div className="absolute bottom-20 right-10 h-48 w-48 rounded-full border-4 border-black -rotate-6 -z-10 bg-gray-50 opacity-20" />
      <div className="absolute top-1/2 left-1/4 h-4 w-4 bg-black rotate-45 opacity-10" />
      
      <div className="w-full max-w-2xl text-center space-y-12">
        {/* Logo/Title Section */}
        <div className="space-y-6">
          <div className="mx-auto w-28 h-28 neo-brutal flex items-center justify-center bg-black rotate-3 scale-110 shadow-brutal-lg">
             <Zap className="h-16 w-16 text-white fill-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-7xl font-display font-black tracking-tighter text-black uppercase">
                Open<span className="bg-black text-white px-2 ml-1">Nexus</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
                <div className="h-[2px] w-12 bg-black" />
                <p className="text-sm font-black text-black uppercase tracking-[0.3em]">
                    Orchestration Protocol v1.0
                </p>
                <div className="h-[2px] w-12 bg-black" />
            </div>
          </div>
        </div>

        {/* Input Card */}
        <div className="neo-brutal p-8 bg-white rotate-[-1deg] border-[3px] shadow-brutal-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="text-left space-y-3">
              <div className="flex items-center justify-between">
                <label className="panel-title text-black text-xs">Awaiting Entry Sequence...</label>
                <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-black/20" />)}
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Design a modular cloud network with 3 subnets..."
                className="w-full h-36 neo-input text-xl font-bold resize-none text-black placeholder:text-gray-200 border-[3px] focus:shadow-brutal transition-all"
              />
            </div>

            {/* Model & Mode Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t-[3px] border-black border-dashed">
              
              {/* Mode Selector */}
              <div className="flex p-1 bg-gray-100 border-[3px] border-black">
                <button
                  type="button"
                  onClick={() => setMode('ask')}
                  className={`px-6 py-2 text-xs font-black uppercase transition-all ${
                    mode === 'ask' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  Ask_Only
                </button>
                <button
                  type="button"
                  onClick={() => setMode('orchestrate')}
                  className={`px-6 py-2 text-xs font-black uppercase transition-all ${
                    mode === 'orchestrate' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                  }`}
                >
                  Orchestrate
                </button>
              </div>

              {/* Model Select (Buttons) */}
              <div className="flex items-center gap-2">
                {['Ollama', 'Llama3', 'DeepSeek'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`px-4 py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${
                      model === m ? 'bg-white text-black shadow-brutal-sm -translate-y-1' : 'bg-gray-50 text-gray-400 opacity-50 grayscale hover:opacity-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMIT BUTTON - MADE PROMINENT */}
            <button
              type="submit"
              className="group w-full py-5 bg-black text-white text-2xl font-display font-black uppercase tracking-[0.2em] border-[3px] border-black shadow-brutal hover:shadow-brutal-lg active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-4"
            >
              <span>Initialize Command</span>
              <div className="bg-white p-1 rounded-none group-hover:rotate-12 transition-transform">
                <ChevronRight className="h-6 w-6 text-black stroke-[4px]" />
              </div>
            </button>
          </form>
        </div>

        {/* Status bar */}
        <div className="flex justify-between items-center px-4 py-2 border-2 border-black bg-gray-50 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full border border-black animate-pulse" />
                Core_Status: Operational
            </div>
            <div className="flex items-center gap-4 opacity-40">
                <span>Docker_Link: OK</span>
                <span>AI_Engine: Connected</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
