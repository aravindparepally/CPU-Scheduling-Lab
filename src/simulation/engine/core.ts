import {
  Process,
  ProcessState,
  SimulationEvent,
  SimulationEventType,
  GanttSegment,
  SchedulingDecision,
  SimulationResult,
  AlgorithmConfig
} from '../../domain';
import { finalizeSimulationResult } from '../metrics/finalize';
import { InternalProcess, SchedulingStrategy } from '../schedulers/types';

export const runUnifiedEngine = (
  processes: Process[],
  config: AlgorithmConfig,
  strategy: SchedulingStrategy
): SimulationResult => {
  const ioEnabled = config.ioEnabled ?? false;
  const csTime = config.contextSwitchTime ?? 0;

  if (strategy.setConfig) {
    strategy.setConfig(config);
  }

  // Initialize processes
  const pList: InternalProcess[] = processes.map((p, index) => {
    // Standardize bursts
    let bursts = p.bursts;
    let computedBurstTime = p.burstTime;

    if (ioEnabled && (!bursts || bursts.length === 0)) {
      if (p.cpuBursts && p.cpuBursts.length > 0) {
        bursts = [];
        computedBurstTime = 0;
        const maxLen = Math.max(p.cpuBursts.length, p.ioBursts?.length || 0);
        for (let i = 0; i < maxLen; i++) {
          if (p.cpuBursts[i] !== undefined && p.cpuBursts[i] > 0) {
            bursts.push({ type: 'CPU', duration: p.cpuBursts[i] });
            computedBurstTime += p.cpuBursts[i];
          }
          if (p.ioBursts && p.ioBursts[i] !== undefined && p.ioBursts[i] > 0) {
            bursts.push({ type: 'IO', duration: p.ioBursts[i] });
          }
        }
      } else if (p.ioStartTime !== undefined && p.ioBurstTime !== undefined && p.ioBurstTime > 0) {
        if (p.ioStartTime !== undefined && p.ioStartTime > 0 && p.ioStartTime < p.burstTime) {
          bursts = [
            { type: 'CPU', duration: p.ioStartTime },
            { type: 'IO', duration: p.ioBurstTime },
            { type: 'CPU', duration: p.burstTime - p.ioStartTime }
          ];
        } else if (p.ioStartTime !== undefined && p.ioStartTime === 0 && p.ioBurstTime !== undefined && p.ioBurstTime > 0) {
          bursts = [
            { type: 'IO', duration: p.ioBurstTime },
            { type: 'CPU', duration: p.burstTime }
          ];
        } else if (p.ioStartTime >= p.burstTime) {
          bursts = [
            { type: 'CPU', duration: p.burstTime },
            { type: 'IO', duration: p.ioBurstTime }
          ];
        }
      }
    }

    if (!ioEnabled || !bursts || bursts.length === 0) {
      bursts = [{ type: 'CPU', duration: p.burstTime }];
      computedBurstTime = p.burstTime;
    }

    return {
      ...p,
      burstTime: computedBurstTime,
      bursts,
      currentBurstIndex: 0,
      remainingBurstTime: bursts[0].duration,
      _originalIndex: index,
      _timeInCurrentBurst: 0,
      _timeInReadyQueue: 0,
      firstStartTime: null,
      completionTime: null,
      waitingTime: null,
      turnaroundTime: null,
      responseTime: null
    };
  });

  const events: SimulationEvent[] = [];
  const gantt: GanttSegment[] = [];
  const decisions: SchedulingDecision[] = [];

  let currentTime = 0;
  
  const unarrived = [...pList].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a._originalIndex - b._originalIndex;
  });

  const waitingQueue: InternalProcess[] = []; // Processes in I/O
  
  let runningProcess: InternalProcess | null = null;
  let csRemaining = 0;
  let csTargetProcess: InternalProcess | null = null;
  let idleStartTime: number | null = null;

  while (unarrived.length > 0 || waitingQueue.length > 0 || runningProcess !== null || csRemaining > 0 || csTargetProcess !== null) {
    let newlyReady: InternalProcess[] = [];
    while (unarrived.length > 0 && unarrived[0].arrivalTime <= currentTime) {
      const p = unarrived.shift()!;
      events.push({
        timestamp: p.arrivalTime,
        type: SimulationEventType.PROCESS_ARRIVAL,
        pid: p.pid,
        previousState: ProcessState.NEW,
        newState: ProcessState.READY,
        reason: 'Process arrived'
      });
      strategy.addProcess(p, currentTime);
      newlyReady.push(p);
    }

    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const p = waitingQueue[i];
      if (p.remainingBurstTime! <= 0) {
        p.currentBurstIndex!++; 
        waitingQueue.splice(i, 1);

        if (p.currentBurstIndex! < p.bursts!.length) {
          p.remainingBurstTime = p.bursts![p.currentBurstIndex!].duration;
          events.push({
            timestamp: currentTime,
            type: SimulationEventType.QUEUE_CHANGE,
            pid: p.pid,
            previousState: ProcessState.BLOCKED,
            newState: ProcessState.READY,
            reason: 'I/O burst completed'
          });
          strategy.addProcess(p, currentTime);
          newlyReady.push(p);
        } else {
          p.completionTime = currentTime;
          events.push({
            timestamp: currentTime,
            type: SimulationEventType.PROCESS_COMPLETION,
            pid: p.pid,
            previousState: ProcessState.BLOCKED,
            newState: ProcessState.COMPLETED,
            reason: 'Execution finished (after I/O)'
          });
        }
      }
    }

    if (runningProcess !== null && runningProcess.remainingBurstTime! <= 0) {
      if (strategy.onProcessCPUCompletion) strategy.onProcessCPUCompletion(runningProcess, currentTime);
      
      runningProcess.currentBurstIndex!++;
      if (runningProcess.currentBurstIndex! < runningProcess.bursts!.length) {
        runningProcess.remainingBurstTime = runningProcess.bursts![runningProcess.currentBurstIndex!].duration;
        waitingQueue.push(runningProcess);
        events.push({
          timestamp: currentTime,
          type: SimulationEventType.QUEUE_CHANGE,
          pid: runningProcess.pid,
          previousState: ProcessState.RUNNING,
          newState: ProcessState.BLOCKED,
          reason: 'Started I/O burst'
        });
      } else {
        runningProcess.completionTime = currentTime;
        events.push({
          timestamp: currentTime,
          type: SimulationEventType.PROCESS_COMPLETION,
          pid: runningProcess.pid,
          previousState: ProcessState.RUNNING,
          newState: ProcessState.COMPLETED,
          reason: 'Execution finished'
        });
      }
      runningProcess = null;
    }

    if (runningProcess !== null) {
      let preempted = false;
      if (strategy.isQuantumExpired && strategy.isQuantumExpired(runningProcess, runningProcess._timeInCurrentBurst)) {
        events.push({
          timestamp: currentTime,
          type: SimulationEventType.TIME_QUANTUM_EXPIRED,
          pid: runningProcess.pid,
          previousState: ProcessState.RUNNING,
          newState: ProcessState.READY,
          reason: 'Time quantum expired'
        });
        preempted = true;
      }
      
      if (!preempted && strategy.shouldPreempt) {
        if (strategy.shouldPreempt(runningProcess, newlyReady, currentTime)) {
          events.push({
            timestamp: currentTime,
            type: SimulationEventType.PREEMPTION,
            pid: runningProcess.pid,
            previousState: ProcessState.RUNNING,
            newState: ProcessState.READY,
            reason: 'Preempted'
          });
          preempted = true;
        }
      }
      
      if (preempted) {
        strategy.addProcess(runningProcess, currentTime);
        runningProcess = null;
      }
    }

    if (runningProcess === null && csRemaining === 0) {
      if (csTargetProcess !== null) {
        let preempted = false;
        if (strategy.shouldPreempt && newlyReady.length > 0) {
          if (strategy.shouldPreempt(csTargetProcess, newlyReady, currentTime)) {
            preempted = true;
          }
        }
        
        if (preempted) {
          events.push({
            timestamp: currentTime,
            type: SimulationEventType.PREEMPTION,
            pid: csTargetProcess.pid,
            previousState: ProcessState.READY,
            newState: ProcessState.READY,
            reason: 'Preempted immediately after context switch'
          });
          strategy.addProcess(csTargetProcess, currentTime);
          csTargetProcess = null;
        } else {
          runningProcess = csTargetProcess;
          csTargetProcess = null;
          if (runningProcess.firstStartTime === null) runningProcess.firstStartTime = currentTime;
          runningProcess._timeInCurrentBurst = 0;
          events.push({
            timestamp: currentTime,
            type: SimulationEventType.EXECUTION,
            pid: runningProcess.pid,
            previousState: ProcessState.READY,
            newState: ProcessState.RUNNING,
            reason: 'Dispatched to CPU'
          });
        }
      }
      
      if (runningProcess === null) {
        const nextProcess = strategy.getNextProcess(currentTime);
        if (nextProcess !== null) {
          if (strategy.getDecisionInfo) {
            const d = strategy.getDecisionInfo(nextProcess, currentTime);
            if (d) decisions.push({ timestamp: currentTime, ...d });
          }
          
          if (csTime > 0) {
            csRemaining = csTime;
            csTargetProcess = nextProcess;
            events.push({
              timestamp: currentTime,
              type: SimulationEventType.CONTEXT_SWITCH,
              reason: `Context switch to ${nextProcess.pid}`
            });
          } else {
            runningProcess = nextProcess;
            if (runningProcess.firstStartTime === null) runningProcess.firstStartTime = currentTime;
            runningProcess._timeInCurrentBurst = 0;
            events.push({
              timestamp: currentTime,
              type: SimulationEventType.EXECUTION,
              pid: runningProcess.pid,
              previousState: ProcessState.READY,
              newState: ProcessState.RUNNING,
              reason: 'Dispatched to CPU (no CS time)'
            });
          }
          
          if (idleStartTime !== null) {
            gantt.push({
              pid: 'CPU_IDLE',
              startTime: idleStartTime,
              endTime: currentTime,
              duration: currentTime - idleStartTime
            });
            idleStartTime = null;
          }
        }
      }
    }

    let nextTime = Infinity;

    if (unarrived.length > 0) {
      nextTime = Math.min(nextTime, unarrived[0].arrivalTime);
    }
    if (waitingQueue.length > 0) {
      for (const p of waitingQueue) {
        nextTime = Math.min(nextTime, currentTime + p.remainingBurstTime!);
      }
    }
    if (csRemaining > 0) {
      nextTime = Math.min(nextTime, currentTime + csRemaining);
    }
    if (runningProcess !== null && runningProcess.remainingBurstTime! > 0) {
      nextTime = Math.min(nextTime, currentTime + runningProcess.remainingBurstTime!);
    }
    if (runningProcess !== null && strategy.isQuantumExpired) {
      nextTime = Math.min(nextTime, currentTime + 1); // Fallback for quantum logic
    }
    if (runningProcess !== null && strategy.getNextEventTime) {
      nextTime = Math.min(nextTime, strategy.getNextEventTime(runningProcess, currentTime));
    }

    if (runningProcess === null && csRemaining === 0) {
      if (nextTime > currentTime && nextTime !== Infinity && idleStartTime === null) {
        idleStartTime = currentTime;
        events.push({
          timestamp: currentTime,
          type: SimulationEventType.CPU_IDLE,
          reason: 'CPU is idle'
        });
      }
    } else {
      if (idleStartTime !== null) {
        gantt.push({
          pid: 'CPU_IDLE',
          startTime: idleStartTime,
          endTime: currentTime,
          duration: currentTime - idleStartTime
        });
        idleStartTime = null;
      }
    }
    
    if (nextTime === Infinity || nextTime <= currentTime) {
      nextTime = currentTime + 1;
    }

    const timeDelta = nextTime - currentTime;
    if (timeDelta > 0) {
      if (runningProcess !== null) {
        runningProcess.remainingBurstTime! -= timeDelta;
        runningProcess._timeInCurrentBurst += timeDelta;
        
        const lastSegment = gantt.length > 0 ? gantt[gantt.length - 1] : null;
        if (lastSegment && lastSegment.pid === runningProcess.pid && lastSegment.endTime === currentTime) {
          lastSegment.endTime += timeDelta;
          lastSegment.duration += timeDelta;
        } else {
          gantt.push({
            pid: runningProcess.pid,
            startTime: currentTime,
            endTime: currentTime + timeDelta,
            duration: timeDelta
          });
        }
      }
      
      if (csRemaining > 0) {
        csRemaining -= timeDelta;
        const lastSegment = gantt.length > 0 ? gantt[gantt.length - 1] : null;
        if (lastSegment && lastSegment.pid === 'CS' && lastSegment.endTime === currentTime) {
          lastSegment.endTime += timeDelta;
          lastSegment.duration += timeDelta;
        } else {
          gantt.push({
            pid: 'CS',
            startTime: currentTime,
            endTime: currentTime + timeDelta,
            duration: timeDelta
          });
        }
      }
      
      for (const p of waitingQueue) p.remainingBurstTime! -= timeDelta;
      
      for (const p of pList) {
        if (p.arrivalTime <= currentTime && p.completionTime === null) {
          if (p !== runningProcess && !waitingQueue.includes(p) && p !== csTargetProcess) {
            p._timeInReadyQueue += timeDelta;
          }
        }
      }

      currentTime = nextTime;
    }
  }

  if (idleStartTime !== null && currentTime > idleStartTime) {
    gantt.push({
      pid: 'CPU_IDLE',
      startTime: idleStartTime,
      endTime: currentTime,
      duration: currentTime - idleStartTime
    });
  }

  const finalProcesses: Process[] = pList.map(p => ({
    pid: p.pid,
    arrivalTime: p.arrivalTime,
    burstTime: p.burstTime,
    remainingTime: p.remainingTime,
    bursts: p.bursts,
    priority: p.priority,
    processType: p.processType,
    queueLevel: p.queueLevel,
    predictedBurstTime: p.predictedBurstTime,
    firstStartTime: p.firstStartTime,
    completionTime: p.completionTime,
    turnaroundTime: p.turnaroundTime,
    responseTime: p.responseTime
  }));

  return finalizeSimulationResult(finalProcesses, gantt, events, decisions);
};
