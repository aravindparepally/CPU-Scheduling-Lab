import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class LRTFStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];

  private getRemainingBurst(p: InternalProcess): number {
    return p.remainingBurstTime || 0;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
    
    this.readyQueue.sort((a, b) => {
      const aBurst = this.getRemainingBurst(a);
      const bBurst = this.getRemainingBurst(b);
      
      if (aBurst !== bBurst) return bBurst - aBurst; // Longest first
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
  }

  getNextProcess(): InternalProcess | null {
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue.shift()!;
  }

  shouldPreempt(runningProcess: InternalProcess, newlyReady: InternalProcess[]): boolean {
    const runningRemaining = this.getRemainingBurst(runningProcess);
    
    for (const p of newlyReady) {
      if (this.getRemainingBurst(p) > runningRemaining) { // STRICTLY greater
        return true;
      }
    }
    return false;
  }

  getDecisionInfo(selected: InternalProcess | null): SchedulingDecisionInfo | null {
    if (!selected) return null;
    
    const criterionValues: Record<string, number> = {};
    criterionValues[selected.pid] = this.getRemainingBurst(selected);
    for (const p of this.readyQueue) {
      criterionValues[p.pid] = this.getRemainingBurst(p);
    }

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'Remaining Burst Time',
      criterionValues,
      reason: `${selected.pid} was selected because it has the longest remaining burst time among the available processes.`
    };
  }
}

export const simulateLRTF: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new LRTFStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'LRTF' as any }, strategy);
};
