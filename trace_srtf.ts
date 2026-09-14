import { simulateSRTF } from './src/simulation/schedulers/srtf';
import { createProcess } from './src/domain/process';

const processes = [
  createProcess('P1', 0, 5, { cpuBursts: [3, 2], ioBursts: [2] }),
  createProcess('P2', 0, 3, { cpuBursts: [2, 1], ioBursts: [4] }),
  createProcess('P3', 2, 3, { cpuBursts: [1, 2], ioBursts: [3] }),
  createProcess('P4', 5, 3, { cpuBursts: [2, 1], ioBursts: [2] })
];

const result = simulateSRTF(processes, { algorithm: 'SRTF' as any, ioEnabled: true });
console.log(JSON.stringify(result.ganttSegments, null, 2));
