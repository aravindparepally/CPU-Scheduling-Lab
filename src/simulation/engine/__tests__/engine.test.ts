import { describe, it, expect } from 'vitest';
import { runSimulation } from '../runSimulation';
import { getExamplePresets } from '../presets';
import { getAlgorithmMetadata, getAlgorithmCapabilities } from '../metadata';
import { AlgorithmIdentifier, createProcess, ProcessType, AlgorithmConfig } from '../../../domain';

describe('Unified Simulation Engine', () => {

  it('1. Unified Dispatch & Result Consistency', () => {
    const processes = [createProcess('P1', 0, 5)];
    const algorithms = Object.values(AlgorithmIdentifier);

    for (const algo of algorithms) {
      const config: AlgorithmConfig = {
        algorithm: algo,
        roundRobin: { timeQuantum: 2 },
        mlfq: { quantums: [2, 4, 8], boostInterval: 20 },
        mlq: { batchTimeQuantum: 2, globalPreemption: true },
        priority: { isPreemptive: true, agingRate: 1 }
      };

      const result = runSimulation({ algorithm: algo, processes, config });
      
      expect(result).toHaveProperty('ganttSegments');
      expect(result).toHaveProperty('simulationEvents');
      expect(result).toHaveProperty('schedulingDecisions');
      expect(result).toHaveProperty('averageTurnaroundTime');
      expect(result.ganttSegments.length).toBeGreaterThan(0);
      expect(result.averageTurnaroundTime).toBeTypeOf('number');
    }
  });

  it('2. Immutability of input processes', () => {
    const algos = [AlgorithmIdentifier.SRTF, AlgorithmIdentifier.RR, AlgorithmIdentifier.MLFQ];
    
    for (const algo of algos) {
      const p1 = createProcess('P1', 0, 5);
      const processes = [p1];
      const clonedProcesses = JSON.parse(JSON.stringify(processes));

      runSimulation({ 
        algorithm: algo, 
        processes, 
        config: { algorithm: algo, roundRobin: { timeQuantum: 2 }, mlfq: { quantums: [2], boostInterval: 10 } }
      });

      expect(processes).toEqual(clonedProcesses);
    }
  });

  it('3. Determinism', () => {
    const algos = [
      AlgorithmIdentifier.FCFS, AlgorithmIdentifier.SRTF, 
      AlgorithmIdentifier.RR, AlgorithmIdentifier.PRIORITY, 
      AlgorithmIdentifier.MULTILEVEL_QUEUE, AlgorithmIdentifier.MLFQ
    ];
    
    for (const algo of algos) {
      const processes = [
        createProcess('P1', 0, 5, { priority: 2, processType: ProcessType.SYSTEM }),
        createProcess('P2', 1, 2, { priority: 1, processType: ProcessType.STUDENT }),
      ];
      
      const config: AlgorithmConfig = { 
        algorithm: algo, 
        roundRobin: { timeQuantum: 2 }, 
        mlfq: { quantums: [2,4,8], boostInterval: 10 },
        mlq: { batchTimeQuantum: 2, globalPreemption: true },
        priority: { isPreemptive: true, agingRate: 1 }
      };

      const input = { algorithm: algo, processes, config };
      const res1 = runSimulation(input);
      const res2 = runSimulation(input);

      expect(res1).toEqual(res2);
    }
  });

  it('4. Invalid Input validation', () => {
    const validProcess = createProcess('P1', 0, 5);

    expect(() => runSimulation({ algorithm: 'INVALID' as any, processes: [validProcess] })).toThrow(/Invalid algorithm/);
    expect(() => runSimulation({ algorithm: AlgorithmIdentifier.FCFS, processes: {} as any })).toThrow(/Processes must be an array/);
    
    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.FCFS, 
      processes: [createProcess('P1', -1, 5)] 
    })).toThrow(/negative arrival time/);
    
    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.FCFS, 
      processes: [createProcess('P1', 0, 0)] 
    })).toThrow(/strictly positive/);
    
    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.RR, 
      processes: [validProcess],
      config: { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 0 } }
    })).toThrow(/Round Robin requires a positive time quantum/);
    
    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.MLFQ, 
      processes: [validProcess],
      config: { algorithm: AlgorithmIdentifier.MLFQ, mlfq: { quantums: [2, 0, 4] } }
    })).toThrow(/MLFQ quantums must be an array of positive numbers/);

    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.MLFQ, 
      processes: [validProcess],
      config: { algorithm: AlgorithmIdentifier.MLFQ, mlfq: { boostInterval: -5 } }
    })).toThrow(/MLFQ boost interval must be positive/);

    expect(() => runSimulation({ 
      algorithm: AlgorithmIdentifier.PRIORITY, 
      processes: [validProcess],
      config: { algorithm: AlgorithmIdentifier.PRIORITY, priority: { agingRate: -1 } }
    })).toThrow(/Priority aging rate cannot be negative/);
  });

  it('5. Configuration impacts behavior', () => {
    const processes = [createProcess('P1', 0, 5), createProcess('P2', 1, 2)];
    
    // RR
    const rr1 = runSimulation({ algorithm: AlgorithmIdentifier.RR, processes, config: { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 10 } }});
    const rr2 = runSimulation({ algorithm: AlgorithmIdentifier.RR, processes, config: { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 1 } }});
    expect(rr1.contextSwitchCount).not.toBe(rr2.contextSwitchCount);

    // PRIORITY
    const pProcesses = [
      createProcess('P1', 0, 5, { priority: 5 }),
      createProcess('P2', 1, 2, { priority: 1 }),
    ];
    const pri1 = runSimulation({ algorithm: AlgorithmIdentifier.PRIORITY, processes: pProcesses, config: { algorithm: AlgorithmIdentifier.PRIORITY, priority: { isPreemptive: true } }});
    const pri2 = runSimulation({ algorithm: AlgorithmIdentifier.PRIORITY, processes: pProcesses, config: { algorithm: AlgorithmIdentifier.PRIORITY, priority: { isPreemptive: false } }});
    expect(pri1.ganttSegments.length).not.toBe(pri2.ganttSegments.length);
  });

  it('6. Presets and Serialization', () => {
    const presets = getExamplePresets();
    expect(presets.length).toBeGreaterThan(0);

    for (const preset of presets) {
      const originalInputStr = JSON.stringify(preset.input);
      
      const parsedInput = JSON.parse(originalInputStr);
      const result = runSimulation(parsedInput);
      
      expect(result).toBeDefined();
      expect(JSON.stringify(preset.input)).toBe(originalInputStr); // Verify no mutation
      expect(() => JSON.stringify(result)).not.toThrow(); // Verify serializable result
    }
  });

  it('7. Metadata subsystem', () => {
    const meta = getAlgorithmMetadata(AlgorithmIdentifier.FCFS);
    expect(meta.name).toBe('First Come First Serve');
    expect(meta.capabilities.preemptive).toBe(false);

    const caps = getAlgorithmCapabilities(AlgorithmIdentifier.SRTF);
    expect(caps.preemptive).toBe(true);
  });

  it('8. Performance test (200 processes)', () => {
    const processes = [];
    for (let i = 0; i < 200; i++) {
      processes.push(createProcess(`P${i}`, Math.floor(Math.random() * 50), Math.floor(Math.random() * 20) + 1));
    }
    
    const start = performance.now();
    const result = runSimulation({
      algorithm: AlgorithmIdentifier.MLFQ,
      processes,
      config: {
        algorithm: AlgorithmIdentifier.MLFQ,
        mlfq: { quantums: [2, 4, 8], boostInterval: 50 }
      }
    });
    const duration = performance.now() - start;
    
    expect(result.finalProcesses.length).toBe(200);
    expect(duration).toBeLessThan(1000); // Usually takes < 50ms in Node
  });
});
