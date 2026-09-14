import { describe, it, expect } from 'vitest';
import { simulateMLFQ } from '../mlfq';
import { createProcess, AlgorithmConfig, AlgorithmIdentifier } from '../../../domain';

describe('MLFQ Scheduler', () => {

  const mlfqConfig: AlgorithmConfig = {
    algorithm: AlgorithmIdentifier.MLFQ,
    mlfq: {
      quantums: [2, 4, 8],
      boostInterval: 20
    }
  };

  it('Scenario 1 — Simple demotion', () => {
    const processes = [
      createProcess('P1', 0, 10)
    ];

    const result = simulateMLFQ(processes, mlfqConfig);
    
    // P1: Level 0 (0->2), Level 1 (2->6), Level 2 (6->10)
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 10 }
    ]);
  });

  it('Scenario 2 - Multiple processes and higher-level preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 1, 2)
    ];

    const result = simulateMLFQ(processes, mlfqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 4 },
      { pid: 'P1', startTime: 4, endTime: 12 } // Merged 4-8, 8-12
    ]);
  });

  it('Scenario 3 - Priority Boost and Preemption', () => {
    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.MLFQ,
      mlfq: {
        quantums: [2, 4, 8],
        boostInterval: 10
      }
    };

    const processes = [
      createProcess('P1', 0, 15),
      createProcess('P2', 2, 50)
    ];

    const result = simulateMLFQ(processes, config);
    
    expect(result.ganttSegments.slice(0, 9)).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 4 },
      { pid: 'P1', startTime: 4, endTime: 8 },
      { pid: 'P2', startTime: 8, endTime: 10 },
      { pid: 'P1', startTime: 10, endTime: 12 },
      { pid: 'P2', startTime: 12, endTime: 14 },
      { pid: 'P1', startTime: 14, endTime: 18 },
      { pid: 'P2', startTime: 18, endTime: 20 },
      { pid: 'P1', startTime: 20, endTime: 23 } // Merged 20-22, 22-23
    ]);
  });

  it('Quantum preservation across preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 2), 
      createProcess('P3', 5, 2)  
    ];

    const result = simulateMLFQ(processes, mlfqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 4 },
      { pid: 'P1', startTime: 4, endTime: 5 },
      { pid: 'P3', startTime: 5, endTime: 7 },
      { pid: 'P1', startTime: 7, endTime: 14 } // Merged 7-10, 10-14
    ]);
  });
});
