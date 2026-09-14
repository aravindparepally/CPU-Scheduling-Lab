import { SimulationResult, GanttSegment, SimulationEvent, SchedulingDecision, Process } from '../domain';

export const getActiveSegment = (result: SimulationResult, currentTime: number): GanttSegment | null => {
  if (!result || result.ganttSegments.length === 0) return null;
  
  // If we are at the exact end of the simulation, return the last segment
  if (currentTime >= result.totalSimulationTime) {
    return result.ganttSegments[result.ganttSegments.length - 1];
  }

  // Find the segment that covers currentTime
  for (const seg of result.ganttSegments) {
    // Current time falls within this segment
    // We use < endTime so that exactly on the boundary, we pick the NEW segment that is starting.
    if (currentTime >= seg.startTime && currentTime < seg.endTime) {
      return seg;
    }
  }

  return null;
};

export const getProcessDetails = (result: SimulationResult, pid: string | 'CPU_IDLE' | null): Process | null => {
  if (!pid || pid === 'CPU_IDLE') return null;
  return result.finalProcesses.find(p => p.pid === pid) || null;
};

export const getPastEvents = (result: SimulationResult, currentTime: number): SimulationEvent[] => {
  if (!result) return [];
  return result.simulationEvents.filter(e => e.timestamp <= currentTime);
};

export const getFutureEvents = (result: SimulationResult, currentTime: number): SimulationEvent[] => {
  if (!result) return [];
  return result.simulationEvents.filter(e => e.timestamp > currentTime);
};

export const getLatestDecision = (result: SimulationResult, currentTime: number): SchedulingDecision | null => {
  if (!result || result.schedulingDecisions.length === 0) return null;
  
  let latest: SchedulingDecision | null = null;
  for (const decision of result.schedulingDecisions) {
    if (decision.timestamp <= currentTime) {
      latest = decision;
    } else {
      break; 
    }
  }
  return latest;
};

export const getCalculatedElapsed = (segment: GanttSegment | null, currentTime: number): number => {
  if (!segment) return 0;
  if (currentTime >= segment.endTime) return segment.duration;
  if (currentTime <= segment.startTime) return 0;
  return currentTime - segment.startTime;
};

export type ProcessPlaybackStatus = 'NOT_ARRIVED' | 'READY' | 'RUNNING' | 'COMPLETED';

export const getProcessStatus = (result: SimulationResult, pid: string, currentTime: number): ProcessPlaybackStatus => {
  const process = result.finalProcesses.find(p => p.pid === pid);
  if (!process) return 'NOT_ARRIVED';
  
  if (currentTime < process.arrivalTime) return 'NOT_ARRIVED';
  
  // We check if it is completed by checking if currentTime >= completionTime
  // Note: a process might have completionTime = undefined if the simulation didn't finish it, but our  // If time has passed completion
  if (process.completionTime !== undefined && process.completionTime !== null && currentTime >= process.completionTime) {
    return 'COMPLETED';
  }
  
  const activeSegment = getActiveSegment(result, currentTime);
  if (activeSegment && activeSegment.pid === pid) {
    return 'RUNNING';
  }
  
  return 'READY';
};

export const getCurrentProcess = (result: SimulationResult, currentTime: number): Process | null => {
  const activeSegment = getActiveSegment(result, currentTime);
  if (!activeSegment || activeSegment.pid === 'CPU_IDLE') return null;
  return result.finalProcesses.find(p => p.pid === activeSegment.pid) || null;
};

export const getReadyProcesses = (result: SimulationResult, currentTime: number): Process[] => {
  return result.finalProcesses.filter(p => getProcessStatus(result, p.pid, currentTime) === 'READY');
};

export const getActiveEvent = (result: SimulationResult, currentTime: number): SimulationEvent | null => {
  if (!result || result.simulationEvents.length === 0) return null;
  
  // Return the event that occurred exactly at currentTime (if any), or the most recent one
  let active: SimulationEvent | null = null;
  for (const event of result.simulationEvents) {
    if (event.timestamp <= currentTime) {
      active = event;
    } else {
      break;
    }
  }
  return active;
};

export interface QueueStateLimitation {
  isAccurate: boolean;
  message?: string;
  queues: Record<number, string[]>;
}

export const getQueueState = (result: SimulationResult, currentTime: number): QueueStateLimitation => {
  // We can track queue assignment by playing events forward up to currentTime
  const queues: Record<number, string[]> = {};
  
  // Initialize with all processes that are READY
  const readyPids = new Set(getReadyProcesses(result, currentTime).map(p => p.pid));
  
  // The SimulationResult DOES NOT store full queue snapshots.
  // We can attempt to reconstruct it by looking at PROCESS_ARRIVAL, PROCESS_PROMOTION, PROCESS_DEMOTION.
  // But this is a heuristic. We must report the limitation as requested.
  const hasQueueEvents = result.simulationEvents.some(e => e.type === 'PROCESS_PROMOTION' || e.type === 'PROCESS_DEMOTION' || e.newQueue !== undefined);
  
  if (!hasQueueEvents) {
    // Single queue (e.g., FCFS, RR, Priority)
    const latestDecision = getLatestDecision(result, currentTime);
    return {
      isAccurate: true,
      queues: { 0: latestDecision ? latestDecision.candidateProcesses : [] }
    };
  }
  
  // Reconstruct by tracking last known queue for each PID
  const queueAssignments: Record<string, number> = {};
  for (const event of result.simulationEvents) {
    if (event.timestamp > currentTime) break;
    if (event.pid && event.newQueue !== undefined) {
      queueAssignments[event.pid] = event.newQueue;
    }
  }
  
  // Assign ready processes to their tracked queues
  for (const pid of readyPids) {
    const qLevel = queueAssignments[pid] || 0; // Default to 0
    if (!queues[qLevel]) queues[qLevel] = [];
    queues[qLevel].push(pid);
  }
  
  return {
    isAccurate: false, // We report the limitation because we reconstructed it heuristically without full queue state snapshots
    message: "SimulationResult only stores flat candidate lists and transition events, not full queue snapshots. This MLQ/MLFQ visualization is heuristically reconstructed and may not reflect the exact internal engine state at this millisecond.",
    queues
  };
};
