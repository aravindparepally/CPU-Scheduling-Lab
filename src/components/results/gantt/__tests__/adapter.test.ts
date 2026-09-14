import { describe, it, expect } from 'vitest';
import { buildTimelineMarkers, getSegmentEvents } from '../adapter';
import { SimulationResult, SimulationEventType } from '../../../../domain';

describe('Gantt Adapter', () => {
  it('buildTimelineMarkers maps PREEMPTION to markers', () => {
    const mockResult = {
      simulationEvents: [
        { timestamp: 5, type: SimulationEventType.PREEMPTION, reason: 'Priority', pid: 'P1' }
      ]
    } as SimulationResult;

    const markers = buildTimelineMarkers(mockResult);
    expect(markers.length).toBe(1);
    expect(markers[0]).toEqual({
      timestamp: 5,
      type: 'PREEMPTION',
      label: 'Preemption',
      reason: 'Priority',
      pid: 'P1'
    });
  });

  it('buildTimelineMarkers maps QUANTUM_EXPIRED to markers', () => {
    const mockResult = {
      simulationEvents: [
        { timestamp: 10, type: SimulationEventType.TIME_QUANTUM_EXPIRED, pid: 'P2' }
      ]
    } as SimulationResult;

    const markers = buildTimelineMarkers(mockResult);
    expect(markers[0].type).toBe('QUANTUM_EXPIRED');
  });

  it('buildTimelineMarkers maps QUEUE_CHANGE to markers', () => {
    const mockResult = {
      simulationEvents: [
        { timestamp: 15, type: SimulationEventType.PROCESS_DEMOTION, previousQueue: 0, newQueue: 1, pid: 'P1' },
        { timestamp: 20, type: SimulationEventType.PROCESS_PROMOTION, previousQueue: 2, newQueue: 0, pid: 'P2' }
      ]
    } as SimulationResult;

    const markers = buildTimelineMarkers(mockResult);
    expect(markers[0].type).toBe('QUEUE_CHANGE');
    expect(markers[0].label).toBe('Demotion');
    expect(markers[1].type).toBe('QUEUE_CHANGE');
    expect(markers[1].label).toBe('Promotion');
  });

  it('getSegmentEvents finds events strictly within segment bounds matching PID or null', () => {
    const segment = { pid: 'P1', startTime: 5, endTime: 10, duration: 5 };
    const events = [
      { timestamp: 4, type: SimulationEventType.DISPATCH, pid: 'P1' }, // Too early
      { timestamp: 6, type: SimulationEventType.EXECUTION, pid: 'P1' }, // Match
      { timestamp: 8, type: SimulationEventType.EXECUTION, pid: 'P2' }, // Wrong PID
      { timestamp: 10, type: SimulationEventType.PREEMPTION, pid: 'P1' }, // Match (on boundary)
      { timestamp: 10, type: SimulationEventType.QUEUE_CHANGE }, // Match (no PID is allowed)
    ] as any[];

    const matched = getSegmentEvents(segment, events);
    expect(matched.length).toBe(3);
    expect(matched[0].timestamp).toBe(6);
    expect(matched[1].timestamp).toBe(10);
    expect(matched[2].timestamp).toBe(10);
  });
});
