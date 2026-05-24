import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  ShieldAlert, HardDrive, LayoutGrid, Monitor, Server, 
  Settings, Network, Lock, Wifi, CheckCircle2, XCircle
} from 'lucide-react';

const icons = {
  firewall: ShieldAlert,
  router: Network,
  switch: LayoutGrid,
  pc: Monitor,
  server: Server,
  'sql-server': HardDrive,
  subnet: Wifi,
};

const NexusNode = ({ data, selected }) => {
  const Icon = icons[data.kind] || Settings;

  return (
    <div className={`
      relative min-w-[140px] p-5 bg-white border-[4px] border-black transition-all
      ${selected ? 'shadow-brutal-lg -translate-x-1 -translate-y-1' : 'shadow-brutal'}
    `}>
      {/* ICMP STATUS BADGE */}
      {data.diagnosticStatus && (
          <div className={`absolute -top-4 -right-4 h-10 w-10 border-[3px] border-black flex items-center justify-center animate-bounce shadow-brutal-sm ${
              data.diagnosticStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
              {data.diagnosticStatus === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
      )}

      {/* Node Header */}
      <div className="flex flex-col items-center gap-3 mb-3">
        <div className={`
            w-12 h-12 border-[3px] border-black flex items-center justify-center bg-gray-50
            ${selected ? 'rotate-3 scale-110' : ''}
        `}>
          <Icon className="h-7 w-7 text-black" />
        </div>
        <div className="text-[11px] font-black uppercase tracking-[0.1em] text-black text-center truncate w-full">
          {data.label}
        </div>
      </div>

      {/* Network Info (Cartoon Style) */}
      <div className="mt-2 pt-2 border-t-[3px] border-black border-dashed flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
            <span>ADDR:</span>
            <span className="text-black font-black">{data.ipAddress || 'DHCP'}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
            <span>MODE:</span>
            <span className="text-black font-black">{data.kind}</span>
        </div>
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-black !border-white !w-4 !h-4 !rounded-none !-top-3 border-[3px]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-black !border-white !w-4 !h-4 !rounded-none !-bottom-3 border-[3px]"
      />
    </div>
  );
};

export default memo(NexusNode);
