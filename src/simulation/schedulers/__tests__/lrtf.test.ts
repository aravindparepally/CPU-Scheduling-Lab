import { describe, it, expect } from 'vitest';
import { simulateLRTF } from '../lrtf';
import { createProcess } from '../../../domain';

describe('LRTF Scheduler', () => {

  it('Test 1 — Basic preemption', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 2, 10)
    ];

    const result = simulateLRTF(processes);
    
    // Initial behavior check
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2 });
  });

  it('Test 2 — No preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 3)
    ];

    const result = simulateLRTF(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 13 });
  });

  it('Test 3 — Equal remaining time', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 4)
    ];

    const result = simulateLRTF(processes);

    // At t=1, P1 has 4 left. P2 arrives with 4 left. No preemption!
    // Since there are no more arrivals, P1 continues to completion.
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 9 });
  });

  it('Test 4 — Multiple preemptions', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 12),
      createProcess('P3', 4, 15)
    ];

    const result = simulateLRTF(processes);
    
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 4 },
      { pid: 'P3', startTime: 4, endTime: 19 },
      { pid: 'P2', startTime: 19, endTime: 29 },
      { pid: 'P1', startTime: 29, endTime: 37 }
    ]);
  });

  it('Test 5 — Simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 0, 8),
      createProcess('P3', 0, 10)
    ];

    const result = simulateLRTF(processes);

    expect(result.ganttSegments[0].pid).toBe('P3');
  });

  it('Test 6 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 6)];
    const result = simulateLRTF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 11 });
  });

  it('Test 7 — Multiple idle intervals', () => {
    const processes = [
      createProcess('P1', 0, 1),
      createProcess('P2', 2, 1),
      createProcess('P3', 4, 1)
    ];

    const result = simulateLRTF(processes);
    
    expect(result.ganttSegments.length).toBe(5);
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('CPU_IDLE');
    expect(result.ganttSegments[2].pid).toBe('P2');
    expect(result.ganttSegments[3].pid).toBe('CPU_IDLE');
    expect(result.ganttSegments[4].pid).toBe('P3');
  });
  
  it('Test 8 — Completion/arrival boundary', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 5, 10)
    ];

    const result = simulateLRTF(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 15 });
  });

  it('Test 9 — Multiple arrivals at same timestamp', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 2, 10),
      createProcess('P3', 2, 12),
      createProcess('P4', 2, 4)
    ];

    const result = simulateLRTF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P3', startTime: 2 });
  });

  it('Test 10 — Original vs remaining burst', () => {
    const processes = [
      createProcess('P1', 0, 20),
      createProcess('P2', 15, 10)
    ];

    const result = simulateLRTF(processes);

    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    expect(p1.waitingTime).toBe(10);
  });

  it('Test 12 — Response time uses first CPU start', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 2, 10)
    ];

    const result = simulateLRTF(processes);
    
    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    
    expect(p1.responseTime).toBe(0);
    expect(p2.responseTime).toBe(0); 
  });

  it('Test 13 — Determinism', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 2, 10)
    ];

    const result1 = simulateLRTF(processes);
    const result2 = simulateLRTF(processes);

    expect(result1).toEqual(result2);
  });

  it('Test 14 — Future process exclusion', () => {
    const processes = [
      createProcess('P1', 0, 3),
      createProcess('P2', 5, 20)
    ];

    const result = simulateLRTF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 3 });
  });

  it('Test 27 — Manual Mathematical Cross-Check', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 15),
      createProcess('P3', 5, 5),
      createProcess('P4', 10, 20)
    ];

    const result = simulateLRTF(processes);

    // t=0: P1 runs (10)
    // t=2: P2 arrives (15). P1=8. P2 > P1. P2 preempts!
    // P2 runs (15).
    // t=5: P3 arrives (5). P2=12. P1=8. P3=5. P2 is largest. P2 continues.
    // t=10: P4 arrives (20). P2=7. P1=8. P3=5. P4=20. P4 > P2 (and P1). P4 preempts!
    // P4 runs (20). No more arrivals. P4 completes at 30.
    // t=30: Ready: P1=8, P2=7, P3=5. Largest is P1. P1 runs.
    // t=38: P1 completes.
    // t=38: Ready: P2=7, P3=5. Largest is P2. P2 runs.
    // t=45: P2 completes.
    // t=45: Ready: P3=5. P3 runs.
    // t=50: P3 completes.

    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 2 },
      { pid: 'P2', startTime: 2, endTime: 10 },
      { pid: 'P4', startTime: 10, endTime: 30 },
      { pid: 'P1', startTime: 30, endTime: 38 },
      { pid: 'P2', startTime: 38, endTime: 45 },
      { pid: 'P3', startTime: 45, endTime: 50 }
    ]);

    // Metrics:
    // P1: CT=38, TAT=38, WT=28, RT=0
    // P2: CT=45, TAT=43, WT=28, RT=0
    // P3: CT=50, TAT=45, WT=40, RT=40
    // P4: CT=30, TAT=20, WT=0, RT=0

    expect(result.averageTurnaroundTime).toBe((38 + 43 + 45 + 20) / 4); 
    expect(result.averageWaitingTime).toBe((28 + 28 + 40 + 0) / 4); 
    expect(result.averageResponseTime).toBe((0 + 0 + 40 + 0) / 4); 
    expect(result.contextSwitchCount).toBe(5);
  });
});
