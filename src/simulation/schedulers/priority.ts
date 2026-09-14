

import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';
import { PriorityDirection } from '../../domain/config';

class PriorityStrategy implements SchedulingStrategy {
  private readyQueue: InternalProcess[] = [];
  private isPreemptive: boolean = false;
  private agingRate: number = 0;
  private isSmallerHigher: boolean = true;

  setConfig(config: AlgorithmConfig): void {
    this.isPreemptive = config.priority?.isPreemptive ?? false;
    this.agingRate = config.priority?.agingRate ?? 0;
    this.isSmallerHigher = config.priority?.priorityDirection !== PriorityDirection.LARGER_IS_HIGHER;
  }

  private getWaitingTime(p: InternalProcess, time: number): number {
    // In original logic: (time - p.arrivalTime) - (p.burstTime - p.remainingTime)
    // We map burstTime to bursts![0].duration for the first CPU burst in simple tests
    const totalBurst = p.burstTime ?? p.bursts![0].duration;
    const remaining = p.remainingBurstTime || 0;
    return (time - p.arrivalTime) - (totalBurst - remaining);
  }

  private getEffectivePriority(p: InternalProcess, time: number): number {
    const basePriority = p.priority ?? 0;
    return basePriority - this.agingRate * this.getWaitingTime(p, time);
  }

  private comparePriority(p1: number, p2: number): number {
    if (this.isSmallerHigher) return p1 - p2;
    return p2 - p1;
  }

  private sortReadyQueue(time: number): void {
    this.readyQueue.sort((a, b) => {
      const pA = this.getEffectivePriority(a, time);
      const pB = this.getEffectivePriority(b, time);
      
      const diff = this.comparePriority(pA, pB);
      if (diff !== 0) return diff;
      
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a._originalIndex - b._originalIndex;
    });
  }

  addProcess(process: InternalProcess, currentTime: number): void {
    this.readyQueue.push(process);
    this.sortReadyQueue(currentTime);
  }

  getNextProcess(currentTime: number): InternalProcess | null {
    if (this.readyQueue.length === 0) return null;
    this.sortReadyQueue(currentTime);
    return this.readyQueue.shift()!;
  }

  shouldPreempt(runningProcess: InternalProcess, _newlyReady: InternalProcess[], currentTime: number): boolean {
    if (!this.isPreemptive) return false;
    
    // Sort newly ready just in case? The addProcess already sorted the ready queue.
    // So readyQueue[0] is the best candidate. But we are passed newlyReady. 
    // We should just check if ANY process in readyQueue has strictly better priority.
    // wait, we only need to check if the best process in readyQueue is better than running.
    this.sortReadyQueue(currentTime);
    
    if (this.readyQueue.length === 0) return false;
    
    const bestReady = this.readyQueue[0];
    const pBest = this.getEffectivePriority(bestReady, currentTime);
    const pRun = this.getEffectivePriority(runningProcess, currentTime);
    
    return this.comparePriority(pBest, pRun) < 0;
  }

  getNextEventTime(runningProcess: InternalProcess, currentTime: number): number {
    if (!this.isPreemptive || this.agingRate <= 0 || this.readyQueue.length === 0) {
      return Infinity;
    }

    const pRun = this.getEffectivePriority(runningProcess, currentTime);
    let minDelta = Infinity;

    for (const p of this.readyQueue) {
      const pWaiting = this.getEffectivePriority(p, currentTime);
      
      let delta = Infinity;
      if (this.isSmallerHigher) {
         const diff = pWaiting - pRun;
         if (diff >= 0) {
            delta = Math.floor(diff / this.agingRate) + 1;
         }
      }
      
      if (delta > 0 && delta < minDelta) {
         minDelta = delta;
      }
    }

    if (minDelta !== Infinity) {
      return currentTime + minDelta;
    }
    return Infinity;
  }

  getDecisionInfo(selected: InternalProcess | null, currentTime: number): SchedulingDecisionInfo | null {
    if (!selected) return null;
    
    const criterionValues: Record<string, string> = {};
    const runPri = this.getEffectivePriority(selected, currentTime);
    const runWait = this.getWaitingTime(selected, currentTime);
    criterionValues[selected.pid] = `EP=${runPri} (BP=${selected.priority ?? 0}, W=${runWait})`;
    
    for (const p of this.readyQueue) {
      const ep = this.getEffectivePriority(p, currentTime);
      const w = this.getWaitingTime(p, currentTime);
      criterionValues[p.pid] = `EP=${ep} (BP=${p.priority ?? 0}, W=${w})`;
    }

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.readyQueue].map(p => p.pid),
      selectionCriterion: 'Priority',
      criterionValues,
      reason: `${selected.pid} was selected because it has the highest priority among available processes.`
    };
  }
}

export const simulatePriority: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new PriorityStrategy();
  strategy.setConfig(config || { algorithm: 'Priority' as any });
  return runUnifiedEngine(processes, config || { algorithm: 'Priority' as any }, strategy);
};
