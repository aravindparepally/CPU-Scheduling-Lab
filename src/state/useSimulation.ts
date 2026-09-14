import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Process, 
  AlgorithmIdentifier, 
  AlgorithmConfig, 
  SimulationResult
} from '../domain';
import { 
  runSimulation, 
  getExamplePresets,
  getAlgorithmMetadata
} from '../simulation';

export function useSimulation() {
  const presets = useMemo(() => getExamplePresets(), []);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<AlgorithmIdentifier>(AlgorithmIdentifier.FCFS);
  const [config, setConfig] = useState<AlgorithmConfig>({ algorithm: AlgorithmIdentifier.FCFS });
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (presets.length > 0 && processes.length === 0) {
      applyPreset(presets[0].id);
    }
  }, [presets]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Deep clone to avoid mutating preset
    setProcesses(JSON.parse(JSON.stringify(preset.input.processes)));
    setAlgorithm(preset.input.algorithm);
    setConfig(JSON.parse(JSON.stringify(preset.input.config || { algorithm: preset.input.algorithm })));
    setResult(null);
    setIsStale(true);
    setError(null);
  }, [presets]);

  const markStale = useCallback(() => {
    setIsStale(true);
  }, []);

  const updateAlgorithm = useCallback((newAlgo: AlgorithmIdentifier) => {
    setAlgorithm(newAlgo);
    
    // Initialize default config for the selected algorithm
    const metadata = getAlgorithmMetadata(newAlgo);
    const newConfig: any = { algorithm: newAlgo };
    
    metadata.parameters.forEach(param => {
      let section = 'priority';
      if (param.id === 'timeQuantum') section = 'roundRobin';
      if (param.id === 'batchTimeQuantum' || param.id === 'globalPreemption') section = 'mlq';
      if (param.id === 'quantums' || param.id === 'boostInterval') section = 'mlfq';
      
      if (!newConfig[section]) newConfig[section] = {};
      newConfig[section][param.id] = param.defaultValue;
    });

    setConfig(newConfig as AlgorithmConfig);
    markStale();
  }, [markStale]);

  const updateConfig = useCallback((newConfig: AlgorithmConfig) => {
    setConfig(newConfig);
    markStale();
  }, [markStale]);

  const updateProcesses = useCallback((newProcesses: Process[]) => {
    setProcesses(newProcesses);
    markStale();
  }, [markStale]);

  const run = useCallback(() => {
    try {
      setError(null);
      const res = runSimulation({
        algorithm,
        processes: JSON.parse(JSON.stringify(processes)),
        config
      });
      setResult(res);
      setIsStale(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred during simulation.');
      setResult(null);
      setIsStale(true);
    }
  }, [algorithm, processes, config]);

  return {
    processes,
    algorithm,
    config,
    result,
    isStale,
    error,
    presets,
    applyPreset,
    updateAlgorithm,
    updateConfig,
    updateProcesses,
    run
  };
}
