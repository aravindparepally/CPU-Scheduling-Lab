import { Process } from './process';
import { SimulationEvent } from './event';
import { GanttSegment } from './gantt';
import { SchedulingDecision } from './state';

export interface SimulationResult {
  finalProcesses: Process[];
  ganttSegments: GanttSegment[];
  simulationEvents: SimulationEvent[];
  schedulingDecisions: SchedulingDecision[];
  
  cpuUtilization: number;
  throughput: number;
  contextSwitchCount: number;
  
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  averageResponseTime: number;
  
  totalSimulationTime: number;
}
