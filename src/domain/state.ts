import { ProcessState } from './process';
import { GanttSegment } from './gantt';

export interface CPUState {
  currentProcess: string | null;
  state: 'IDLE' | 'EXECUTING' | 'CONTEXT_SWITCH';
  currentTime: number;
  remainingTime: number; 
  queueLevel?: number;
  priority?: number;
  timeQuantumRemaining?: number;
}

export interface ReadyQueueState {
  level: number;
  processes: string[]; // List of PIDs
  policy?: string; 
}

export interface SchedulingDecision {
  timestamp: number;
  selectedProcess: string | null;
  candidateProcesses: string[];
  selectionCriterion: string;
  criterionValues: Record<string, number | string>;
  reason: string;
}

export enum SimulationStatus {
  NOT_STARTED = 'NOT_STARTED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface SimulationState {
  currentEventIndex: number;
  currentSimulationTime: number;
  cpuState: CPUState;
  processStates: Record<string, ProcessState>;
  readyQueues: ReadyQueueState[];
  ganttSegments: GanttSegment[];
  currentDecision?: SchedulingDecision | null;
  status: SimulationStatus;
}
