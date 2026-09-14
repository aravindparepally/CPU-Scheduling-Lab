import { AlgorithmIdentifier, createProcess, ProcessType } from '../../domain';
import { SimulationInput } from './runSimulation';

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  input: SimulationInput;
}

export const examplePresets: Record<string, SimulationPreset> = {
  basicFCFS: {
    id: 'basicFCFS',
    name: 'Basic FCFS',
    description: 'A standard First-Come, First-Served scenario.',
    input: {
      algorithm: AlgorithmIdentifier.FCFS,
      processes: [
        createProcess('P1', 0, 5),
        createProcess('P2', 1, 3),
        createProcess('P3', 2, 8),
      ]
    }
  },
  preemptiveSRTF: {
    id: 'preemptiveSRTF',
    name: 'Preemptive SRTF',
    description: 'Shorter jobs preempt currently running longer jobs.',
    input: {
      algorithm: AlgorithmIdentifier.SRTF,
      processes: [
        createProcess('P1', 0, 8),
        createProcess('P2', 1, 4),
        createProcess('P3', 2, 9),
        createProcess('P4', 3, 5),
      ]
    }
  },
  roundRobinExample: {
    id: 'roundRobinExample',
    name: 'Round Robin (TQ=2)',
    description: 'Time-sliced round robin execution.',
    input: {
      algorithm: AlgorithmIdentifier.RR,
      processes: [
        createProcess('P1', 0, 5),
        createProcess('P2', 1, 4),
        createProcess('P3', 2, 3),
      ],
      config: {
        algorithm: AlgorithmIdentifier.RR,
        roundRobin: { timeQuantum: 2 }
      }
    }
  },
  priorityExample: {
    id: 'priorityExample',
    name: 'Preemptive Priority',
    description: 'Higher priority processes (smaller number) preempt lower priority ones.',
    input: {
      algorithm: AlgorithmIdentifier.PRIORITY,
      processes: [
        createProcess('P1', 0, 10, { priority: 5 }),
        createProcess('P2', 1, 2, { priority: 1 }),
        createProcess('P3', 2, 5, { priority: 3 }),
      ],
      config: {
        algorithm: AlgorithmIdentifier.PRIORITY,
        priority: { isPreemptive: true, agingRate: 0 }
      }
    }
  },
  mlfqExample: {
    id: 'mlfqExample',
    name: 'Multilevel Feedback Queue',
    description: 'Processes demote on quantum expiration, and priority boosts prevent starvation.',
    input: {
      algorithm: AlgorithmIdentifier.MLFQ,
      processes: [
        createProcess('P1', 0, 15),
        createProcess('P2', 2, 5),
      ],
      config: {
        algorithm: AlgorithmIdentifier.MLFQ,
        mlfq: {
          quantums: [2, 4, 8],
          boostInterval: 10
        }
      }
    }
  },
  mlqExample: {
    id: 'mlqExample',
    name: 'Multilevel Queue',
    description: 'Fixed queues: SYSTEM > INTERACTIVE > BATCH > STUDENT.',
    input: {
      algorithm: AlgorithmIdentifier.MULTILEVEL_QUEUE,
      processes: [
        createProcess('P1', 0, 5, { processType: ProcessType.STUDENT }),
        createProcess('P2', 1, 2, { processType: ProcessType.SYSTEM }),
        createProcess('P3', 2, 3, { processType: ProcessType.BATCH }),
      ],
      config: {
        algorithm: AlgorithmIdentifier.MULTILEVEL_QUEUE,
        mlq: {
          globalPreemption: true,
          batchTimeQuantum: 2
        }
      }
    }
  }
};

export const getExamplePresets = (): SimulationPreset[] => {
  return Object.values(examplePresets);
};
