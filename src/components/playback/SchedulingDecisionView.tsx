import React from 'react';
import { SimulationResult } from '../../domain';
import { getLatestDecision } from '../../playback';

interface SchedulingDecisionViewProps {
  result: SimulationResult;
  currentTime: number;
}

export const SchedulingDecisionView: React.FC<SchedulingDecisionViewProps> = ({ result, currentTime }) => {
  const latestDecision = getLatestDecision(result, currentTime);
  
  if (!latestDecision) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Scheduling Decision
        </h3>
        <div className="text-slate-400 text-sm italic py-2">
          No scheduling decisions have occurred yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Scheduling Decision
      </h3>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="text-xs uppercase font-bold text-blue-600 tracking-wider mb-1">
          Why was {latestDecision.selectedProcess || 'CPU_IDLE'} selected?
        </div>
        <div className="text-slate-800 font-medium mb-3">
          "{latestDecision.selectionCriterion}"
        </div>
        
        {latestDecision.reason && (
          <div className="text-sm text-slate-600 bg-white p-3 rounded border border-blue-50">
            {latestDecision.reason}
          </div>
        )}
        
        {Object.keys(latestDecision.criterionValues).length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            <span className="font-semibold">Values considered:</span>{' '}
            {Object.entries(latestDecision.criterionValues).map(([k, v]) => `${k}: ${v}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};
