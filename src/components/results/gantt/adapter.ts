import { SimulationResult, SimulationEvent, SimulationEventType, GanttSegment } from '../../../domain';

export interface TimelineMarker {
  timestamp: number;
  type: 'PREEMPTION' | 'QUEUE_CHANGE' | 'QUANTUM_EXPIRED' | 'CONTEXT_SWITCH';
  label: string;
  reason?: string;
  pid?: string;
}

/**
 * Deterministically extracts timeline markers from SimulationEvents.
 */
export const buildTimelineMarkers = (result: SimulationResult): TimelineMarker[] => {
  const markers: TimelineMarker[] = [];
  
  result.simulationEvents.forEach(event => {
    if (event.type === SimulationEventType.PREEMPTION) {
      markers.push({
        timestamp: event.timestamp,
        type: 'PREEMPTION',
        label: 'Preemption',
        reason: event.reason,
        pid: event.pid || undefined,
      });
    } else if (event.type === SimulationEventType.TIME_QUANTUM_EXPIRED) {
      markers.push({
        timestamp: event.timestamp,
        type: 'QUANTUM_EXPIRED',
        label: 'Quantum Expired',
        reason: event.reason,
        pid: event.pid || undefined,
      });
    } else if (event.type === SimulationEventType.PROCESS_PROMOTION || event.type === SimulationEventType.PROCESS_DEMOTION) {
      markers.push({
        timestamp: event.timestamp,
        type: 'QUEUE_CHANGE',
        label: event.type === SimulationEventType.PROCESS_PROMOTION ? 'Promotion' : 'Demotion',
        reason: event.reason || `Moved from Q${event.previousQueue} to Q${event.newQueue}`,
        pid: event.pid || undefined,
      });
    }
  });

  return markers;
};

/**
 * Finds events strictly related to a specific Gantt segment.
 */
export const getSegmentEvents = (segment: GanttSegment, events: SimulationEvent[]): SimulationEvent[] => {
  return events.filter(e => 
    e.timestamp >= segment.startTime && 
    e.timestamp <= segment.endTime &&
    (e.pid === segment.pid || e.pid == null)
  );
};
