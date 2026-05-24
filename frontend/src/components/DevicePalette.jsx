import React from 'react';
import { 
  ShieldAlert, Network, LayoutGrid, Monitor, Server, 
  HardDrive, Wifi, Plus, Box
} from 'lucide-react';
import { palette } from '../lib/topology';

const DevicePalette = ({ onAddNode }) => {
  return (
    <aside className="w-[80px] flex flex-col items-center py-6 gap-6 bg-white border-r-[4px] border-black select-none">
      <div className="mb-4">
        <div className="w-10 h-10 bg-black text-white flex items-center justify-center rotate-3 shadow-brutal-sm">
            <Box className="h-6 w-6" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto nexus-scroll w-full items-center">
        {palette.map((item) => {
          const Icon = {
            firewall: ShieldAlert,
            router: Network,
            switch: LayoutGrid,
            pc: Monitor,
            server: Server,
            'sql-server': HardDrive,
            subnet: Wifi,
          }[item.kind] || Box;

          return (
            <div
              key={item.kind}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('application/reactflow', item.kind)}
              onClick={() => onAddNode(item.kind)}
              className="group relative flex items-center justify-center w-14 h-14 bg-white border-[3px] border-black cursor-grab hover:bg-black hover:text-white transition-all hover:-translate-y-1 active:translate-y-0"
              title={item.label}
            >
              <Icon className="h-6 w-6" />
              <div className="absolute left-16 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border-2 border-white shadow-brutal-sm">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t-2 border-black border-dashed w-full flex flex-col items-center gap-4">
        <div className="text-[8px] font-black text-gray-400 rotate-90 whitespace-nowrap mb-4">DEVICES_V1.0</div>
      </div>
    </aside>
  );
};

export default DevicePalette;
