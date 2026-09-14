import { describe, it, expect } from 'vitest';
import { createProcess, ProcessType, ProcessState } from '../process';
import { AlgorithmIdentifier, SchedulingMode } from '../algorithm';
import { SimulationEventType } from '../event';

describe('Domain Models', () => {
  it('creates a basic process correctly', () => {
    const process = createProcess('P1', 0, 10);
    expect(process.pid).toBe('P1');
    expect(process.arrivalTime).toBe(0);
    expect(process.burstTime).toBe(10);
    expect(process.remainingTime).toBe(10);
    expect(process.firstStartTime).toBeNull();
  });

  it('creates a process with optional properties', () => {
    const process = createProcess('P2', 2, 5, {
      priority: 1,
      processType: ProcessType.SYSTEM
    });
    
    expect(process.pid).toBe('P2');
    expect(process.priority).toBe(1);
    expect(process.processType).toBe(ProcessType.SYSTEM);
    expect(process.remainingTime).toBe(5);
  });

  it('verifies algorithm identifiers exist', () => {
    expect(AlgorithmIdentifier.FCFS).toBe('FCFS');
    expect(AlgorithmIdentifier.RR).toBe('RR');
  });

  it('verifies scheduling modes exist', () => {
    expect(SchedulingMode.PREEMPTIVE).toBe('PREEMPTIVE');
    expect(SchedulingMode.NON_PREEMPTIVE).toBe('NON_PREEMPTIVE');
  });

  it('verifies simulation events exist', () => {
    expect(SimulationEventType.PROCESS_ARRIVAL).toBe('PROCESS_ARRIVAL');
    expect(SimulationEventType.CONTEXT_SWITCH).toBe('CONTEXT_SWITCH');
  });

  it('verifies process states exist', () => {
    expect(ProcessState.READY).toBe('READY');
    expect(ProcessState.RUNNING).toBe('RUNNING');
  });
});
