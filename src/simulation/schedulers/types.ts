import { Process, AlgorithmConfig, SimulationResult } from '../../domain';

export type SchedulerFunction = (
  processes: Process[],
  config?: AlgorithmConfig
) => SimulationResult;

export interface InternalProcess extends Process {
  _originalIndex: number;
  _timeInCurrentBurst: number;
  _timeInReadyQueue: number;
}

export interface SchedulingDecisionInfo {
  selectedProcess: string;
  candidateProcesses: string[];
  selectionCriterion: string;
  criterionValues: Record<string, string | number>;
  reason: string;
}

export interface SchedulingStrategy {
  // Setup the config
  setConfig?(config: AlgorithmConfig): void;
  // Called when process enters READY queue
  addProcess(process: InternalProcess, currentTime: number): void;
  // Called when process completes CPU burst
  onProcessCPUCompletion?(process: InternalProcess, currentTime: number): void;
  // Pick next process to run
  getNextProcess(currentTime: number): InternalProcess | null;
  // Hook to check for preemption against current running process
  shouldPreempt?(running: InternalProcess, newlyReady: InternalProcess[], currentTime: number): boolean;
  // Hook to check quantum expiry (RR, MLFQ)
  isQuantumExpired?(running: InternalProcess, timeInCurrentBurst: number): boolean;
  // Provide diagnostic info for decision
  getDecisionInfo?(selected: InternalProcess | null, currentTime: number): SchedulingDecisionInfo | null;
  // Hook to request an early wake-up (e.g. for priority aging)
  getNextEventTime?(running: InternalProcess, currentTime: number): number;
}
