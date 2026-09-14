import React from 'react';

interface Preset {
  id: string;
  name: string;
  description: string;
}

interface PresetSelectorProps {
  presets: Preset[];
  onSelect: (id: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, onSelect }) => {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Quick Start Examples</h3>
        <p className="text-xs text-slate-500 mt-0.5">Load a pre-configured simulation scenario to explore different behaviors.</p>
      </div>
      
      <select 
        onChange={(e) => onSelect(e.target.value)}
        defaultValue=""
        className="w-full sm:w-64 p-2 bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
      >
        <option value="" disabled>Select an example...</option>
        {presets.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
};
