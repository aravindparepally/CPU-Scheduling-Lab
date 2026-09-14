

import { Process, SimulationResult, AlgorithmConfig } from '../../domain';
import { InternalProcess, SchedulingStrategy, SchedulerFunction, SchedulingDecisionInfo } from './types';
import { runUnifiedEngine } from '../engine/core';

class MLFQStrategy implements SchedulingStrategy {
  private queues: InternalProcess[][] = [[], [], []];
  private quantums: number[] = [2, 4, 8];
  private boostInterval: number = 20;
  private nextBoostTime: number = 20;
  private currentRunning: InternalProcess | null = null;

  setConfig(config: AlgorithmConfig): void {
    const mlfqConfig = config.mlfq;
    this.quantums = mlfqConfig?.quantums ?? [2, 4, 8];
    this.boostInterval = mlfqConfig?.boostInterval ?? 20;
    this.nextBoostTime = this.boostInterval;
  }

  private checkBoost(currentTime: number): void {
    if (currentTime > 0 && currentTime >= this.nextBoostTime) {
      for (let lvl = 1; lvl <= 2; lvl++) {
        while (this.queues[lvl].length > 0) {
          const p = this.queues[lvl].shift()!;
          (p as any)._mlfq_queue_level = 0;
          (p as any)._mlfq_quantum_remaining = this.quantums[0];
          this.queues[0].push(p);
        }
      }
      
      // Advance nextBoostTime
      while (this.nextBoostTime <= currentTime) {
        this.nextBoostTime += this.boostInterval;
      }
    }
  }

  addProcess(process: InternalProcess, currentTime: number): void {
    this.checkBoost(currentTime);

    const p = process as any;
    if (p._mlfq_queue_level === undefined) {
      p._mlfq_queue_level = 0;
      p._mlfq_quantum_remaining = this.quantums[0];
      p._mlfq_last_burst_index = process.currentBurstIndex;
    }

    if (p._mlfq_last_burst_index === process.currentBurstIndex && process._timeInCurrentBurst > 0) {
      // It was running this burst and got interrupted
      p._mlfq_quantum_remaining -= process._timeInCurrentBurst;
      
      if (p._mlfq_quantum_remaining <= 0) {
        // Demote
        p._mlfq_queue_level = Math.min(p._mlfq_queue_level + 1, 2);
        p._mlfq_quantum_remaining = this.quantums[p._mlfq_queue_level];
      }
    } else {
      // New burst (e.g. returning from I/O)
      p._mlfq_quantum_remaining = this.quantums[p._mlfq_queue_level];
    }

    p._mlfq_last_burst_index = process.currentBurstIndex;
    this.queues[p._mlfq_queue_level].push(process);
    
    if (this.currentRunning === process) {
      this.currentRunning = null;
    }
  }

  getNextProcess(currentTime: number): InternalProcess | null {
    this.checkBoost(currentTime);

    for (let i = 0; i < 3; i++) {
      if (this.queues[i].length > 0) {
        const p = this.queues[i].shift()!;
        this.currentRunning = p;
        return p;
      }
    }
    this.currentRunning = null;
    return null;
  }

  shouldPreempt(runningProcess: InternalProcess, _newlyReady: InternalProcess[], currentTime: number): boolean {
    this.checkBoost(currentTime);
    
    const runLevel = (runningProcess as any)._mlfq_queue_level;
    for (let i = 0; i < runLevel; i++) {
      if (this.queues[i].length > 0) {
        return true;
      }
    }
    return false;
  }

  isQuantumExpired(running: InternalProcess, timeInCurrentBurst: number): boolean {
    const qRem = (running as any)._mlfq_quantum_remaining;
    return timeInCurrentBurst >= qRem;
  }

  getNextEventTime(runningProcess: InternalProcess, currentTime: number): number {
    let next = this.nextBoostTime;
    const qRem = (runningProcess as any)._mlfq_quantum_remaining;
    const expiryTime = currentTime + (qRem - runningProcess._timeInCurrentBurst);
    
    if (expiryTime < next) {
      next = expiryTime;
    }
    return next;
  }

  getDecisionInfo(selected: InternalProcess | null, _currentTime: number): SchedulingDecisionInfo | null {
    if (!selected) return null;
    
    const level = (selected as any)._mlfq_queue_level;
    return {
      selectedProcess: selected.pid,
      candidateProcesses: [selected, ...this.queues[level]].map(p => p.pid),
      selectionCriterion: `Level=${level}, Policy=RR, Quantum=${this.quantums[level]}`,
      criterionValues: {},
      reason: `Selected from highest-priority non-empty queue (Level ${level}).`
    };
  }
}

export const simulateMLFQ: SchedulerFunction = (processes: Process[], config?: AlgorithmConfig): SimulationResult => {
  const strategy = new MLFQStrategy();
  strategy.setConfig(config || { algorithm: 'MLFQ' as any });
  return runUnifiedEngine(processes, config || { algorithm: 'MLFQ' as any }, strategy);
};
