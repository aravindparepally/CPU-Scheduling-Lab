import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class FCFSStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
    // Strict FIFO sorting, tie-breaker on original index
    this.readyQueue.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
  }

  getNextProcess(): InternalProcess | null {
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue.shift()!;
  }

  getDecisionInfo(selected: InternalProcess | null): SchedulingDecisionInfo | null {
    if (!selected) return null;
    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'Arrival Time',
      criterionValues: {
        [selected.pid]: selected.arrivalTime
      },
      reason: `${selected.pid} was selected because it arrived earliest.`
    };
  }
}

export const simulateFCFS: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new FCFSStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'FCFS' as any }, strategy);
};
