import React from 'react';
import { SimulationResult, AlgorithmIdentifier } from '../../domain';
import { getProcessExtremes, getPreemptionStats, generateBehaviorInsights } from '../../analytics';

interface ObservedBehaviorViewProps {
  result: SimulationResult;
  algorithm: AlgorithmIdentifier;
}

export const ObservedBehaviorView: React.FC<ObservedBehaviorViewProps> = ({ result, algorithm }) => {
  const extremes = React.useMemo(() => getProcessExtremes(result.finalProcesses), [result.finalProcesses]);
  const preemptionStats = React.useMemo(() => getPreemptionStats(result.simulationEvents), [result.simulationEvents]);
  
  const insights = React.useMemo(
    () => generateBehaviorInsights(result, algorithm, preemptionStats, extremes),
    [result, algorithm, preemptionStats, extremes]
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Observed Behavior</h3>
      
      {insights.length === 0 ? (
        <div className="text-slate-500 text-sm italic py-2">No significant observations.</div>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight, i) => (
            <li key={i} className="text-sm text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 flex items-start gap-3 shadow-sm">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
