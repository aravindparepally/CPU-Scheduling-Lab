import { AlgorithmIdentifier } from '../../domain';
import { SchedulerFunction } from '../schedulers/types';
import { 
  simulateFCFS,
  simulateSJF,
  simulateSRTF,
  simulateRR,
  simulateLJF,
  simulateLRTF,
  simulateHRRN,
  simulatePriority,
  simulateMLQ,
  simulateMLFQ
} from '../schedulers';

export const schedulerRegistry: Record<AlgorithmIdentifier, SchedulerFunction> = {
  [AlgorithmIdentifier.FCFS]: simulateFCFS,
  [AlgorithmIdentifier.SJF]: simulateSJF,
  [AlgorithmIdentifier.SRTF]: simulateSRTF,
  [AlgorithmIdentifier.RR]: simulateRR,
  [AlgorithmIdentifier.LJF]: simulateLJF,
  [AlgorithmIdentifier.LRTF]: simulateLRTF,
  [AlgorithmIdentifier.HRRN]: simulateHRRN,
  [AlgorithmIdentifier.PRIORITY]: simulatePriority,
  [AlgorithmIdentifier.MULTILEVEL_QUEUE]: simulateMLQ,
  [AlgorithmIdentifier.MLFQ]: simulateMLFQ,
};
