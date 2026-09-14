import { Process, SimulationResult, AlgorithmConfig, AlgorithmIdentifier } from '../../domain';
import { schedulerRegistry } from './registry';

export interface SimulationInput {
  algorithm: AlgorithmIdentifier;
  processes: Process[];
  config?: AlgorithmConfig;
}

const deepCloneProcesses = (processes: Process[]): Process[] => {
  return processes.map(p => ({ ...p }));
};

const validateSimulationInput = (input: SimulationInput): void => {
  if (!input.algorithm || !schedulerRegistry[input.algorithm]) {
    throw new Error(`Invalid algorithm identifier: ${input.algorithm}`);
  }

  if (!Array.isArray(input.processes)) {
    throw new Error('Processes must be an array.');
  }

  for (const p of input.processes) {
    if (!p.pid) throw new Error('Process must have a pid.');
    if (p.arrivalTime < 0) throw new Error(`Process ${p.pid} has negative arrival time.`);
    if (p.burstTime <= 0) throw new Error(`Process ${p.pid} burst time must be strictly positive.`);
  }

  if (input.algorithm === AlgorithmIdentifier.RR) {
    const tq = input.config?.roundRobin?.timeQuantum;
    if (tq === undefined || tq <= 0) {
      throw new Error('Round Robin requires a positive time quantum.');
    }
  }

  if (input.algorithm === AlgorithmIdentifier.MLFQ) {
    const quantums = input.config?.mlfq?.quantums;
    if (quantums !== undefined) {
      if (!Array.isArray(quantums) || quantums.some(q => q <= 0)) {
        throw new Error('MLFQ quantums must be an array of positive numbers.');
      }
    }
    const boostInterval = input.config?.mlfq?.boostInterval;
    if (boostInterval !== undefined && boostInterval <= 0) {
      throw new Error('MLFQ boost interval must be positive.');
    }
  }

  if (input.algorithm === AlgorithmIdentifier.PRIORITY) {
    const agingRate = input.config?.priority?.agingRate;
    if (agingRate !== undefined && agingRate < 0) {
      throw new Error('Priority aging rate cannot be negative.');
    }
  }
};

/**
 * Main public API entry point for the simulation engine.
 * Takes immutable simulation input and delegates execution to the mathematically mapped algorithm.
 */
export const runSimulation = (input: SimulationInput): SimulationResult => {
  validateSimulationInput(input);

  const schedulerFn = schedulerRegistry[input.algorithm];
  
  // Clone processes to ensure complete caller immutability
  const clonedProcesses = deepCloneProcesses(input.processes);
  
  return schedulerFn(clonedProcesses, input.config);
};
