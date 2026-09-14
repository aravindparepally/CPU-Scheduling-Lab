import React from 'react';
import { AlgorithmIdentifier, AlgorithmConfig } from '../../domain';
import { getAlgorithmMetadata } from '../../simulation';

interface ConfigurationPanelProps {
  algorithm: AlgorithmIdentifier;
  config: AlgorithmConfig;
  onConfigChange: (config: AlgorithmConfig) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ algorithm, config, onConfigChange }) => {
  const metadata = getAlgorithmMetadata(algorithm);



  const handleNumberChange = (key: string, section: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    
    onConfigChange({
      ...config,
      [section]: {
        ...(config[section as keyof AlgorithmConfig] as any),
        [key]: num
      }
    });
  };

  const handleBooleanChange = (key: string, section: string, value: boolean) => {
    onConfigChange({
      ...config,
      [section]: {
        ...(config[section as keyof AlgorithmConfig] as any),
        [key]: value
      }
    });
  };

  const handleNumberArrayChange = (key: string, section: string, value: string) => {
    const arr = value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    onConfigChange({
      ...config,
      [section]: {
        ...(config[section as keyof AlgorithmConfig] as any),
        [key]: arr
      }
    });
  };

  const renderControl = (param: any) => {
    // Map parameter IDs to their config sections
    let section = 'priority';
    if (param.id === 'timeQuantum') section = 'roundRobin';
    if (param.id === 'batchTimeQuantum' || param.id === 'globalPreemption') section = 'mlq';
    if (param.id === 'quantums' || param.id === 'boostInterval') section = 'mlfq';

    const currentValue = (config as any)[section]?.[param.id] ?? param.defaultValue;

    if (param.type === 'number') {
      return (
        <div key={param.id} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{param.name}</label>
          <input 
            type="number" 
            value={currentValue} 
            onChange={e => handleNumberChange(param.id, section, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
            min="0"
          />
        </div>
      );
    }

    if (param.type === 'boolean') {
      return (
        <div key={param.id} className="flex items-center gap-2 pt-6">
          <input 
            type="checkbox" 
            checked={currentValue} 
            onChange={e => handleBooleanChange(param.id, section, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-slate-700">{param.name}</label>
        </div>
      );
    }

    if (param.type === 'numberArray') {
      return (
        <div key={param.id} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{param.name} (comma separated)</label>
          <input 
            type="text" 
            value={(currentValue as number[]).join(', ')} 
            onChange={e => handleNumberArrayChange(param.id, section, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Global Settings</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Context Switch Time</label>
          <input 
            type="number" 
            value={config.contextSwitchTime ?? 0} 
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              onConfigChange({ ...config, contextSwitchTime: isNaN(val) ? 0 : val });
            }}
            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
            min="0"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input 
            type="checkbox" 
            checked={config.ioEnabled ?? false} 
            onChange={e => onConfigChange({ ...config, ioEnabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-slate-700">Enable I/O Operations</label>
        </div>
      </div>
      
      {metadata.parameters.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Algorithm Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metadata.parameters.map(renderControl)}
          </div>
        </>
      )}
    </div>
  );
};
