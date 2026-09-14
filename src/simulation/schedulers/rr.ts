

import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class RRStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];
  private timeQuantum: number = 1;

  setConfig(config: AlgorithmConfig): void {
    const tq = config?.roundRobin?.timeQuantum;
    if (tq === undefined || tq <= 0 || isNaN(tq) || !isFinite(tq)) {
      throw new Error('Round Robin requires a valid time quantum > 0');
    }
    this.timeQuantum = tq;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
  }

  getNextProcess(_currentTime: number): InternalProcess | null {
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue.shift()!;
  }

  isQuantumExpired(_running: InternalProcess, timeInCurrentBurst: number): boolean {
    return timeInCurrentBurst >= this.timeQuantum;
  }

  getDecisionInfo(selected: InternalProcess | null, _currentTime: number): SchedulingDecisionInfo | null {
    if (!selected) return null;

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'FIFO Ready Queue',
      criterionValues: {},
      reason: `${selected.pid} was selected because it is at the front of the Round Robin ready queue.`
    };
  }
}

export const simulateRR: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new RRStrategy();
  strategy.setConfig(config || { algorithm: 'RR' as any });
  return runUnifiedEngine(processes, config || { algorithm: 'RR' as any }, strategy);
};
