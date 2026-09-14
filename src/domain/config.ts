import { AlgorithmIdentifier } from './algorithm';

export enum PriorityDirection {
  SMALLER_IS_HIGHER = 'SMALLER_IS_HIGHER',
  LARGER_IS_HIGHER = 'LARGER_IS_HIGHER',
}

export enum PredictionMode {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}

export enum PromotionPolicy {
  NONE = 'NONE',
  AGING = 'AGING',
}

export enum DemotionPolicy {
  NONE = 'NONE',
  TIME_QUANTUM_EXPIRED = 'TIME_QUANTUM_EXPIRED',
}

export interface RoundRobinConfig {
  timeQuantum: number;
}

export interface PriorityConfig {
  priorityDirection?: PriorityDirection; // defaults to SMALLER_IS_HIGHER
  isPreemptive?: boolean;
  agingRate?: number;
}

export interface SJFConfig {
  predictionMode: PredictionMode;
  predictionMethod?: string;
}

export interface QueueConfiguration {
  level: number;
  algorithm: AlgorithmIdentifier;
  timeQuantum?: number;
  priority?: number;
}

export interface MLFQConfig {
  quantums?: number[]; // e.g. [2, 4, 8]
  boostInterval?: number; // e.g. 20
  // Legacy fields (optional to not break anything if used elsewhere)
  numberOfQueues?: number;
  queueConfigurations?: QueueConfiguration[];
  agingThreshold?: number;
  promotionPolicy?: PromotionPolicy;
  demotionPolicy?: DemotionPolicy;
}

export interface MLQConfig {
  batchTimeQuantum?: number;
  studentPriorityConfig?: PriorityConfig;
  globalPreemption?: boolean;
}

export interface AlgorithmConfig {
  algorithm: AlgorithmIdentifier;
  contextSwitchTime?: number;
  ioEnabled?: boolean;
  roundRobin?: RoundRobinConfig;
  priority?: PriorityConfig;
  sjf?: SJFConfig;
  mlfq?: MLFQConfig;
  mlq?: MLQConfig;
}
