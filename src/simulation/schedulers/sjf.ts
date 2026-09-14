import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class SJFStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];
  private usePrediction: boolean = false;

  setConfig(config: AlgorithmConfig): void {
    this.usePrediction = config.sjf !== undefined;
  }

  private getEffectiveBurst(p: InternalProcess): number {
    if (this.usePrediction && p.predictedBurstTime !== undefined) {
      return p.predictedBurstTime;
    }
    // For non-preemptive SJF, remainingBurstTime when added to ready queue IS the total burst for this CPU phase.
    return p.remainingBurstTime || 0;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
    
    this.readyQueue.sort((a, b) => {
      const aBurst = this.getEffectiveBurst(a);
      const bBurst = this.getEffectiveBurst(b);
      
      if (aBurst !== bBurst) return aBurst - bBurst;
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
      selectionCriterion: this.usePrediction ? 'Predicted Burst Time' : 'Burst Time',
      criterionValues,
      reason: `${selected.pid} was selected because it has the shortest ${this.usePrediction ? 'predicted ' : ''}burst time among the available processes.`
    };
  }
}

export const simulateSJF: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new SJFStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'SJF' as any }, strategy);
};
