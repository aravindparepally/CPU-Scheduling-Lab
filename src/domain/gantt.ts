export interface GanttSegment {
  pid: string | 'CPU_IDLE';
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}
