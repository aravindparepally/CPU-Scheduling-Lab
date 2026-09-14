import { describe, it, expect } from 'vitest';
import { simulateLJF } from '../ljf';
import { createProcess } from '../../../domain';

describe('LJF Scheduler', () => {

  it('Test 1 — Basic LJF', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 0, 8),
      createProcess('P3', 0, 5)
    ];

    const result = simulateLJF(processes);
    
    expect(result.ganttSegments.length).toBe(3);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P2', startTime: 0, endTime: 8 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 13 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 13, endTime: 17 });
  });

  it('Test 2 — Different arrivals', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 10),
      createProcess('P3', 2, 7)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 15 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P3', startTime: 15, endTime: 22 });
  });

  it('Test 3 — Non-preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 20)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 30 });
    
    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    expect(p1.completionTime).toBe(10);
  });

  it('Test 4 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 4)];
    const result = simulateLJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 9 });
  });

  it('Test 5 — Simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 0, 10),
      createProcess('P3', 0, 7)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments[0].pid).toBe('P2');
    expect(result.ganttSegments[1].pid).toBe('P3');
    expect(result.ganttSegments[2].pid).toBe('P1');
  });

  it('Test 6 — Burst-time ties', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 5),
      createProcess('P3', 2, 5)
    ];

    const result = simulateLJF(processes);

    // Because BT is same, tie-breaker uses arrival time.
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 7 — Arrival-time ordering', () => {
    const processes = [
      createProcess('P3', 2, 2),
      createProcess('P1', 0, 6),
      createProcess('P2', 1, 3)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments[0].pid).toBe('P1');
    // At t=6, P2 and P3 are available. P2 BT=3, P3 BT=2. LJF prefers P2.
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 8 — Multiple idle periods', () => {
    const processes = [
      createProcess('P1', 0, 2),
      createProcess('P2', 4, 2),
      createProcess('P3', 8, 2)
    ];

    const result = simulateLJF(processes);
    
    expect(result.ganttSegments.length).toBe(5);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'CPU_IDLE', startTime: 2, endTime: 4 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'CPU_IDLE', startTime: 6, endTime: 8 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 10 });
  });
  
  it('Test 9 — Completion/arrival boundary', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 5, 10)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 15 });
  });

  it('Test 10 — Longest future process', () => {
    const processes = [
      createProcess('P1', 0, 3),
      createProcess('P2', 5, 20)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments.length).toBe(3);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 3 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'CPU_IDLE', startTime: 3, endTime: 5 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 25 });
  });

  it('Test 12 — Determinism', () => {
    const processes = [
      createProcess('P3', 2, 2),
      createProcess('P1', 0, 6),
      createProcess('P2', 1, 3)
    ];

    const result1 = simulateLJF(processes);
    const result2 = simulateLJF(processes);

    expect(result1).toEqual(result2);
  });

  it('Test 20 — Manual Mathematical Cross-Check', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 2, 8),
      createProcess('P3', 3, 2),
      createProcess('P4', 12, 5)
    ];

    const result = simulateLJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 4 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 12 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P4', startTime: 12, endTime: 17 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'P3', startTime: 17, endTime: 19 });

    expect(result.averageTurnaroundTime).toBe(8.75); // 35/4
    expect(result.averageWaitingTime).toBe(4); // 16/4
    expect(result.averageResponseTime).toBe(4); // 16/4
    expect(result.contextSwitchCount).toBe(3);
  });
});
