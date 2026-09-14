import { describe, it, expect } from 'vitest';
import { simulatePriority } from '../priority';
import { createProcess, AlgorithmIdentifier, AlgorithmConfig } from '../../../domain';

describe('Priority Scheduler', () => {

  it('Test 1 — Static Non-Preemptive', () => {
    const processes = [
      createProcess('P1', 0, 5, { priority: 5 }),
      createProcess('P2', 2, 4, { priority: 1 }),
      createProcess('P3', 3, 2, { priority: 2 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: false, agingRate: 0 }
    };

    const result = simulatePriority(processes, config);
    
    // P1 runs 0->5. 
    // At t=5, P2(pri 1) and P3(pri 2) are ready.
    // P2 runs 5->9. P3 runs 9->11.
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 5 },
      { pid: 'P2', startTime: 5, endTime: 9 },
      { pid: 'P3', startTime: 9, endTime: 11 }
    ]);
  });

  it('Test 2 — Static Preemptive', () => {
    const processes = [
      createProcess('P1', 0, 5, { priority: 5 }),
      createProcess('P2', 2, 4, { priority: 1 }),
      createProcess('P3', 3, 2, { priority: 2 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: true, agingRate: 0 }
    };

    const result = simulatePriority(processes, config);
    
    // P1 runs 0->2.
    // P2 arrives at 2, pri=1 < pri=5. Preempts P1!
    // P2 runs 2->6.
    // P3 arrives at 3, pri=2 > pri=1 (lower priority). Doesn't preempt P2.
    // At 6, P2 completes. Ready: P1(5), P3(2). P3 runs 6->8.
    // P1 runs 8->11.
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 6 },
      { pid: 'P3', startTime: 6, endTime: 8 },
      { pid: 'P1', startTime: 8, endTime: 11 }
    ]);
  });

  it('Test 3 — Equal Priority Behavior (Tie-breaking)', () => {
    const processes = [
      createProcess('P1', 0, 2, { priority: 3 }),
      createProcess('P2', 0, 2, { priority: 3 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: true, agingRate: 0 }
    };

    const result = simulatePriority(processes, config);
    // P1 arrives first (input order).
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
  });

  it('Test 4 — Mathematical Aging Verification (Dynamic Preemptive)', () => {
    const processes = [
      createProcess('P1', 0, 10, { priority: 5 }),
      createProcess('P2', 2, 5, { priority: 6 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: true, agingRate: 1 }
    };

    const result = simulatePriority(processes, config);

    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 4 },
      { pid: 'P2', startTime: 4, endTime: 6 },
      { pid: 'P1', startTime: 6, endTime: 8 },
      { pid: 'P2', startTime: 8, endTime: 10 },
      { pid: 'P1', startTime: 10, endTime: 12 },
      { pid: 'P2', startTime: 12, endTime: 13 },
      { pid: 'P1', startTime: 13, endTime: 15 }
    ]);
  });

  it('Test 5 — Dynamic Non-Preemptive', () => {
    const processes = [
      createProcess('P1', 0, 10, { priority: 5 }),
      createProcess('P2', 1, 2, { priority: 10 }),
      createProcess('P3', 2, 2, { priority: 5 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: false, agingRate: 2 }
    };

    const result = simulatePriority(processes, config);
    // P1 runs 0->10.
    // At t=10:
    // P2 Wait = 9. EP = 10 - 2*9 = -8.
    // P3 Wait = 8. EP = 5 - 2*8 = -11.
    // P3 EP(-11) < P2 EP(-8). P3 runs!
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 10 },
      { pid: 'P3', startTime: 10, endTime: 12 },
      { pid: 'P2', startTime: 12, endTime: 14 }
    ]);
  });

  it('Test 6 — CPU Idle and Future-Process Exclusion', () => {
    const processes = [
      createProcess('P1', 0, 2, { priority: 5 }),
      createProcess('P2', 5, 2, { priority: 1 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: true, agingRate: 1 }
    };

    const result = simulatePriority(processes, config);
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'CPU_IDLE', startTime: 2, endTime: 5 },
      { pid: 'P2', startTime: 5, endTime: 7 }
    ]);
  });

  it('Test 7 — Equal effective priority must not cause preemption', () => {
    const processes = [
      createProcess('P1', 0, 5, { priority: 3 }),
      createProcess('P2', 1, 2, { priority: 3 })
    ];

    const config: AlgorithmConfig = {
      algorithm: AlgorithmIdentifier.PRIORITY,
      priority: { isPreemptive: true, agingRate: 0 }
    };

    const result = simulatePriority(processes, config);
    // Even though it's preemptive, P2 arrives with equal priority 3. 
    // It should not preempt.
    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0].pid).toBe('P1');
  });

});
