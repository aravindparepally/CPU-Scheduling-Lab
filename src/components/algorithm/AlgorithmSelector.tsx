import React from 'react';
import { AlgorithmIdentifier } from '../../domain';
import { getAlgorithmMetadata } from '../../simulation';

interface AlgorithmSelectorProps {
  algorithm: AlgorithmIdentifier;
  onAlgorithmChange: (id: AlgorithmIdentifier) => void;
}

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({ algorithm, onAlgorithmChange }) => {
  const allAlgorithms = Object.values(AlgorithmIdentifier);
  const metadata = getAlgorithmMetadata(algorithm);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        Scheduling Algorithm
      </h2>
      
      <div className="flex flex-col gap-3">
        <select 
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmIdentifier)}
          className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        >
          {allAlgorithms.map(algo => {
            const meta = getAlgorithmMetadata(algo);
            return (
              <option key={algo} value={algo}>
                {meta.name} ({algo})
              </option>
            );
          })}
        </select>
        
        <div className="mt-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <p className="text-sm text-slate-700 leading-relaxed">{metadata.description}</p>
          <div className="mt-3 flex gap-2 flex-wrap">
            {metadata.capabilities.preemptive ? (
              <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">Preemptive</span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">Non-preemptive</span>
            )}
            {metadata.capabilities.supportsPriority && (
              <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200">Priority</span>
            )}
            {metadata.capabilities.supportsTimeQuantum && (
              <span className="px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">Time Quantum</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
