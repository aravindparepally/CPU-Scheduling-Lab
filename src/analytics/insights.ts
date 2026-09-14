import { SimulationResult, Process, SimulationEvent, SimulationEventType, AlgorithmIdentifier } from '../domain';
import { ProcessExtremes, PreemptionStats } from './types';

export function getProcessExtremes(processes: Process[]): ProcessExtremes {
  if (processes.length === 0) return {};

  const extremes: ProcessExtremes = {};

  const calculateExtreme = (getValue: (p: Process) => number | null | undefined) => {
    let lowestValue = Infinity;
    let highestValue = -Infinity;
    
    // First pass to find min/max
    processes.forEach(p => {
      const val = getValue(p);
      if (val !== undefined && val !== null) {
        if (val < lowestValue) lowestValue = val;
        if (val > highestValue) highestValue = val;
      }
    });

    if (lowestValue === Infinity) return undefined;

    // Second pass to collect ties
    const lowest = processes.filter(p => getValue(p) === lowestValue);
    const highest = processes.filter(p => getValue(p) === highestValue);

    return { lowest, highest, lowestValue, highestValue };
  };

  extremes.waitingTime = calculateExtreme(p => p.waitingTime);
  extremes.turnaroundTime = calculateExtreme(p => p.turnaroundTime);
  extremes.responseTime = calculateExtreme(p => p.responseTime);

  return extremes;
}

export function getPreemptionStats(events: SimulationEvent[]): PreemptionStats {
  const preemptionEvents = events.filter(e => e.type === SimulationEventType.PREEMPTION);
  const preemptedIds = Array.from(new Set(preemptionEvents.map(e => e.pid).filter(Boolean))) as string[];
  
  return {
    count: preemptionEvents.length,
    preemptedProcessIds: preemptedIds
  };
}

export function generateBehaviorInsights(
  result: SimulationResult, 
  algorithm: AlgorithmIdentifier,
  preemptionStats: PreemptionStats,
  extremes: ProcessExtremes
): string[] {
  const insights: string[] = [];
  const pCount = result.finalProcesses.length;

  if (pCount === 0) return ['No processes to analyze.'];

  // CPU utilization
  insights.push(`CPU utilization was ${(result.cpuUtilization * 100).toFixed(1)}%.`);

  // Context switches
  if (result.contextSwitchCount === 0) {
    insights.push(`No context switches occurred (excluding initial dispatches).`);
  } else if (result.contextSwitchCount === 1) {
    insights.push(`1 context switch occurred.`);
  } else {
    insights.push(`${result.contextSwitchCount} context switches occurred.`);
  }

  // Preemptions
  if (preemptionStats.count > 0) {
    insights.push(`${preemptionStats.count} preemption${preemptionStats.count > 1 ? 's' : ''} occurred, affecting ${preemptionStats.preemptedProcessIds.length} process${preemptionStats.preemptedProcessIds.length > 1 ? 'es' : ''}.`);
  } else if (
    algorithm === AlgorithmIdentifier.SRTF || 
    algorithm === AlgorithmIdentifier.RR || 
    algorithm === AlgorithmIdentifier.LRTF ||
    algorithm === AlgorithmIdentifier.MLFQ
  ) {
    insights.push(`Although the algorithm supports preemption, 0 preemptions actually occurred.`);
  }

  // Waiting time extremes
  if (extremes.waitingTime) {
    if (extremes.waitingTime.highestValue === extremes.waitingTime.lowestValue) {
      insights.push(`All processes experienced identical waiting times (${extremes.waitingTime.lowestValue.toFixed(1)}).`);
    } else {
      const hPids = extremes.waitingTime.highest.map(p => p.pid).join(', ');
      insights.push(`${hPids} experienced the highest waiting time (${extremes.waitingTime.highestValue.toFixed(1)}).`);
      
      const lPids = extremes.waitingTime.lowest.map(p => p.pid).join(', ');
      insights.push(`${lPids} experienced the lowest waiting time (${extremes.waitingTime.lowestValue.toFixed(1)}).`);
    }
  }

  return insights;
}
