import { AlgorithmIdentifier } from '../domain';
import { AlgorithmProfile } from './types';

export const ALGORITHM_PROFILES: Record<AlgorithmIdentifier, AlgorithmProfile> = {
  [AlgorithmIdentifier.FCFS]: {
    characteristics: [
      'Non-preemptive',
      'Arrival-order based',
      'Simple and deterministic',
      'Can suffer from convoy effect'
    ],
    strengths: [
      'Simple and predictable.',
      'Fair in terms of arrival time.'
    ],
    tradeoffs: [
      'Long jobs can delay short jobs.',
      'Average waiting time can be highly variable depending on arrival order.'
    ]
  },
  [AlgorithmIdentifier.SJF]: {
    characteristics: [
      'Non-preemptive',
      'Selects shortest burst among eligible processes',
      'Can reduce average waiting time',
      'Requires burst-time knowledge/prediction'
    ],
    strengths: [
      'Often excellent average waiting time.',
      'Optimal for minimizing average waiting time if all processes arrive simultaneously.'
    ],
    tradeoffs: [
      'Requires burst-time information/prediction.',
      'May disadvantage long jobs, leading to starvation.'
    ]
  },
  [AlgorithmIdentifier.SRTF]: {
    characteristics: [
      'Preemptive',
      'Uses shortest remaining time',
      'Can improve responsiveness for short jobs',
      'May cause more preemptions'
    ],
    strengths: [
      'Good responsiveness for short jobs.',
      'Dynamically adapts as new short processes arrive.'
    ],
    tradeoffs: [
      'More preemption/context-switch activity can occur.',
      'Long jobs can still suffer from starvation.'
    ]
  },
  [AlgorithmIdentifier.RR]: {
    characteristics: [
      'Preemptive/time-sharing',
      'Uses time quantum',
      'Fairer CPU sharing',
      'Performance depends strongly on quantum'
    ],
    strengths: [
      'Good interactive responsiveness.',
      'Prevents starvation as every process gets a guaranteed share of CPU.'
    ],
    tradeoffs: [
      'Too-small quantum can increase context-switch overhead.',
      'Too-large quantum degenerates into FCFS.'
    ]
  },
  [AlgorithmIdentifier.LJF]: {
    characteristics: [
      'Non-preemptive',
      'Selects longest burst among eligible processes',
      'Favors long-running jobs'
    ],
    strengths: [
      'Allows CPU-heavy tasks to complete without interruption.'
    ],
    tradeoffs: [
      'Very poor responsiveness for short interactive jobs.',
      'Short processes can suffer from starvation.'
    ]
  },
  [AlgorithmIdentifier.LRTF]: {
    characteristics: [
      'Preemptive',
      'Selects longest remaining time',
      'Can favor long-running processes'
    ],
    strengths: [
      'Ensures all processes are eventually worked on (reduced starvation for long jobs).'
    ],
    tradeoffs: [
      'High context-switch overhead.',
      'Short processes suffer terrible response times.'
    ]
  },
  [AlgorithmIdentifier.HRRN]: {
    characteristics: [
      'Non-preemptive',
      'Uses Response Ratio: (W + B) / B',
      'Balances waiting time and service time',
      'Reduces starvation compared with pure SJF in typical behavior'
    ],
    strengths: [
      'Accounts for aging natively, preventing long jobs from starving indefinitely.',
      'Favors shorter jobs but respects waiting time.'
    ],
    tradeoffs: [
      'Requires calculation of response ratio dynamically.',
      'Requires burst-time knowledge.'
    ]
  },
  [AlgorithmIdentifier.PRIORITY]: {
    characteristics: [
      'Selects according to priority',
      'Static/dynamic variants exist',
      'Preemptive/non-preemptive variants exist',
      'Aging can reduce starvation'
    ],
    strengths: [
      'Provides explicit control over process importance.',
      'Can support critical real-time constraints.'
    ],
    tradeoffs: [
      'Low priority jobs may starve without aging mechanisms.',
      'Strict priority may ignore system efficiency.'
    ]
  },
  [AlgorithmIdentifier.MULTILEVEL_QUEUE]: {
    characteristics: [
      'Multiple fixed queues',
      'Processes remain assigned to a queue',
      'Queue hierarchy determines CPU access'
    ],
    strengths: [
      'Categorizes processes logically (e.g., interactive vs batch).',
      'Low overhead once placed in a queue.'
    ],
    tradeoffs: [
      'Inflexible; processes cannot move between queues if their behavior changes.',
      'Lower queues may starve completely.'
    ]
  },
  [AlgorithmIdentifier.MLFQ]: {
    characteristics: [
      'Multiple feedback levels',
      'Processes can move between queues',
      'CPU-bound processes are typically demoted',
      'Waiting processes can be promoted/boosted according to configuration'
    ],
    strengths: [
      'Highly adaptable to changing process behavior.',
      'Excellent for general-purpose OS scheduling.'
    ],
    tradeoffs: [
      'Complex to configure correctly (quantums, queues, aging bounds).',
      'More overhead to manage queue transitions.'
    ]
  }
};
