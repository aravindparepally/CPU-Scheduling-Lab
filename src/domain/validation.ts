import { Process } from './process';

export interface ValidationError {
  field: string;
  message: string;
}

export const validateProcess = (process: Process): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (process.arrivalTime < 0) {
    errors.push({ field: 'arrivalTime', message: 'Arrival time must be >= 0' });
  }

  if (process.burstTime <= 0) {
    errors.push({ field: 'burstTime', message: 'Burst time must be > 0' });
  }

  return errors;
};

export const validateUniquePids = (processes: Process[]): boolean => {
  const pids = new Set(processes.map((p) => p.pid));
  return pids.size === processes.length;
};
