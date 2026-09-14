import { describe, it, expect } from 'vitest';
import { simulateFCFS } from '../fcfs';
import { createProcess } from '../../../domain';

describe('FCFS Scheduler', () => {

  it('Test 1 — Basic', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 3),
      createProcess('P3', 2, 2)
    ];

    const result = simulateFCFS(processes);
    
    // Check Gantt
    expect(result.ganttSegments.length).toBe(3);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 8 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 10 });

    // Check Metrics
    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    const p3 = result.finalProcesses.find(p => p.pid === 'P3')!;

    expect(p1.completionTime).toBe(5);
    expect(p1.turnaroundTime).toBe(5);
    expect(p1.waitingTime).toBe(0);
    expect(p1.responseTime).toBe(0);

    expect(p2.completionTime).toBe(8);
    expect(p2.turnaroundTime).toBe(7);
    expect(p2.waitingTime).toBe(4);
    expect(p2.responseTime).toBe(4);

    expect(p3.completionTime).toBe(10);
    expect(p3.turnaroundTime).toBe(8);
    expect(p3.waitingTime).toBe(6);
    expect(p3.responseTime).toBe(6);
  });

  it('Test 2 — CPU Idle', () => {
    const processes = [createProcess('P1', 3, 4)];
    const result = simulateFCFS(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 3 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 3, endTime: 7 });

    const p1 = result.finalProcesses[0];
    expect(p1.completionTime).toBe(7);
    expect(p1.turnaroundTime).toBe(4);
    expect(p1.waitingTime).toBe(0);
    expect(p1.responseTime).toBe(0);
  });

  it('Test 3 — Simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 0, 2),
      createProcess('P3', 0, 3)
    ];

    const result = simulateFCFS(processes);
    
    // P1 -> P2 -> P3 based on input order tie-breaker
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 4 — Arrival during execution (No preemption)', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 1)
    ];

    const result = simulateFCFS(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 11 });

    // P2 should not preempt P1
    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    expect(p2.firstStartTime).toBe(10); 
  });

  it('Test 5 — Multiple idle periods', () => {
    const processes = [
      createProcess('P1', 0, 2),
      createProcess('P2', 4, 2),
      createProcess('P3', 8, 2)
    ];

    const result = simulateFCFS(processes);

    const gantt = result.ganttSegments;
    expect(gantt.length).toBe(5);
    expect(gantt[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(gantt[1]).toMatchObject({ pid: 'CPU_IDLE', startTime: 2, endTime: 4 });
    expect(gantt[2]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 6 });
    expect(gantt[3]).toMatchObject({ pid: 'CPU_IDLE', startTime: 6, endTime: 8 });
    expect(gantt[4]).toMatchObject({ pid: 'P3', startTime: 8, endTime: 10 });
  });

  it('Test 6 — Burst-time ties', () => {
    // Burst times are identical, FCFS shouldn't care anyway, it cares about arrival time.
    const processes = [
      createProcess('P3', 2, 5),
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 5)
    ];

    const result = simulateFCFS(processes);

    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 7 — Arrival-time ordering', () => {
    const processes = [
      createProcess('P3', 5, 2),
      createProcess('P1', 0, 2),
      createProcess('P2', 2, 2)
    ];

    const result = simulateFCFS(processes);

    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('CPU_IDLE');
    expect(result.ganttSegments[3].pid).toBe('P3');
  });

  it('Test 8 - Determinism Test', () => {
    const processes = [
      createProcess('P3', 5, 2),
      createProcess('P1', 0, 2),
      createProcess('P2', 2, 2)
    ];

    const result1 = simulateFCFS(processes);
    const result2 = simulateFCFS(processes);
    
    // Everything should be deeply equal
    expect(result1).toEqual(result2);
  });

  it('Test 9 - Metrics Cross-Check', () => {
    // Manually calculating:
    // P1 (AT=0, BT=3) -> Runs 0 to 3. CT=3, TAT=3, WT=0, RT=0.
    // P2 (AT=2, BT=4) -> Runs 3 to 7. CT=7, TAT=5, WT=1, RT=1.
    // P3 (AT=4, BT=2) -> Runs 7 to 9. CT=9, TAT=5, WT=3, RT=3.
    // Averages:
    // TAT: (3 + 5 + 5) / 3 = 13/3 = 4.333
    // WT: (0 + 1 + 3) / 3 = 4/3 = 1.333
    // RT: (0 + 1 + 3) / 3 = 4/3 = 1.333
    const processes = [
      createProcess('P1', 0, 3),
      createProcess('P2', 2, 4),
      createProcess('P3', 4, 2)
    ];

    const result = simulateFCFS(processes);

    expect(result.averageTurnaroundTime).toBeCloseTo(13 / 3);
    expect(result.averageWaitingTime).toBeCloseTo(4 / 3);
    expect(result.averageResponseTime).toBeCloseTo(4 / 3);
    
    expect(result.cpuUtilization).toBe(100);
    expect(result.contextSwitchCount).toBe(2);
    expect(result.throughput).toBeCloseTo(3 / 9);
  });
});
