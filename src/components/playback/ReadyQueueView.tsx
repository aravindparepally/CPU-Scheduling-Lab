import React from 'react';
import { SimulationResult } from '../../domain';
import { getQueueState } from '../../playback';

interface ReadyQueueViewProps {
  result: SimulationResult;
  currentTime: number;
}

export const ReadyQueueView: React.FC<ReadyQueueViewProps> = ({ result, currentTime }) => {
  const queueState = getQueueState(result, currentTime);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Ready Queues
      </h3>
      
      {!queueState.isAccurate && queueState.message && (
        <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded mb-4 leading-tight">
          <strong>Limitation:</strong> {queueState.message}
        </div>
      )}

      {Object.keys(queueState.queues).length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-slate-400 text-sm italic py-4">
          All queues are empty.
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          {Object.entries(queueState.queues).sort(([a], [b]) => Number(a) - Number(b)).map(([level, pids]) => (
            <div key={level} className="flex flex-col gap-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Queue {level} {pids.length === 0 && '(Empty)'}
              </div>
              <div className="flex flex-wrap gap-2">
                {pids.map((pid, idx) => (
                  <div 
                    key={`${pid}-${idx}`}
                    className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-sm font-bold text-slate-700 shadow-sm flex items-center gap-2"
                  >
                    <span>{pid}</span>
                    {idx < pids.length - 1 && <span className="text-slate-300">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
