import { describe, it, expect } from 'vitest';
import { simulateRR } from '../rr';
import { createProcess, AlgorithmIdentifier, SimulationEventType } from '../../../domain';

const config = {
  algorithm: AlgorithmIdentifier.RR,
  roundRobin: { timeQuantum: 2 }
};

describe('Round Robin Scheduler', () => {

  it('Test 1 — Basic Round Robin', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 0, 3),
      createProcess('P3', 0, 2)
    ];

    const result = simulateRR(processes, config);
    
    expect(result.ganttSegments.length).toBe(6);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2, endTime: 4 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P3', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'P1', startTime: 6, endTime: 8 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P2', startTime: 8, endTime: 9 });
    expect(result.ganttSegments[5]).toMatchObject({ pid: 'P1', startTime: 9, endTime: 10 });
  });

  it('Test 2 — Different arrivals', () => {
    const processes = [
      createProcess('P1', 0, 7),
      createProcess('P2', 1, 4),
      createProcess('P3', 3, 2)
    ];

    const result = simulateRR(processes, config);

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 2 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 2, endTime: 4 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'P3', startTime: 6, endTime: 8 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P2', startTime: 8, endTime: 10 });
    // P1 runs 10-12, then requeues but is alone, so Gantt is contiguous 10-13!
    expect(result.ganttSegments[5]).toMatchObject({ pid: 'P1', startTime: 10, endTime: 13 });
  });

  it('Test 3 — Arrival during quantum', () => {
    const processes = [
      createProcess('P1', 0, 8),
      createProcess('P2', 2, 3)
    ];

    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 4 } });

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 4 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 7 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 7, endTime: 11 });
  });

  it('Test 4 — Arrival exactly at quantum expiration', () => {
    const processes = [
      createProcess('P1', 0, 6),
      createProcess('P2', 4, 2)
    ];

    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 4 } });

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 4 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 4, endTime: 6 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P1', startTime: 6, endTime: 8 });
  });

  it('Test 5 — Process completes exactly at quantum', () => {
    const processes = [createProcess('P1', 0, 4)];
    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 4 } });

    expect(result.ganttSegments.length).toBe(1);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 4 });

    const completionEvents = result.simulationEvents.filter(e => e.type === SimulationEventType.PROCESS_COMPLETION);
    expect(completionEvents.length).toBe(1);
    const expireEvents = result.simulationEvents.filter(e => e.type === SimulationEventType.TIME_QUANTUM_EXPIRED);
    expect(expireEvents.length).toBe(0);
  });

  it('Test 6 — Quantum greater than burst', () => {
    const processes = [createProcess('P1', 0, 3)];
    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 10 } });

    expect(result.ganttSegments.length).toBe(1);
    expect(result.ganttSegments[0].endTime).toBe(3);
  });

  it('Test 7 — Quantum equals burst', () => {
    const processes = [createProcess('P1', 0, 4)];
    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 4 } });

    expect(result.ganttSegments.length).toBe(1);
    expect(result.ganttSegments[0].endTime).toBe(4);
  });

  it('Test 8 — Quantum = 1', () => {
    const processes = [
      createProcess('P1', 0, 4),
      createProcess('P2', 0, 3)
    ];
    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 1 } });

    expect(result.ganttSegments.length).toBe(7);
    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P1');
    expect(result.ganttSegments[3].pid).toBe('P2');
    expect(result.ganttSegments[4].pid).toBe('P1');
    expect(result.ganttSegments[5].pid).toBe('P2');
    expect(result.ganttSegments[6].pid).toBe('P1');
  });

  it('Test 9 — CPU idle', () => {
    const processes = [createProcess('P1', 5, 3)];
    const result = simulateRR(processes, config);

    expect(result.ganttSegments.length).toBe(2);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'CPU_IDLE', startTime: 0, endTime: 5 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P1', startTime: 5, endTime: 8 });
  });

  it('Test 10 — Single process', () => {
    const processes = [createProcess('P1', 0, 10)];
    const result = simulateRR(processes, config);

    expect(result.ganttSegments.length).toBe(1);
    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 10 });
    
    const expireEvents = result.simulationEvents.filter(e => e.type === SimulationEventType.TIME_QUANTUM_EXPIRED);
    expect(expireEvents.length).toBeGreaterThan(0);
  });

  it('Test 11 — Multiple simultaneous arrivals', () => {
    const processes = [
      createProcess('P1', 0, 2),
      createProcess('P2', 0, 2),
      createProcess('P3', 0, 2)
    ];
    const result = simulateRR(processes, config);

    expect(result.ganttSegments[0].pid).toBe('P1');
    expect(result.ganttSegments[1].pid).toBe('P2');
    expect(result.ganttSegments[2].pid).toBe('P3');
  });

  it('Test 13 — Response time uses first CPU start', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 0, 3)
    ];
    const result = simulateRR(processes, config);

    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    const p2 = result.finalProcesses.find(p => p.pid === 'P2')!;
    
    expect(p1.responseTime).toBe(0);
    expect(p2.responseTime).toBe(2); // Starts at 2
  });

  it('Test 14 — Waiting time uses original burst time', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 0, 3)
    ];
    const result = simulateRR(processes, config);

    const p1 = result.finalProcesses.find(p => p.pid === 'P1')!;
    expect(p1.completionTime).toBe(8);
    expect(p1.turnaroundTime).toBe(8);
    expect(p1.waitingTime).toBe(3); // 8 - 5
  });

  it('Test 15 — Determinism', () => {
    const processes = [
      createProcess('P1', 0, 7),
      createProcess('P2', 1, 4),
      createProcess('P3', 3, 2)
    ];

    const result1 = simulateRR(processes, config);
    const result2 = simulateRR(processes, config);

    expect(result1).toEqual(result2);
  });

  it('Test 26 — Manual Mathematical Validation', () => {
    const processes = [
      createProcess('P1', 0, 5),
      createProcess('P2', 1, 6),
      createProcess('P3', 2, 3)
    ];

    const result = simulateRR(processes, { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 3 } });

    expect(result.ganttSegments[0]).toMatchObject({ pid: 'P1', startTime: 0, endTime: 3 });
    expect(result.ganttSegments[1]).toMatchObject({ pid: 'P2', startTime: 3, endTime: 6 });
    expect(result.ganttSegments[2]).toMatchObject({ pid: 'P3', startTime: 6, endTime: 9 });
    expect(result.ganttSegments[3]).toMatchObject({ pid: 'P1', startTime: 9, endTime: 11 });
    expect(result.ganttSegments[4]).toMatchObject({ pid: 'P2', startTime: 11, endTime: 14 });

    expect(result.averageTurnaroundTime).toBeCloseTo(31 / 3);
    expect(result.averageWaitingTime).toBeCloseTo(17 / 3);
    expect(result.averageResponseTime).toBe(2);
    expect(result.contextSwitchCount).toBe(4);
  });

  it('Throws error on invalid quantum', () => {
    expect(() => simulateRR([], { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: 0 } })).toThrow();
    expect(() => simulateRR([], { algorithm: AlgorithmIdentifier.RR, roundRobin: { timeQuantum: -5 } })).toThrow();
    expect(() => simulateRR([], { algorithm: AlgorithmIdentifier.RR })).toThrow();
  });
});
