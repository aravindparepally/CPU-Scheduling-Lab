import { AlgorithmIdentifier } from '../../domain';

export interface AlgorithmParameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'string' | 'numberArray';
  required: boolean;
  defaultValue?: unknown;
}

export interface AlgorithmCapabilities {
  preemptive: boolean;
  supportsPriority: boolean;
  supportsAging: boolean;
  supportsTimeQuantum: boolean;
  supportsMultipleQueues: boolean;
  supportsPrediction: boolean;
}

export interface AlgorithmMetadata {
  id: AlgorithmIdentifier;
  name: string;
  description: string;
  capabilities: AlgorithmCapabilities;
  parameters: AlgorithmParameter[];
}

const defaultCapabilities: AlgorithmCapabilities = {
  preemptive: false,
  supportsPriority: false,
  supportsAging: false,
  supportsTimeQuantum: false,
  supportsMultipleQueues: false,
  supportsPrediction: false,
};

export const algorithmMetadataRegistry: Record<AlgorithmIdentifier, AlgorithmMetadata> = {
  [AlgorithmIdentifier.FCFS]: {
    id: AlgorithmIdentifier.FCFS,
    name: 'First Come First Serve',
    description: 'Executes processes in the order they arrive.',
    capabilities: { ...defaultCapabilities },
    parameters: []
  },
  [AlgorithmIdentifier.SJF]: {
    id: AlgorithmIdentifier.SJF,
    name: 'Shortest Job First',
    description: 'Executes the process with the shortest burst time. Non-preemptive.',
    capabilities: { ...defaultCapabilities },
    parameters: []
  },
  [AlgorithmIdentifier.SRTF]: {
    id: AlgorithmIdentifier.SRTF,
    name: 'Shortest Remaining Time First',
    description: 'Preemptive version of SJF. Preempts if a new process has a shorter remaining burst time.',
    capabilities: { ...defaultCapabilities, preemptive: true },
    parameters: []
  },
  [AlgorithmIdentifier.RR]: {
    id: AlgorithmIdentifier.RR,
    name: 'Round Robin',
    description: 'Each process is assigned a fixed time quantum in a cyclic order.',
    capabilities: { ...defaultCapabilities, preemptive: true, supportsTimeQuantum: true },
    parameters: [
      { id: 'timeQuantum', name: 'Time Quantum', type: 'number', required: true, defaultValue: 2 }
    ]
  },
  [AlgorithmIdentifier.LJF]: {
    id: AlgorithmIdentifier.LJF,
    name: 'Longest Job First',
    description: 'Executes the process with the longest burst time. Non-preemptive.',
    capabilities: { ...defaultCapabilities },
    parameters: []
  },
  [AlgorithmIdentifier.LRTF]: {
    id: AlgorithmIdentifier.LRTF,
    name: 'Longest Remaining Time First',
    description: 'Preemptive version of LJF. Preempts if a new process has a longer remaining burst time.',
    capabilities: { ...defaultCapabilities, preemptive: true },
    parameters: []
  },
  [AlgorithmIdentifier.HRRN]: {
    id: AlgorithmIdentifier.HRRN,
    name: 'Highest Response Ratio Next',
    description: 'Considers both burst time and waiting time. Non-preemptive.',
    capabilities: { ...defaultCapabilities, supportsAging: true },
    parameters: []
  },
  [AlgorithmIdentifier.PRIORITY]: {
    id: AlgorithmIdentifier.PRIORITY,
    name: 'Priority Scheduling',
    description: 'Executes processes based on priority. Can be preemptive or non-preemptive with optional aging.',
    capabilities: { ...defaultCapabilities, preemptive: true, supportsPriority: true, supportsAging: true },
    parameters: [
      { id: 'isPreemptive', name: 'Preemptive', type: 'boolean', required: false, defaultValue: false },
      { id: 'agingRate', name: 'Aging Rate', type: 'number', required: false, defaultValue: 0 }
    ]
  },
  [AlgorithmIdentifier.MULTILEVEL_QUEUE]: {
    id: AlgorithmIdentifier.MULTILEVEL_QUEUE,
    name: 'Multilevel Queue',
    description: 'Partitions the ready queue into several fixed queues, each with its own scheduling algorithm.',
    capabilities: { ...defaultCapabilities, preemptive: true, supportsPriority: true, supportsMultipleQueues: true, supportsTimeQuantum: true },
    parameters: [
      { id: 'globalPreemption', name: 'Global Preemption', type: 'boolean', required: false, defaultValue: true },
      { id: 'batchTimeQuantum', name: 'Batch Time Quantum', type: 'number', required: false, defaultValue: 2 }
    ]
  },
  [AlgorithmIdentifier.MLFQ]: {
    id: AlgorithmIdentifier.MLFQ,
    name: 'Multilevel Feedback Queue',
    description: 'Allows processes to move between queues based on CPU behavior and aging.',
    capabilities: { ...defaultCapabilities, preemptive: true, supportsMultipleQueues: true, supportsTimeQuantum: true, supportsAging: true },
    parameters: [
      { id: 'quantums', name: 'Queue Quantums', type: 'numberArray', required: false, defaultValue: [2, 4, 8] },
      { id: 'boostInterval', name: 'Boost Interval', type: 'number', required: false, defaultValue: 20 }
    ]
  }
};

export const getAlgorithmMetadata = (id: AlgorithmIdentifier): AlgorithmMetadata => {
  return algorithmMetadataRegistry[id];
};

export const getAlgorithmCapabilities = (id: AlgorithmIdentifier): AlgorithmCapabilities => {
  return algorithmMetadataRegistry[id].capabilities;
};
