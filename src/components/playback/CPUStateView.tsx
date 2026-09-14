import React from 'react';
import { SimulationResult } from '../../domain';
import { getActiveSegment, getProcessDetails, getCalculatedElapsed } from '../../playback';

interface CPUStateViewProps {
  result: SimulationResult;
  currentTime: number;
}

export const CPUStateView: React.FC<CPUStateViewProps> = ({ result, currentTime }) => {
  const activeSegment = getActiveSegment(result, currentTime);
  const process = activeSegment ? getProcessDetails(result, activeSegment.pid) : null;
  
  const isIdle = !activeSegment || activeSegment.pid === 'CPU_IDLE';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
        CPU State
      </h3>

      <div className="flex-grow flex flex-col justify-center">
        <div className={`p-4 rounded-lg border flex flex-col items-center justify-center text-center transition-colors
          ${isIdle ? 'bg-slate-50 border-slate-200 diagonal-stripes' : 'bg-blue-50 border-blue-200 shadow-inner'}
        `}>
          <div className={`text-xs font-bold uppercase tracking-wider mb-2
            ${isIdle ? 'text-slate-500' : 'text-blue-600'}
          `}>
            Status: {isIdle ? 'Idle' : 'Executing'}
          </div>
          
          <div className={`text-3xl font-black mb-2
            ${isIdle ? 'text-slate-400' : 'text-slate-800'}
          `}>
            {isIdle ? '—' : activeSegment.pid}
          </div>

          <div className="text-sm font-mono text-slate-600">
            Time: {currentTime.toFixed(2)}
          </div>
        </div>

        {process && activeSegment && (
          <div className="mt-4 text-xs space-y-2 border-t border-slate-100 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Arrival</span>
              <span className="font-semibold text-slate-700">{process.arrivalTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Original Burst</span>
              <span className="font-semibold text-slate-700">{process.burstTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Segment Elapsed</span>
              <span className="font-semibold text-blue-600">{getCalculatedElapsed(activeSegment, currentTime).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
