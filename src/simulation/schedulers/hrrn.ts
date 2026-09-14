import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class HRRNStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];

  private getResponseRatio(p: InternalProcess, currentTime: number): number {
    // Current waiting time = currentTime - arrivalTime (standard HRRN definition)
    const w = currentTime - p.arrivalTime;
    // For burst time, we use the total initial burst time to match old tests,
    // or we could use the current CPU burst duration. Standard HRRN uses total CPU burst.
    // The previous implementation used p.burstTime.
    const bt = p.bursts![0].duration; // Assuming p.burstTime is mapped to bursts[0].duration in simple cases
    return (w + bt) / bt;
  }

  addProcess(process: InternalProcess): void {
    this.readyQueue.push(process);
  }

  getNextProcess(currentTime: number): InternalProcess | null {
    if (this.readyQueue.length === 0) return null;

    // Sort ready queue based on HRRN at the CURRENT time
    this.readyQueue.sort((a, b) => {
      const aRR = this.getResponseRatio(a, currentTime);
      const bRR = this.getResponseRatio(b, currentTime);
      
      if (aRR !== bRR) return bRR - aRR; // Highest RR first
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });

    return this.readyQueue.shift()!;
  }

  getDecisionInfo(selected: InternalProcess | null, currentTime: number): SchedulingDecisionInfo | null {
    if (!selected) return null;
    
    const criterionValues: Record<string, string> = {};
    const btSelected = selected.bursts![0].duration;
    const wSelected = currentTime - selected.arrivalTime;
    const rrSelected = (wSelected + btSelected) / btSelected;
    
    criterionValues[selected.pid] = `RR=${rrSelected} (W=${wSelected}, BT=${btSelected})`;
    
    for (const p of this.readyQueue) {
      const bt = p.bursts![0].duration;
      const w = currentTime - p.arrivalTime;
      const rr = (w + bt) / bt;
      criterionValues[p.pid] = `RR=${rr} (W=${w}, BT=${bt})`;
    }

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'Response Ratio',
      criterionValues,
      reason: `${selected.pid} was selected because it has the highest response ratio among the available processes.`
    };
  }
}

export const simulateHRRN: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new HRRNStrategy();
  return runUnifiedEngine(processes, config || { algorithm: 'HRRN' as any }, strategy);
};
