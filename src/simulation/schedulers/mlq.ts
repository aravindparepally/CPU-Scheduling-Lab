

import { Process, SimulationResult, AlgorithmConfig, ProcessType } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';
import { PriorityDirection } from '../../domain/config';

class MLQStrategy implements SchedulingStrategy {
  private queues: InternalProcess[][] = [[], [], [], []];
  private globalPreemption: boolean = true;
  private batchTimeQuantum: number = 2;
  private stuPreemptive: boolean = false;
  private stuAgingRate: number = 0;
  private stuSmallerHigher: boolean = true;

  setConfig(config: AlgorithmConfig): void {
    const mlqConfig = config.mlq;
    this.globalPreemption = mlqConfig?.globalPreemption ?? true;
    this.batchTimeQuantum = mlqConfig?.batchTimeQuantum ?? 2;
    const stuPriConfig = mlqConfig?.studentPriorityConfig;
    this.stuPreemptive = stuPriConfig?.isPreemptive ?? false;
    this.stuAgingRate = stuPriConfig?.agingRate ?? 0;
    this.stuSmallerHigher = stuPriConfig?.priorityDirection !== PriorityDirection.LARGER_IS_HIGHER;
  }

  private mapProcessTypeToQueueLevel(type?: ProcessType): number {
    switch (type) {
      case ProcessType.SYSTEM: return 0;
      case ProcessType.INTERACTIVE: return 1;
      case ProcessType.BATCH: return 2;
      case ProcessType.STUDENT: return 3;
      default: return 2; 
    }
  }

  private getQueueName(level: number): string {
    switch(level) {
      case 0: return 'SYSTEM';
      case 1: return 'INTERACTIVE';
      case 2: return 'BATCH';
      case 3: return 'STUDENT';
      default: return 'UNKNOWN';
    }
  }

  private getPolicyName(level: number): string {
    switch(level) {
      case 0: return 'FCFS';
      case 1: return 'SJF';
      case 2: return 'RR';
      case 3: return 'PRIORITY';
      default: return 'UNKNOWN';
    }
  }

  private getWaitingTime(p: InternalProcess, time: number): number {
    const totalBurst = p.burstTime ?? p.bursts![0].duration;
    const remaining = p.remainingBurstTime || 0;
    return (time - p.arrivalTime) - (totalBurst - remaining);
  }

  private getEffectivePriority(p: InternalProcess, time: number): number {
    return (p.priority ?? 0) - this.stuAgingRate * this.getWaitingTime(p, time);
  }

  private comparePriority(p1: number, p2: number): number {
    if (this.stuSmallerHigher) return p1 - p2;
    return p2 - p1;
  }

  private sortQueue(level: number, time: number): void {
    if (level === 0) {
      this.queues[0].sort((a, b) => {
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a._originalIndex - b._originalIndex;
      });
    } else if (level === 1) {
      this.queues[1].sort((a, b) => {
        if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a._originalIndex - b._originalIndex;
      });
    } else if (level === 3) {
      this.queues[3].sort((a, b) => {
        const epA = this.getEffectivePriority(a, time);
        const epB = this.getEffectivePriority(b, time);
        const diff = this.comparePriority(epA, epB);
        if (diff !== 0) return diff;
        if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
        return a._originalIndex - b._originalIndex;
      });
    }
  }

  addProcess(process: InternalProcess, currentTime: number): void {
    const level = this.mapProcessTypeToQueueLevel(process.processType);
    (process as any)._queueLevel = level;

    if (level === 2) {
      if (process._timeInCurrentBurst > 0 && process._timeInCurrentBurst < this.batchTimeQuantum) {
        // Interrupted before quantum expired (cross-queue preemption) -> put at front
        this.queues[2].unshift(process);
      } else {
        // New arrival or quantum expired -> put at back
        this.queues[2].push(process);
      }
    } else {
      this.queues[level].push(process);
      this.sortQueue(level, currentTime);
    }
  }

  getNextProcess(currentTime: number): InternalProcess | null {
    if (this.stuAgingRate > 0 && this.queues[3].length > 0) {
      this.sortQueue(3, currentTime);
    }

    for (let i = 0; i < 4; i++) {
      if (this.queues[i].length > 0) {
        return this.queues[i].shift()!;
      }
    }
    return null;
  }

  shouldPreempt(runningProcess: InternalProcess, _newlyReady: InternalProcess[], currentTime: number): boolean {
    const runLevel = (runningProcess as any)._queueLevel;
    
    // Cross-queue preemption
    if (this.globalPreemption) {
      for (let i = 0; i < runLevel; i++) {
        if (this.queues[i].length > 0) {
          return true; // Found a higher-priority queue with processes
        }
      }
    }

    // Within Student queue preemption
    if (runLevel === 3 && this.stuPreemptive) {
      this.sortQueue(3, currentTime);
      if (this.queues[3].length > 0) {
        const bestReady = this.queues[3][0];
        const epBest = this.getEffectivePriority(bestReady, currentTime);
        const epRun = this.getEffectivePriority(runningProcess, currentTime);
        if (this.comparePriority(epBest, epRun) < 0) {
          return true;
        }
      }
    }

    return false;
  }

  isQuantumExpired(running: InternalProcess, timeInCurrentBurst: number): boolean {
    const runLevel = (running as any)._queueLevel;
    if (runLevel === 2) {
      return timeInCurrentBurst >= this.batchTimeQuantum;
    }
    return false;
  }

  getNextEventTime(runningProcess: InternalProcess, currentTime: number): number {
    const runLevel = (runningProcess as any)._queueLevel;
    
    if (runLevel === 3 && this.stuPreemptive && this.stuAgingRate > 0 && this.queues[3].length > 0) {
      const pRun = this.getEffectivePriority(runningProcess, currentTime);
      let minDelta = Infinity;
      
      for (const p of this.queues[3]) {
        const pWait = this.getEffectivePriority(p, currentTime);
        if (this.stuSmallerHigher) {
           const diff = pWait - pRun;
           if (diff >= 0) {
             const delta = Math.floor(diff / this.stuAgingRate) + 1;
             if (delta < minDelta) minDelta = delta;
           }
        }
      }
      if (minDelta !== Infinity) {
        return currentTime + minDelta;
      }
    }
    return Infinity;
  }

  getDecisionInfo(selected: InternalProcess | null, _currentTime: number): SchedulingDecisionInfo | null {
    if (!selected) return null;
    
    const level = (selected as any)._queueLevel;
    const qName = this.getQueueName(level);
    const pName = this.getPolicyName(level);
    let criteria = `Queue=${qName}, Policy=${pName}`;
    if (level === 1) criteria += `, BT=${selected.burstTime}`;
    if (level === 2) criteria += `, TQ=${this.batchTimeQuantum}`;
    if (level === 3) criteria += `, Priority=${selected.priority ?? 0}`;

    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.queues[level]].map(p => p.pid),
      selectionCriterion: criteria,
      criterionValues: {},
      reason: `Selected highest-priority non-empty queue (${qName}).`
    };
  }
}

export const simulateMLQ: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new MLQStrategy();
  strategy.setConfig(config || { algorithm: 'MLQ' as any });
  return runUnifiedEngine(processes, config || { algorithm: 'MLQ' as any }, strategy);
};
