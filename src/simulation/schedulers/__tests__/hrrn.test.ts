import { describe, it, expect } from 'vitest';
import { simulateHRRN } from '../hrrn';
import { createProcess } from '../../../domain';

describe('HRRN Scheduler', () => {

  it('Test 1 — Basic HRRN', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 2, 4),
      createProcess('P3', 4, 1)
    ];

    const result = simulateHRRN(processes);
    
    // t=0: P1 runs (0->5)
    // t=5:
    // P2: Wait=3, BT=4. RR = 7/4 = 1.75
    // P3: Wait=1, BT=1. RR = 2/1 = 2.0
    // P3 runs (5->6).
    // t=6:
    // P2: Wait=4, BT=4. RR = 8/4 = 2.0
    // P2 runs (6->10).
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 5 },
      { pid: 'P3', startTime: 5, endTime: 6 },
      { pid: 'P2', startTime: 6, endTime: 10 }
    ]);
  });

  it('Test 2 — All simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 0, 2),
      createProcess('P3', 0, 8)
    ];

    const result = simulateHRRN(processes);

    // All RR=1 at t=0. Tie-breaker goes to arrival (all 0), then original order.
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 3 — Response ratio changes with waiting', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 1, 2),
      createProcess('P3', 1, 6),
      createProcess('P4', 5, 1),
      createProcess('P5', 6, 2)
    ];

    const result = simulateHRRN(processes);
    
    // t=0: P1 (0->4)
    // t=4: P2(Wait=3, RR=2.5), P3(Wait=3, RR=1.5). P2 runs (4->6).
    // t=6: P3(Wait=5, RR=1.83), P4(Wait=1, RR=2.0). P4 runs (6->7).
    // t=7: P3(Wait=6, RR=2.0), P5(Wait=1, RR=1.5). P3 runs (7->13).
    // t=13: P5(Wait=7, RR=4.5). P5 runs (13->15).
    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 4 },
      { pid: 'P2', startTime: 4, endTime: 6 },
      { pid: 'P4', startTime: 6, endTime: 7 },
      { pid: 'P3', startTime: 7, endTime: 13 },
      { pid: 'P5', startTime: 13, endTime: 15 }
    ]);
  });

  it('Test 4 — Non-preemption', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 1, 1)
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 10, endTime: 11 });
  });

  it('Test 5 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 4)];
    const result = simulateHRRN(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 9 });
  });

  it('Test 6 — Multiple idle intervals', () => {
    const processes = [
      createProcess('P1', 0, 2),
      createProcess('P2', 4, 2),
      createProcess('P3', 8, 2)
    ];

    const result = simulateHRRN(processes);
    
    expect(result.ganttSegments.length).toBe(5);
    expect(result.ganttSegments[1].pid).toBe('CPU_IDLE');
    expect(result.ganttSegments[3].pid).toBe('CPU_IDLE');
  });

  it('Test 7 — Completion/arrival boundary', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 5, 10)
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 5, endTime: 15 });
  });

  it('Test 8 — Future process exclusion', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 20, 10)
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'CPU_IDLE', startTime: 5, endTime: 20 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P2', startTime: 20, endTime: 30 });
  });

  it('Test 9 & 12 — Response ratio calculation & explanation', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 2, 4),
      createProcess('P3', 4, 1)
    ];

    const result = simulateHRRN(processes);
    
    const decision = result.schedulingDecisions[1];
    expect(decision.timestamp).toBe(5);
    expect(decision.selectedProcess).toBe('P3');
    expect(decision.criterionValues['P2']).toBe('RR=1.75 (W=3, BT=4)');
    expect(decision.criterionValues['P3']).toBe('RR=2 (W=1, BT=1)');
  });

  it('Test 10 — Floating-point response ratios', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 1, 3), // Wait 9. RR = 12/3 = 4.0
      createProcess('P3', 2, 7)  // Wait 8. RR = 15/7 = 2.14
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 11 — Equal response ratios', () => {
    const processes = [
      createProcess('P1', 0, 10),
      createProcess('P2', 2, 8), // Wait=8, BT=8 -> RR = 2.0
      createProcess('P3', 2, 8)  // Wait=8, BT=8 -> RR = 2.0
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 14 — Determinism', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 1, 2),
      createProcess('P3', 1, 6)
    ];

    const result1 = simulateHRRN(processes);
    const result2 = simulateHRRN(processes);

    expect(result1).toEqual(result2);
  });

  it('Test 13 & 15 — Manual Mathematical Cross-Check & Metrics', () => {
    const processes = [
      createProcess('P1', 0, 3),
      createProcess('P2', 2, 4),
      createProcess('P3', 4, 1),
      createProcess('P4', 6, 2)
    ];

    const result = simulateHRRN(processes);

    expect(result.ganttSegments).toMatchObject([
      { pid: 'P1', startTime: 0, endTime: 3 },
      { pid: 'P2', startTime: 3, endTime: 7 },
      { pid: 'P3', startTime: 7, endTime: 8 },
      { pid: 'P4', startTime: 8, endTime: 10 }
    ]);

    expect(result.averageTurnaroundTime).toBe(4.0); 
    expect(result.averageWaitingTime).toBe(1.5); 
    expect(result.averageResponseTime).toBe(1.5); 
    expect(result.contextSwitchCount).toBe(3);
  });
});
