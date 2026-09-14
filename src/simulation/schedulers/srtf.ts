import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class SRTFStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];

  private getRemainingBurst(p: InternalProcess): number {
    return p.remainingBurstTime || 0;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
    
    this.readyQueue.sort((a, b) => {
      const aBurst = this.getRemainingBurst(a);
      const bBurst = this.getRemainingBurst(b);
      
      if (aBurst !== bBurst) return aBurst - bBurst;
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
      if (this.getRemainingBurst(p) < runningRemaining) {
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
      reason: `${selected.pid} was selected because it has the shortest remaining burst time among the available processes.`
    };
  }
}

export const simulateSRTF: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new SRTFStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'SRTF' as any }, strategy);
};
