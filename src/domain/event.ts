import { ProcessState } from './process';

export enum SimulationEventType {
  PROCESS_ARRIVAL = 'PROCESS_ARRIVAL',
  CPU_IDLE = 'CPU_IDLE',
  DISPATCH = 'DISPATCH',
  EXECUTION = 'EXECUTION',
  PREEMPTION = 'PREEMPTION',
  CONTEXT_SWITCH = 'CONTEXT_SWITCH',
  TIME_QUANTUM_EXPIRED = 'TIME_QUANTUM_EXPIRED',
  PROCESS_COMPLETION = 'PROCESS_COMPLETION',
  QUEUE_CHANGE = 'QUEUE_CHANGE',
  PRIORITY_CHANGE = 'PRIORITY_CHANGE',
  PROCESS_PROMOTION = 'PROCESS_PROMOTION',
  PROCESS_DEMOTION = 'PROCESS_DEMOTION',
}

export interface SimulationEvent {
  timestamp: number;
  type: SimulationEventType;
  
  pid?: string | null;
  previousState?: ProcessState;
  newState?: ProcessState;
  
  previousQueue?: number;
  newQueue?: number;
  
  remainingTime?: number;
  priority?: number;
  
  reason?: string;
  metadata?: Record<string, unknown>;
}
