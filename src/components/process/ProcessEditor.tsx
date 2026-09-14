import React from 'react';
import { Process, ProcessType, SimulationResult, createProcess } from '../../domain';
import { AlgorithmCapabilities } from '../../simulation';
import { getProcessStatus } from '../../playback';

interface ProcessEditorProps {
  processes: Process[];
  onChange: (processes: Process[]) => void;
  capabilities: AlgorithmCapabilities;
  playbackState?: { currentTime: number; result: SimulationResult | null };
  ioEnabled?: boolean;
}

export const ProcessEditor: React.FC<ProcessEditorProps> = ({ 
  processes, 
  onChange, 
  capabilities,
  playbackState,
  ioEnabled = false
}) => {
  const { supportsPriority, supportsMultipleQueues: supportsProcessType } = capabilities;

  const handleUpdate = (index: number, field: keyof Process, value: string | number) => {
    const newProcesses = [...processes];
    let val = typeof value === 'string' && field !== 'pid' && field !== 'processType' ? parseInt(value, 10) || 0 : value;
    
    if (field === 'burstTime' && typeof val === 'number') val = Math.max(1, val);

    newProcesses[index] = { ...newProcesses[index], [field]: val };
    onChange(newProcesses);
  };
  const handleArrayUpdate = (index: number, arrayField: 'cpuBursts' | 'ioBursts', arrayIndex: number, value: string) => {
    const newProcesses = [...processes];
    const val = parseInt(value, 10) || 0;
    const p = { ...newProcesses[index] };
    
    if (!p.cpuBursts) p.cpuBursts = [p.burstTime || 1, 0];
    if (!p.ioBursts) p.ioBursts = [p.ioBurstTime || 0];

    const targetArray = [...p[arrayField]!];
    
    if (arrayField === 'cpuBursts' && arrayIndex === 0) {
      targetArray[arrayIndex] = Math.max(1, val);
    } else {
      targetArray[arrayIndex] = Math.max(0, val);
    }
    
    p[arrayField] = targetArray;
    p.burstTime = (p.cpuBursts || []).reduce((a, b) => a + b, 0) || 1;

    newProcesses[index] = p;
    onChange(newProcesses);
  };

  const handleAdd = () => {
    const nextId = processes.length > 0 ? Math.max(...processes.map(p => parseInt(p.pid.replace('P', '')) || 0)) + 1 : 1;
    const lastAT = processes.length > 0 ? processes[processes.length - 1].arrivalTime : 0;
    onChange([...processes, createProcess(`P${nextId}`, lastAT + 1, 5, { 
      priority: 1, 
      processType: ProcessType.GENERAL,
      cpuBursts: [5, 0],
      ioBursts: [0]
    })]);
  };

  const handleDelete = (index: number) => {
    const newProcesses = [...processes];
    newProcesses.splice(index, 1);
    onChange(newProcesses);
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800">Process List</h3>
        <button 
          onClick={handleClear}
          className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
              {playbackState?.result && <th className="px-3 py-2 w-16">Status</th>}
              <th className="px-3 py-2">PID</th>
              <th className="px-3 py-2">Arrival</th>
              {!ioEnabled ? (
                <th className="px-3 py-2">Burst</th>
              ) : (
                <>
                  <th className="px-3 py-2" title="First CPU burst">CPU Burst</th>
                  <th className="px-3 py-2" title="I/O burst duration">I/O Burst</th>
                  <th className="px-3 py-2" title="Second CPU burst">CPU Burst</th>
                </>
              )}
              {supportsPriority && <th className="px-3 py-2">Priority</th>}
              {supportsProcessType && <th className="px-3 py-2">Type</th>}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processes.map((p, idx) => {
              let statusRowClasses = '';
              let statusLabel = '';
              let statusBadgeClass = '';
              
              if (playbackState?.result) {
                const status = getProcessStatus(playbackState.result, p.pid, playbackState.currentTime);
                switch (status) {
                  case 'RUNNING':
                    statusRowClasses = 'bg-blue-50/50 border-l-2 border-l-blue-500';
                    statusLabel = 'RUN';
                    statusBadgeClass = 'bg-blue-500 text-white animate-pulse';
                    break;
                  case 'READY':
                    statusRowClasses = 'bg-amber-50/30 border-l-2 border-l-amber-200';
                    statusLabel = 'RDY';
                    statusBadgeClass = 'bg-amber-100 text-amber-700';
                    break;
                  case 'COMPLETED':
                    statusRowClasses = 'opacity-50 bg-slate-50/50 border-l-2 border-l-slate-200';
                    statusLabel = 'DONE';
                    statusBadgeClass = 'bg-emerald-100 text-emerald-700';
                    break;
                  case 'NOT_ARRIVED':
                  default:
                    statusRowClasses = 'opacity-70 border-l-2 border-l-transparent';
                    statusLabel = 'WAIT';
                    statusBadgeClass = 'bg-slate-100 text-slate-500';
                    break;
                }
              }

              return (
                <tr key={p.pid} className={`hover:bg-slate-50/50 transition-colors ${statusRowClasses}`}>
                  {playbackState?.result && (
                    <td className="px-3 py-2 align-middle">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <input type="text" value={p.pid} onChange={e => handleUpdate(idx, 'pid', e.target.value)} className="w-16 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" value={p.arrivalTime} onChange={e => handleUpdate(idx, 'arrivalTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                  </td>
                  {!ioEnabled ? (
                    <td className="px-3 py-2">
                      <input type="number" min="1" value={p.burstTime} onChange={e => handleUpdate(idx, 'burstTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={p.cpuBursts?.[0] ?? p.burstTime} onChange={e => handleArrayUpdate(idx, 'cpuBursts', 0, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={p.ioBursts?.[0] ?? p.ioBurstTime ?? 0} onChange={e => handleArrayUpdate(idx, 'ioBursts', 0, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={p.cpuBursts?.[1] ?? 0} onChange={e => handleArrayUpdate(idx, 'cpuBursts', 1, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                    </>
                  )}
                  {supportsPriority && (
                    <td className="px-3 py-2">
                      <input type="number" min="0" value={p.priority ?? 1} onChange={e => handleUpdate(idx, 'priority', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                    </td>
                  )}
                  {supportsProcessType && (
                    <td className="px-3 py-2">
                      <select value={p.processType ?? ProcessType.GENERAL} onChange={e => handleUpdate(idx, 'processType', e.target.value as ProcessType)} className="w-32 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500">
                        {Object.values(ProcessType).map(pt => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleDelete(idx)} className="text-slate-400 hover:text-red-600 transition-colors" aria-label="Delete Process">
                      <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
            {processes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500 italic">No processes defined.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-colors w-full justify-center border border-slate-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Process
        </button>
      </div>
    </div>
  );
};
