import { Process } from '../domain';

export interface AlgorithmProfile {
  characteristics: string[];
  strengths: string[];
  tradeoffs: string[];
}

export interface MetricExtremes {
  lowest: Process[];
  highest: Process[];
  lowestValue: number;
  highestValue: number;
}

export interface ProcessExtremes {
  waitingTime?: MetricExtremes;
  turnaroundTime?: MetricExtremes;
  responseTime?: MetricExtremes;
}

export interface PreemptionStats {
  count: number;
  preemptedProcessIds: string[];
}
