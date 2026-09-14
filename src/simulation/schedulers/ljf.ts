import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class LJFStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];

  private getEffectiveBurst(p: InternalProcess): number {
    return p.remainingBurstTime || 0;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
    
    this.readyQueue.sort((a, b) => {
      const aBurst = this.getEffectiveBurst(a);
      const bBurst = this.getEffectiveBurst(b);
      
      if (aBurst !== bBurst) return bBurst - aBurst; // Largest burst first
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
    
    const criterionValues: Record<string, number> = {};
    criterionValues[selected.pid] = this.getEffectiveBurst(selected);
    for (const p of this.readyQueue) {
      criterionValues[p.pid] = this.getEffectiveBurst(p);
    }

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'Burst Time',
      criterionValues,
      reason: `${selected.pid} was selected because it has the longest burst time among the available processes.`
    };
  }
}

export const simulateLJF: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new LJFStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'LJF' as any }, strategy);
};
