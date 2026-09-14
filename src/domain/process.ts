export enum ProcessState {
  NEW = 'NEW',
  READY = 'READY',
  RUNNING = 'RUNNING',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
}

export enum ProcessType {
  SYSTEM = 'SYSTEM',
  INTERACTIVE = 'INTERACTIVE',
  BATCH = 'BATCH',
  STUDENT = 'STUDENT',
  GENERAL = 'GENERAL',
}

export interface Burst {
  type: 'CPU' | 'IO';
  duration: number;
}

export interface Process {
  pid: string;
  arrivalTime: number;
  burstTime: number; // For backward compatibility/simple mode
  remainingTime: number; // For backward compatibility/simple mode

  bursts?: Burst[]; // For I/O mode
  cpuBursts?: number[]; // Array of CPU bursts
  ioBursts?: number[];  // Array of I/O bursts
  ioStartTime?: number; // Legacy UI helper
  ioBurstTime?: number; // Legacy UI helper
  currentBurstIndex?: number;
  remainingBurstTime?: number;

  priority?: number;
  processType?: ProcessType;
  queueLevel?: number;
  predictedBurstTime?: number;

  firstStartTime?: number | null;
  completionTime?: number | null;
  waitingTime?: number | null;
  turnaroundTime?: number | null;
  responseTime?: number | null;
}

export const createProcess = (
  pid: string,
  arrivalTime: number,
  burstTime: number,
  options?: Partial<Omit<Process, 'pid' | 'arrivalTime' | 'burstTime' | 'remainingTime'>>
): Process => {
  return {
    pid,
    arrivalTime,
    burstTime,
    remainingTime: burstTime,
    firstStartTime: null,
    completionTime: null,
    waitingTime: null,
    turnaroundTime: null,
    responseTime: null,
    ...options,
  };
};
