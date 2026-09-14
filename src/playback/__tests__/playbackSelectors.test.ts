import { describe, it, expect } from 'vitest';
import { getActiveSegment, getCalculatedElapsed, getPastEvents, getLatestDecision, getProcessStatus, getQueueState } from '../playbackSelectors';
import { SimulationResult, SimulationEventType } from '../../domain';

describe('playbackSelectors', () => {
  const mockResult: SimulationResult = {
    ganttSegments: [
      { pid: 'CPU_IDLE', startTime: 0, endTime: 2, duration: 2 },
      { pid: 'P1', startTime: 2, endTime: 5, duration: 3 },
    ],
    simulationEvents: [
      { timestamp: 0, type: SimulationEventType.PROCESS_ARRIVAL, pid: 'P1' },
      { timestamp: 2, type: SimulationEventType.DISPATCH, pid: 'P1' },
      { timestamp: 5, type: SimulationEventType.PROCESS_COMPLETION, pid: 'P1' },
    ],
    schedulingDecisions: [
      { timestamp: 0, candidateProcesses: [], selectedProcess: null, selectionCriterion: 'Idle', criterionValues: {}, reason: 'Empty' },
      { timestamp: 2, candidateProcesses: ['P1'], selectedProcess: 'P1', selectionCriterion: 'FCFS', criterionValues: {}, reason: 'Arrived' }
    ],
    totalSimulationTime: 5,
    finalProcesses: [],
    cpuUtilization: 0, throughput: 0, contextSwitchCount: 0, averageWaitingTime: 0, averageTurnaroundTime: 0, averageResponseTime: 0
  };

  describe('getActiveSegment', () => {
    it('returns correct segment for given time', () => {
      expect(getActiveSegment(mockResult, 1)?.pid).toBe('CPU_IDLE');
      expect(getActiveSegment(mockResult, 2)?.pid).toBe('P1');
      expect(getActiveSegment(mockResult, 4)?.pid).toBe('P1');
    });

    it('returns last segment exactly at totalTime', () => {
      expect(getActiveSegment(mockResult, 5)?.pid).toBe('P1');
    });

    it('returns null if empty', () => {
      expect(getActiveSegment({ ...mockResult, ganttSegments: [] }, 2)).toBeNull();
    });
  });

  describe('getCalculatedElapsed', () => {
    const segment = { pid: 'P1', startTime: 2, endTime: 5, duration: 3 };
    
    it('calculates properly', () => {
      expect(getCalculatedElapsed(segment, 1)).toBe(0);
      expect(getCalculatedElapsed(segment, 3.5)).toBe(1.5);
      expect(getCalculatedElapsed(segment, 6)).toBe(3);
    });
  });

  describe('getPastEvents', () => {
    it('filters events up to currentTime', () => {
      expect(getPastEvents(mockResult, 1).length).toBe(1); // t=0
      expect(getPastEvents(mockResult, 2).length).toBe(2); // t=0, t=2
      expect(getPastEvents(mockResult, 10).length).toBe(3); // all
    });
  });

  describe('getLatestDecision', () => {
    it('finds most recent decision', () => {
      expect(getLatestDecision(mockResult, 1)?.timestamp).toBe(0);
      expect(getLatestDecision(mockResult, 2)?.timestamp).toBe(2);
      expect(getLatestDecision(mockResult, 10)?.timestamp).toBe(2);
    });
  });

  describe('getProcessStatus', () => {
    it('returns NOT_ARRIVED if current time < arrival', () => {
      expect(getProcessStatus({ ...mockResult, finalProcesses: [{ pid: 'P1', arrivalTime: 2, burstTime: 3, id: '1' }] } as any, 'P1', 1)).toBe('NOT_ARRIVED');
    });

    it('returns COMPLETED if current time >= completion time', () => {
      expect(getProcessStatus({ ...mockResult, finalProcesses: [{ pid: 'P1', arrivalTime: 0, burstTime: 3, completionTime: 5, id: '1' }] } as any, 'P1', 5)).toBe('COMPLETED');
    });

    it('returns RUNNING if currently in active segment', () => {
      expect(getProcessStatus({ ...mockResult, finalProcesses: [{ pid: 'P1', arrivalTime: 0, burstTime: 3, id: '1' }] } as any, 'P1', 3)).toBe('RUNNING');
    });

    it('returns READY otherwise', () => {
      expect(getProcessStatus({ ...mockResult, finalProcesses: [{ pid: 'P1', arrivalTime: 0, burstTime: 3, completionTime: 10, id: '1' }] } as any, 'P1', 1)).toBe('READY');
    });
  });

  describe('getQueueState', () => {
    it('returns heuristic limitation if events have no queue assignments', () => {
      const state = getQueueState(mockResult, 2);
      expect(state.isAccurate).toBe(true);
      expect(state.queues[0]).toEqual(['P1']);
    });

    it('returns reconstructed queues if promotion/demotion exists', () => {
      const mockResultQueue: SimulationResult = {
        ...mockResult,
        finalProcesses: [{ pid: 'P1', arrivalTime: 0, burstTime: 5, id: '1' } as any],
        simulationEvents: [
          { timestamp: 0, type: SimulationEventType.PROCESS_ARRIVAL, pid: 'P1', newQueue: 0 },
          { timestamp: 2, type: SimulationEventType.PROCESS_DEMOTION, pid: 'P1', previousQueue: 0, newQueue: 1 },
        ]
      };
      
      const state0 = getQueueState(mockResultQueue, 1);
      expect(state0.isAccurate).toBe(false);
      expect(state0.queues[0]).toContain('P1');
      
      // Make P1 ready by checking exactly at t=6 where it would theoretically be completed, 
      // but let's just make it preempted by changing the gantt segment.
      const mockResultQueue2 = {
        ...mockResultQueue,
        ganttSegments: [
          { pid: 'CPU_IDLE', startTime: 0, endTime: 2, duration: 2 },
          { pid: 'P2', startTime: 2, endTime: 5, duration: 3 } // P2 is running, so P1 is ready!
        ]
      };
      
      const state1 = getQueueState(mockResultQueue2, 3);
      expect(state1.isAccurate).toBe(false);
      expect(state1.queues[1]).toContain('P1');
    });
  });
});
