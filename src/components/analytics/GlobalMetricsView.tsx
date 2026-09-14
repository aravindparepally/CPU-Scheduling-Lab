import React from 'react';
import { SimulationResult } from '../../domain';

interface GlobalMetricsViewProps {
  result: SimulationResult;
  preemptionCount: number;
}

export const GlobalMetricsView: React.FC<GlobalMetricsViewProps> = ({ result, preemptionCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard 
        label="Avg Waiting Time" 
        value={result.averageWaitingTime.toFixed(2)} 
        trend={result.averageWaitingTime === 0 ? 'perfect' : 'neutral'}
      />
      <MetricCard 
        label="Avg Turnaround Time" 
        value={result.averageTurnaroundTime.toFixed(2)} 
      />
      <MetricCard 
        label="Avg Response Time" 
        value={result.averageResponseTime.toFixed(2)} 
      />
      <MetricCard 
        label="CPU Utilization" 
        value={`${result.cpuUtilization.toFixed(1)}%`} 
        progress={result.cpuUtilization}
      />
      <MetricCard 
        label="Context Switches" 
        value={result.contextSwitchCount.toString()} 
      />
      <MetricCard 
        label="Preemptions" 
        value={preemptionCount.toString()} 
      />
      <MetricCard 
        label="Throughput" 
        value={`${result.throughput.toFixed(3)} p/u`} 
        tooltip="Processes completed per unit of time"
      />
      <MetricCard 
        label="Total Time" 
        value={result.totalSimulationTime.toString()} 
      />
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  trend?: 'perfect' | 'neutral';
  progress?: number;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend = 'neutral', progress, tooltip }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between" title={tooltip}>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
        {label}
      </span>
      <div className="flex items-end justify-between mt-1">
        <span className={`text-2xl font-bold tracking-tight ${trend === 'perfect' ? 'text-emerald-600' : 'text-slate-800'}`}>
          {value}
        </span>
      </div>
      {progress !== undefined && (
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-blue-500 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar" 
            aria-valuenow={progress} 
            aria-valuemin={0} 
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  );
};
