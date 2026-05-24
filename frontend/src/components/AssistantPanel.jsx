import { Bot, Sparkles, Send, Zap, Settings2, Terminal as TerminalIcon, MessageCircle, Cpu } from 'lucide-react';

export default function AssistantPanel({ prompt, setPrompt, messages, onSubmit, isBusy, aiSettings, setAiSettings, aiMode, setAiMode }) {
  return (
    <section className="flex h-full flex-col overflow-hidden bg-white text-black">
      <div className="border-b-[4px] border-black px-6 py-4 bg-gray-50 flex items-center justify-between shadow-sm">
        <div className="panel-title flex items-center gap-3 text-black font-black italic">
          <div className="p-1.5 bg-black text-white border-2 border-black rotate-3">
            <Bot className="h-4 w-4" />
          </div>
          NEXUS_BRAIN.exe
        </div>
        
        {/* MANUAL MODE SWITCHER */}
        <div className="flex p-1 bg-white border-[3px] border-black shadow-brutal-sm scale-90">
            <button
                onClick={() => setAiMode('ask')}
                className={`px-3 py-1 text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${
                    aiMode === 'ask' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
            >
                <MessageCircle className="h-3 w-3" /> RESEARCH
            </button>
            <button
                onClick={() => setAiMode('orchestrate')}
                className={`px-3 py-1 text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${
                    aiMode === 'orchestrate' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}
            >
                <Cpu className="h-3 w-3" /> ORCHESTRATE
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto nexus-scroll px-6 py-8 space-y-8 bg-white">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                <TerminalIcon className="h-16 w-16 mb-4 text-black stroke-[1px]" />
                <p className="font-display font-black uppercase text-[10px] tracking-[0.4em] border-2 border-black px-6 py-3">
                    AWAITING_PROTOCOL_INIT
                </p>
            </div>
        ) : (
            <div className="space-y-8 max-w-full">
            {messages.map((message, index) => (
                <div
                key={`${message.role}-${index}`}
                className={`p-5 border-[3px] border-black text-xs font-black leading-relaxed relative ${
                    message.role === 'user'
                    ? 'ml-8 bg-black text-white rotate-[0.5deg] shadow-brutal'
                    : 'mr-8 bg-white text-black rotate-[-0.5deg] border-[4px]'
                }`}
                >
                <div className={`absolute -top-3 ${message.role === 'user' ? 'right-4' : 'left-4'} px-2 py-1 text-[7px] font-black uppercase tracking-[0.3em] border-2 border-black bg-white text-black shadow-brutal-sm`}>
                    {message.role === 'assistant' ? (message.provider || 'assistant') : message.role}
                </div>
                <div className="uppercase tracking-tight whitespace-pre-wrap">{message.content}</div>
                </div>
            ))}
            </div>
        )}
      </div>

      <div className="p-6 border-t-[4px] border-black border-dashed bg-gray-100/30">
        <form onSubmit={onSubmit} className="relative group">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={aiMode === 'orchestrate' ? "Enter topology design command..." : "Ask a technical networking question..."}
                rows={3}
                className="w-full neo-input pr-16 text-xs font-black resize-none shadow-brutal hover:shadow-brutal-lg focus:shadow-brutal-lg transition-all text-black placeholder:text-gray-300 border-[4px] border-black"
            />
            <button
                type="submit"
                disabled={isBusy || !prompt.trim()}
                className="absolute bottom-4 right-4 h-12 w-12 bg-black text-white flex items-center justify-center hover:bg-white hover:text-black border-2 border-white transition-all active:scale-95 shadow-none disabled:opacity-20"
            >
                {isBusy ? <Zap className="h-6 w-6 animate-spin text-current" /> : <Send className="h-6 w-6 text-current" />}
            </button>
        </form>
        
        <div className="mt-5 flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 ${isBusy ? 'bg-black animate-ping' : 'bg-green-500 border-2 border-black'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-black">
                    {isBusy ? 'SYNCING_DATA...' : 'ENGINE_READY'}
                </span>
            </div>
            <div className="text-[8px] font-black uppercase text-gray-400 flex items-center gap-2">
                <Settings2 className="h-3 w-3" />
                <span>Active_Model: {aiMode === 'ask' ? 'Groq/Llama3' : 'DeepSeek/Coder'}</span>
            </div>
        </div>
      </div>
    </section>
  );
}
