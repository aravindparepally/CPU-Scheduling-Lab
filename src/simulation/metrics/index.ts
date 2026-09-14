import { Process, GanttSegment } from '../../domain';

/**
 * Calculates process-level metrics based on its initial data and execution timeline.
 * Returns a new Process object with firstStartTime, completionTime, turnaroundTime,
 * waitingTime, and responseTime populated.
 * Does not mutate the original process.
 */
export const calculateProcessMetrics = (process: Process, gantt: GanttSegment[]): Process => {
  const processSegments = gantt.filter(segment => segment.pid === process.pid);
  
  if (processSegments.length === 0) {
    // Process never executed
    return {
      ...process,
      firstStartTime: null,
      completionTime: null,
      turnaroundTime: null,
      waitingTime: null,
      responseTime: null,
    };
  }

  // Sort segments chronologically
  const sortedSegments = [...processSegments].sort((a, b) => a.startTime - b.startTime);
  
  const firstStartTime = sortedSegments[0].startTime;
  const completionTime = sortedSegments[sortedSegments.length - 1].endTime;
  
  const turnaroundTime = completionTime - process.arrivalTime;
  
  // Enforce WT = TAT - BT where BT is the total CPU burst time
  const waitingTime = Math.max(0, turnaroundTime - process.burstTime);
  
  const responseTime = firstStartTime - process.arrivalTime;

  return {
    ...process,
    firstStartTime,
    completionTime,
    turnaroundTime,
    waitingTime,
    responseTime,
  };
};

/**
 * Calculates metrics for all processes.
 */
export const calculateAllProcessMetrics = (processes: Process[], gantt: GanttSegment[]): Process[] => {
  return processes.map(p => calculateProcessMetrics(p, gantt));
};

/**
 * Average metric calculations
 */
export const calculateAverageWaitingTime = (processes: Process[]): number => {
  const completed = processes.filter(p => p.waitingTime !== null && p.waitingTime !== undefined);
  if (completed.length === 0) return 0;
  
  const sum = completed.reduce((acc, p) => acc + (p.waitingTime as number), 0);
  return sum / completed.length;
};

export const calculateAverageTurnaroundTime = (processes: Process[]): number => {
  const completed = processes.filter(p => p.turnaroundTime !== null && p.turnaroundTime !== undefined);
  if (completed.length === 0) return 0;
  
  const sum = completed.reduce((acc, p) => acc + (p.turnaroundTime as number), 0);
  return sum / completed.length;
};

export const calculateAverageResponseTime = (processes: Process[]): number => {
  const completed = processes.filter(p => p.responseTime !== null && p.responseTime !== undefined);
  if (completed.length === 0) return 0;
  
  const sum = completed.reduce((acc, p) => acc + (p.responseTime as number), 0);
  return sum / completed.length;
};

/**
 * Calculates CPU Utilization.
 * Formula: (Busy Time / Total Elapsed Time) * 100
 * Busy Time is the sum of durations of all non-IDLE segments.
 * Total Elapsed Time is the maximum endTime among all segments.
 */
export const calculateCpuUtilization = (gantt: GanttSegment[]): number => {
  if (gantt.length === 0) return 0;
  
  const totalElapsedTime = Math.max(...gantt.map(s => s.endTime));
  if (totalElapsedTime === 0) return 0;

  const busyTime = gantt
    .filter(s => s.pid !== 'CPU_IDLE')
    .reduce((sum, s) => sum + s.duration, 0);

  return (busyTime / totalElapsedTime) * 100;
};

/**
 * Calculates Throughput.
 * Formula: Number of completed processes / Total elapsed simulation time
 */
export const calculateThroughput = (processes: Process[], gantt: GanttSegment[]): number => {
  if (gantt.length === 0) return 0;
  
  const totalElapsedTime = Math.max(...gantt.map(s => s.endTime));
  if (totalElapsedTime === 0) return 0;

  const completedCount = processes.filter(p => p.completionTime !== null && p.completionTime !== undefined).length;
  
  return completedCount / totalElapsedTime;
};

export const calculateContextSwitches = (gantt: GanttSegment[]): number => {
  // If the simulation generated explicit context switch segments, 
  // they are the single source of truth for context switch count.
  const csSegments = gantt.filter(s => s.pid === 'CS');
  if (csSegments.length > 0) {
    return csSegments.length;
  }

  // Fallback for csTime = 0 (or algorithms not producing CS segments)
  let switches = 0;
  let lastPid: string | null = null;
  
  // Sort chronologically
  const sortedGantt = [...gantt].sort((a, b) => a.startTime - b.startTime);

  for (const segment of sortedGantt) {
    if (segment.pid === 'CPU_IDLE' || segment.pid === 'CS') continue;
    
    if (lastPid !== null && lastPid !== segment.pid) {
      switches++;
    }
    
    lastPid = segment.pid;
  }
  
  return switches;
};
