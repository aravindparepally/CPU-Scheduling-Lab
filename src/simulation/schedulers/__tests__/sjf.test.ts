import { describe, it, expect } from 'vitest';
import { simulateSJF } from '../sjf';
import { createProcess } from '../../../domain';

describe('SJF Scheduler', () => {

  it('Test 1 — Basic SJF', () => {
    const processes = [
      createProcess('P1', 0, 7),
      createProcess('P2', 0, 3),
      createProcess('P3', 0, 5)
    ];

    const result = simulateSJF(processes);
    
    expect(result.ganttSegments.length).toBe(3);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P2', startTime: 0, endTime: 3 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P3', startTime: 3, endTime: 8 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 8, endTime: 15 });
  });

  it('Test 2 — Different arrival times', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 1, 4),
      createProcess('P3', 2, 2)
    ];

    const result = simulateSJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 8 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 10 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 14 });
  });

  it('Test 3 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 3)];
    const result = simulateSJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 8 });
  });

  it('Test 4 — Non-preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 1, 1)
    ];

    const result = simulateSJF(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 11 });

    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    expect(p2.firstStartTime).toBe(10);
  });

  it('Test 5 — Burst-time ties', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 0, 4),
      createProcess('P3', 1, 2)
    ];

    const result = simulateSJF(processes);

    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P3'); // Shortest BT wins
    expect(result.ganttSegments[2].pid).toBe('P2');
  });

  it('Test 6 — Arrival ordering', () => {
    const processes = [
      createProcess('P3', 2, 2),
      createProcess('P1', 0, 6),
      createProcess('P2', 1, 3)
    ];

    const result = simulateSJF(processes);

    expect(result.ganttSegments[0].pid).toBe('P1');
    // At t=6, P2 and P3 are available. P3 BT=2, P2 BT=3.
    expect(result.ganttSegments[1].pid).toBe('P3');
    expect(result.ganttSegments[2].pid).toBe('P2');
  });

  it('Test 7 — All processes same burst', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 5),
      createProcess('P3', 2, 5)
    ];

    const result = simulateSJF(processes);

    // Because BT is same, tie-breaker uses arrival time.
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 8 — Multiple idle periods', () => {
    const processes = [
      createProcess('P1', 0, 2),
      createProcess('P2', 4, 2),
      createProcess('P3', 8, 2)
    ];

    const result = simulateSJF(processes);
    
    expect(result.ganttSegments.length).toBe(5);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'CPU_IDLE', startTime: 2, endTime: 4 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'CPU_IDLE', startTime: 6, endTime: 8 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 10 });
  });

  it('Test 9 — Determinism', () => {
    const processes = [
      createProcess('P3', 2, 2),
      createProcess('P1', 0, 6),
      createProcess('P2', 1, 3)
    ];

    const result1 = simulateSJF(processes);
    const result2 = simulateSJF(processes);

    expect(result1).toEqual(result2);
  });
});
