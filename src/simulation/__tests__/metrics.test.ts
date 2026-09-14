import { describe, it, expect } from 'vitest';
import { createProcess, GanttSegment } from '../../domain';
import {
  calculateProcessMetrics,
  calculateAverageWaitingTime,
  calculateAverageTurnaroundTime,
  calculateAverageResponseTime,
  calculateCpuUtilization,
  calculateThroughput,
  calculateContextSwitches
} from '../metrics';

describe('Scheduling Metrics', () => {
  describe('Case 1 — Single process', () => {
    it('calculates metrics for a single non-preempted process', () => {
      const p1 = createProcess('P1', 0, 5);
      const gantt: GanttSegment[] = [
        { pid: 'P1', startTime: 0, endTime: 5, duration: 5 }
      ];

      const result = calculateProcessMetrics(p1, gantt);

      expect(result.firstStartTime).toBe(0);
      expect(result.completionTime).toBe(5);
      expect(result.turnaroundTime).toBe(5);
      expect(result.waitingTime).toBe(0);
      expect(result.responseTime).toBe(0);
      
      expect(calculateCpuUtilization(gantt)).toBe(100);
      expect(calculateContextSwitches(gantt)).toBe(0);
      expect(calculateThroughput([result], gantt)).toBe(1 / 5);
    });
  });

  describe('Case 2 — CPU idle', () => {
    it('calculates metrics with initial CPU idle time', () => {
      const p1 = createProcess('P1', 3, 4);
      const gantt: GanttSegment[] = [
        { pid: 'CPU_IDLE', startTime: 0, endTime: 3, duration: 3 },
        { pid: 'P1', startTime: 3, endTime: 7, duration: 4 }
      ];

      const result = calculateProcessMetrics(p1, gantt);

      expect(result.firstStartTime).toBe(3);
      expect(result.completionTime).toBe(7);
      expect(result.turnaroundTime).toBe(4);
      expect(result.waitingTime).toBe(0);
      expect(result.responseTime).toBe(0);

      expect(calculateCpuUtilization(gantt)).toBeCloseTo((4 / 7) * 100);
      expect(calculateContextSwitches(gantt)).toBe(0);
    });
  });

  describe('Case 3 — Two processes FCFS', () => {
    it('calculates metrics for two back-to-back processes', () => {
      const p1 = createProcess('P1', 0, 5);
      const p2 = createProcess('P2', 1, 3);
      
      const gantt: GanttSegment[] = [
        { pid: 'P1', startTime: 0, endTime: 5, duration: 5 },
        { pid: 'P2', startTime: 5, endTime: 8, duration: 3 }
      ];

      const r1 = calculateProcessMetrics(p1, gantt);
      const r2 = calculateProcessMetrics(p2, gantt);

      expect(r1.firstStartTime).toBe(0);
      expect(r1.completionTime).toBe(5);
      expect(r1.turnaroundTime).toBe(5);
      expect(r1.waitingTime).toBe(0);
      expect(r1.responseTime).toBe(0);

      expect(r2.firstStartTime).toBe(5);
      expect(r2.completionTime).toBe(8);
      expect(r2.turnaroundTime).toBe(7);
      expect(r2.waitingTime).toBe(4);
      expect(r2.responseTime).toBe(4);

      expect(calculateAverageWaitingTime([r1, r2])).toBe(2);
      expect(calculateAverageTurnaroundTime([r1, r2])).toBe(6);
      expect(calculateAverageResponseTime([r1, r2])).toBe(2);
      expect(calculateContextSwitches(gantt)).toBe(1);
    });
  });

  describe('Case 4 — Preemptive execution', () => {
    it('calculates metrics for preempted processes using original burst time', () => {
      const p1 = createProcess('P1', 0, 8);
      const p2 = createProcess('P2', 2, 3);

      const gantt: GanttSegment[] = [
        { pid: 'P1', startTime: 0, endTime: 2, duration: 2 },
        { pid: 'P2', startTime: 2, endTime: 5, duration: 3 },
        { pid: 'P1', startTime: 5, endTime: 11, duration: 6 }
      ];

      const r1 = calculateProcessMetrics(p1, gantt);
      const r2 = calculateProcessMetrics(p2, gantt);

      expect(r1.firstStartTime).toBe(0);
      expect(r1.completionTime).toBe(11);
      expect(r1.turnaroundTime).toBe(11); // 11 - 0
      expect(r1.waitingTime).toBe(3); // 11 - 8
      expect(r1.responseTime).toBe(0); // 0 - 0

      expect(r2.firstStartTime).toBe(2);
      expect(r2.completionTime).toBe(5);
      expect(r2.turnaroundTime).toBe(3); // 5 - 2
      expect(r2.waitingTime).toBe(0); // 3 - 3
      expect(r2.responseTime).toBe(0); // 2 - 2

      expect(calculateContextSwitches(gantt)).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty process array or gantt chart safely', () => {
      expect(calculateAverageWaitingTime([])).toBe(0);
      expect(calculateCpuUtilization([])).toBe(0);
      expect(calculateThroughput([], [])).toBe(0);
      expect(calculateContextSwitches([])).toBe(0);
    });

    it('handles a process that never executed', () => {
      const p1 = createProcess('P1', 0, 5);
      const result = calculateProcessMetrics(p1, []);
      
      expect(result.firstStartTime).toBeNull();
      expect(result.completionTime).toBeNull();
      expect(result.turnaroundTime).toBeNull();
      expect(result.waitingTime).toBeNull();
      expect(result.responseTime).toBeNull();
    });

    it('context switch ignores multiple segments of the same process', () => {
      const gantt: GanttSegment[] = [
        { pid: 'P1', startTime: 0, endTime: 2, duration: 2 },
        { pid: 'P1', startTime: 2, endTime: 4, duration: 2 }, 
        { pid: 'CPU_IDLE', startTime: 4, endTime: 6, duration: 2 },
        { pid: 'P1', startTime: 6, endTime: 8, duration: 2 }, 
      ];

      expect(calculateContextSwitches(gantt)).toBe(0);
    });

    it('finalizes a full simulation correctly', async () => {
      const { finalizeSimulationResult } = await import('../metrics/finalize');
      const p1 = createProcess('P1', 0, 5);
      const gantt: GanttSegment[] = [
        { pid: 'P1', startTime: 0, endTime: 5, duration: 5 }
      ];
      const result = finalizeSimulationResult([p1], gantt, [], []);

      expect(result.finalProcesses.length).toBe(1);
      expect(result.finalProcesses[0].waitingTime).toBe(0);
      expect(result.totalSimulationTime).toBe(5);
      expect(result.cpuUtilization).toBe(100);
      expect(result.throughput).toBe(0.2);
    });
  });
});
