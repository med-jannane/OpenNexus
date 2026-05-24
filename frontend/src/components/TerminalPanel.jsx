import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Play, Terminal as TerminalIcon, Shield } from 'lucide-react';

function printLine(terminal, text = '') {
  if (!terminal) return;
  try {
    terminal.writeln(text);
  } catch (e) {}
}

export default function TerminalPanel({ selectedNode, deployment }) {
  const mountRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [command, setCommand] = useState('');

  useEffect(() => {
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 12,
      fontFamily: 'SFMono-Regular, Consolas, monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#ffffff33',
      },
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    let isDisposed = false;

    const init = () => {
        if (isDisposed || !mountRef.current) return;
        terminal.open(mountRef.current);
        fitAddon.fit();
        terminal.writeln('NEXUS_OS v0.1.0 (BETA)');
        terminal.writeln('CONNECTION: SECURE_LINE');
        terminal.writeln('');
        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;
    };

    setTimeout(init, 100);

    return () => {
      isDisposed = true;
      terminal.dispose();
    };
  }, []);

  function runCommand(e) {
    e.preventDefault();
    const terminal = terminalRef.current;
    if (!terminal || !command.trim()) return;
    printLine(terminal, `> ${command}`);
    printLine(terminal, `[CMD] Executing on ${selectedNode?.data?.label || 'CORE'}...`);
    printLine(terminal, `[OUT] Return sequence OK.`);
    printLine(terminal, '');
    setCommand('');
  }

  return (
    <section className="flex h-full flex-col overflow-hidden bg-black text-white">
      <div className="border-b-2 border-white/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
          <TerminalIcon className="h-3 w-3" /> Console_Host
        </div>
        <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-black text-white/40 uppercase">Live_Feed</span>
        </div>
      </div>

      <div className="flex-1 relative p-2 overflow-hidden">
        <div ref={mountRef} className="absolute inset-0" />
      </div>

      <form onSubmit={runCommand} className="p-3 border-t-2 border-white/20 flex gap-2">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="ENTER_CMD"
          className="flex-1 bg-transparent border-b border-white/30 text-xs font-mono outline-none focus:border-white transition-all uppercase placeholder:text-white/20"
        />
        <button type="submit" className="h-6 w-6 bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all">
            <Play className="h-3 w-3 fill-black" />
        </button>
      </form>
    </section>
  );
}
