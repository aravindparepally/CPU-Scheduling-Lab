import { describe, it, expect } from 'vitest';
import { simulateMLQ } from '../mlq';
import { createProcess, ProcessType, AlgorithmConfig, AlgorithmIdentifier } from '../../../domain';

describe('MLQ Scheduler', () => {

  const mlqConfig: AlgorithmConfig = {
    algorithm: AlgorithmIdentifier.MULTILEVEL_QUEUE,
    mlq: {
      batchTimeQuantum: 2,
      globalPreemption: true,
      studentPriorityConfig: {
        isPreemptive: false,
        agingRate: 0
      }
    }
  };

  it('Test 1 — Queue Assignment and Global Priority (Scenario 1)', () => {
    const processes = [
      createProcess('P3', 0, 2, { processType: ProcessType.BATCH }),
      createProcess('P1', 0, 2, { processType: ProcessType.SYSTEM }),
      createProcess('P4', 0, 2, { processType: ProcessType.STUDENT }),
      createProcess('P2', 0, 2, { processType: ProcessType.INTERACTIVE })
    ];

    const result = simulateMLQ(processes, mlqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 4 },
      { pid: 'P3', startTime: 4, endTime: 6 },
      { pid: 'P4', startTime: 6, endTime: 8 }
    ]);
  });

  it('Test 2 — Cross-queue Preemption (Scenario 2)', () => {
    const processes = [
      createProcess('P4', 0, 5, { processType: ProcessType.STUDENT }),
      createProcess('P3', 1, 4, { processType: ProcessType.BATCH }),
      createProcess('P2', 2, 3, { processType: ProcessType.INTERACTIVE }),
      createProcess('P1', 3, 2, { processType: ProcessType.SYSTEM })
    ];

    const result = simulateMLQ(processes, mlqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P4', startTime: 0, endTime: 1 },
      { pid: 'P3', startTime: 1, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 3 },
      { pid: 'P1', startTime: 3, endTime: 5 },
      { pid: 'P2', startTime: 5, endTime: 7 },
      { pid: 'P3', startTime: 7, endTime: 10 }, // Merged: 7-8 and 8-10
      { pid: 'P4', startTime: 10, endTime: 14 }
    ]);
  });

  it('Test 3 - Batch RR combined with higher-priority queue arrivals (Scenario 3)', () => {
    const processes = [
      createProcess('P1', 0, 5, { processType: ProcessType.BATCH }),
      createProcess('P2', 3, 2, { processType: ProcessType.SYSTEM })
    ];

    const result = simulateMLQ(processes, mlqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 3 }, // Merged: 0-2 (TQ) + 2-3 (Preempted)
      { pid: 'P2', startTime: 3, endTime: 5 }, 
      { pid: 'P1', startTime: 5, endTime: 7 }  // Merged: 5-6 (resume) + 6-7 (final burst)
    ]);
  });

  it('Test 4 — System Queue (FCFS)', () => {
    const processes = [
      createProcess('P1', 0, 3, { processType: ProcessType.SYSTEM }),
      createProcess('P2', 1, 2, { processType: ProcessType.SYSTEM })
    ];
    const result = simulateMLQ(processes, mlqConfig);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 3 },
      { pid: 'P2', startTime: 3, endTime: 5 }
    ]);
  });

  it('Test 5 — Interactive Queue (SJF non-preemptive)', () => {
    const processes = [
      createProcess('P1', 0, 10, { processType: ProcessType.INTERACTIVE }),
      createProcess('P2', 1, 2, { processType: ProcessType.INTERACTIVE }),
      createProcess('P3', 2, 1, { processType: ProcessType.INTERACTIVE })
    ];
    const result = simulateMLQ(processes, mlqConfig);
    
    // P1 runs to 10. Then P3 (BT=1) runs to 11. Then P2 (BT=2) runs to 13.
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 10 },
      { pid: 'P3', startTime: 10, endTime: 11 },
      { pid: 'P2', startTime: 11, endTime: 13 }
    ]);
  });

  it('Test 6 — Student Queue (Priority Preemptive)', () => {
    const processes = [
      createProcess('P1', 0, 10, { processType: ProcessType.STUDENT, priority: 5 }),
      createProcess('P2', 2, 5, { processType: ProcessType.STUDENT, priority: 1 })
    ];
    const conf: AlgorithmConfig = {
      ...mlqConfig,
      mlq: { ...mlqConfig.mlq, studentPriorityConfig: { isPreemptive: true } }
    };
    const result = simulateMLQ(processes, conf);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 7 },
      { pid: 'P1', startTime: 7, endTime: 15 }
    ]);
  });

  it('Test 7 — Equal queue level does not cause global preemption', () => {
    const processes = [
      createProcess('P1', 0, 5, { processType: ProcessType.SYSTEM }),
      createProcess('P2', 2, 2, { processType: ProcessType.SYSTEM })
    ];
    const result = simulateMLQ(processes, mlqConfig);
    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0].pid).toBe('P1');
  });

  it('Test 8 — Lower priority queue does not preempt', () => {
    const processes = [
      createProcess('P1', 0, 5, { processType: ProcessType.SYSTEM }),
      createProcess('P2', 2, 2, { processType: ProcessType.STUDENT })
    ];
    const result = simulateMLQ(processes, mlqConfig);
    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0].pid).toBe('P1');
  });

  it('Test 9 — CPU Idle', () => {
    const processes = [
      createProcess('P1', 5, 2, { processType: ProcessType.INTERACTIVE })
    ];
    const result = simulateMLQ(processes, mlqConfig);
    expect(result.ganttSegments).toMatchObject([
      { pid: 'CPU_IDLE', startTime: 0, endTime: 5 },
      { pid: 'P1', startTime: 5, endTime: 7 }
    ]);
  });
});
