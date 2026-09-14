import React from 'react';
import { AlgorithmIdentifier } from '../../domain';
import { ALGORITHM_PROFILES } from '../../analytics';

interface AlgorithmProfileViewProps {
  algorithm: AlgorithmIdentifier;
}

export const AlgorithmProfileView: React.FC<AlgorithmProfileViewProps> = ({ algorithm }) => {
  const profile = ALGORITHM_PROFILES[algorithm];
  
  if (!profile) return null;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Algorithm Profile</h3>
      
      <div className="flex-1 space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Characteristics</h4>
          <ul className="space-y-1">
            {profile.characteristics.map((char, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{char}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">Strengths</h4>
          <ul className="space-y-1">
            {profile.strengths.map((str, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Trade-offs</h4>
          <ul className="space-y-1">
            {profile.tradeoffs.map((trd, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span>{trd}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
