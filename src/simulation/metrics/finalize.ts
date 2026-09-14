import { Process, GanttSegment, SimulationEvent, SchedulingDecision, SimulationResult } from '../../domain';
import {
  calculateAllProcessMetrics,
  calculateAverageWaitingTime,
  calculateAverageTurnaroundTime,
  calculateAverageResponseTime,
  calculateCpuUtilization,
  calculateThroughput,
  calculateContextSwitches
} from './index';

export const finalizeSimulationResult = (
  initialProcesses: Process[],
  ganttSegments: GanttSegment[],
  simulationEvents: SimulationEvent[],
  schedulingDecisions: SchedulingDecision[]
): SimulationResult => {
  const finalProcesses = calculateAllProcessMetrics(initialProcesses, ganttSegments);
  
  const totalSimulationTime = ganttSegments.length > 0 
    ? Math.max(...ganttSegments.map(s => s.endTime))
    : 0;

  return {
    finalProcesses,
    ganttSegments,
    simulationEvents,
    schedulingDecisions,
    cpuUtilization: calculateCpuUtilization(ganttSegments),
    throughput: calculateThroughput(finalProcesses, ganttSegments),
    contextSwitchCount: calculateContextSwitches(ganttSegments),
    averageWaitingTime: calculateAverageWaitingTime(finalProcesses),
    averageTurnaroundTime: calculateAverageTurnaroundTime(finalProcesses),
    averageResponseTime: calculateAverageResponseTime(finalProcesses),
    totalSimulationTime
  };
};
