import { describe, it, expect } from 'vitest';
import { simulateSRTF } from '../srtf';
import { createProcess } from '../../../domain';

describe('SRTF Scheduler', () => {

  it('Test 1 — Basic preemption', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 2, 3)
    ];

    const result = simulateSRTF(processes);
    
    expect(result.ganttSegments.length).toBe(3);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2, endTime: 5 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 11 });
  });

  it('Test 2 — No preemption', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 2, 10)
    ];

    const result = simulateSRTF(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 15 });
  });

  it('Test 3 — Multiple preemptions', () => {
    const processes = [
      createProcess('P1', 0, 12),
      createProcess('P2', 2, 5),
      createProcess('P3', 4, 2)
    ];

    const result = simulateSRTF(processes);
    
    expect(result.ganttSegments.length).toBe(5);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2, endTime: 4 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P3', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'P2', startTime: 6, endTime: 9 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P1', startTime: 9, endTime: 19 });

    // Test 8 - Verify multiple execution segments
    const p1Segments = result.ganttSegments.filter(s => s.pid === 'P1');
    expect(p1Segments.length).toBe(2);
    const p2Segments = result.ganttSegments.filter(s => s.pid === 'P2');
    expect(p2Segments.length).toBe(2);
  });

  it('Test 4 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 4)];
    const result = simulateSRTF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 9 });
  });

  it('Test 5 — Simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 0, 4),
      createProcess('P3', 0, 2)
    ];

    const result = simulateSRTF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P3', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2, endTime: 6 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 6, endTime: 14 });
  });

  it('Test 6 — Same remaining time (Deterministic tie behavior)', () => {
    const processes = [
      createProcess('P1', 0, 6),
      createProcess('P2', 3, 3)
    ];

    const result = simulateSRTF(processes);

    // At t=3, P1 remaining = 3. P2 remaining = 3.
    // Our policy: do not preempt if remaining time is equal.
    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 6 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 6, endTime: 9 });
  });

  it('Test 7 — Completion/arrival boundary', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 5, 4)
    ];

    const result = simulateSRTF(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 9 });
  });

  it('Test 9 — Response time uses first CPU start', () => {
    const processes = [
      createProcess('P1', 0, 12),
      createProcess('P2', 2, 5),
      createProcess('P3', 4, 2)
    ];

    const result = simulateSRTF(processes);

    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    
    // P1 started at 0
    expect(p1.firstStartTime).toBe(0);
    expect(p1.responseTime).toBe(0); // 0 - 0

    // P2 started at 2
    expect(p2.firstStartTime).toBe(2);
    expect(p2.responseTime).toBe(0); // 2 - 2
  });

  it('Test 10 — Waiting time uses original burst time', () => {
    const processes = [
      createProcess('P1', 0, 12),
      createProcess('P2', 2, 5),
      createProcess('P3', 4, 2)
    ];

    const result = simulateSRTF(processes);
    
    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    
    expect(p1.completionTime).toBe(19);
    expect(p1.turnaroundTime).toBe(19); // 19 - 0
    expect(p1.waitingTime).toBe(7); // 19 - 12 (original BT)
  });

  it('Test 11 — Determinism', () => {
    const processes = [
      createProcess('P1', 0, 12),
      createProcess('P2', 2, 5),
      createProcess('P3', 4, 2)
    ];

    const result1 = simulateSRTF(processes);
    const result2 = simulateSRTF(processes);

    expect(result1).toEqual(result2);
  });

  it('Test 12 - Mathematical Cross-Check', () => {
    // Process  AT  BT
    // P1       0   7
    // P2       2   4
    // P3       4   1
    // P4       5   4
    
    // Execution:
    // t=0: P1 runs (rem=7).
    // t=2: P2 arrives (rem=4). P1 (rem=5). P2 preempts P1. P2 runs.
    // t=4: P3 arrives (rem=1). P2 (rem=2). P3 preempts P2. P3 runs.
    // t=5: P3 completes. P4 arrives (rem=4).
    //      Ready: P2(2), P1(5), P4(4).
    //      Shortest is P2. P2 runs.
    // t=7: P2 completes.
    //      Ready: P4(4), P1(5).
    //      Shortest is P4. P4 runs.
    // t=11: P4 completes.
    //       Ready: P1(5). P1 runs.
    // t=16: P1 completes.

    // Gantt:
    // P1: 0->2
    // P2: 2->4
    // P3: 4->5
    // P2: 5->7
    // P4: 7->11
    // P1: 11->16
    
    // Metrics:
    // P1: CT=16, TAT=16-0=16, WT=16-7=9, RT=0-0=0
    // P2: CT=7, TAT=7-2=5, WT=5-4=1, RT=2-2=0
    // P3: CT=5, TAT=5-4=1, WT=1-1=0, RT=4-4=0
    // P4: CT=11, TAT=11-5=6, WT=6-4=2, RT=7-5=2

    // Averages:
    // TAT: (16 + 5 + 1 + 6) / 4 = 28 / 4 = 7
    // WT: (9 + 1 + 0 + 2) / 4 = 12 / 4 = 3
    // RT: (0 + 0 + 0 + 2) / 4 = 2 / 4 = 0.5
    // Context switches: P1->P2 (1), P2->P3 (2), P3->P2 (3), P2->P4 (4), P4->P1 (5) = 5.
    
    const processes = [
      createProcess('P1', 0, 7),
      createProcess('P2', 2, 4),
      createProcess('P3', 4, 1),
      createProcess('P4', 5, 4)
    ];

    const result = simulateSRTF(processes);

    expect(result.averageTurnaroundTime).toBe(7);
    expect(result.averageWaitingTime).toBe(3);
    expect(result.averageResponseTime).toBe(0.5);
    expect(result.contextSwitchCount).toBe(5);

    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
    expect(result.ganttSegments[3].pid).toBe('P2');
    expect(result.ganttSegments[4].pid).toBe('P4');
    expect(result.ganttSegments[5].pid).toBe('P1');
  });

});
