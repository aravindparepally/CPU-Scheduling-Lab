import React, { useMemo } from 'react';
import { SimulationResult, AlgorithmIdentifier } from '../../domain';
import { GlobalMetricsView } from './GlobalMetricsView';
import { ProcessPerformanceTable } from './ProcessPerformanceTable';
import { AlgorithmProfileView } from './AlgorithmProfileView';
import { ObservedBehaviorView } from './ObservedBehaviorView';
import { MetricDistributionChart } from './MetricDistributionChart';
import { getPreemptionStats } from '../../analytics';

interface AnalyticsDashboardProps {
  result: SimulationResult;
  algorithm: AlgorithmIdentifier;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ result, algorithm }) => {
  const preemptionStats = useMemo(() => getPreemptionStats(result.simulationEvents), [result.simulationEvents]);

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Simulation Analytics</h2>
      </div>

      {/* 1. Process Performance */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Process Performance</h3>
        <ProcessPerformanceTable result={result} />
      </div>

      {/* 2. Metric Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Metric Distributions</h3>
          <MetricDistributionChart 
            result={result} 
            metric="waitingTime" 
            title="Waiting Time" 
            colorClass="bg-amber-400" 
          />
          <MetricDistributionChart 
            result={result} 
            metric="turnaroundTime" 
            title="Turnaround Time" 
            colorClass="bg-blue-400" 
          />
          <MetricDistributionChart 
            result={result} 
            metric="responseTime" 
            title="Response Time" 
            colorClass="bg-emerald-400" 
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <ObservedBehaviorView result={result} algorithm={algorithm} />
        </div>
      </div>

      {/* 3. Remaining (Global Metrics & Algorithm Profile) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mt-2">Aggregate Metrics</h3>
        <GlobalMetricsView result={result} preemptionCount={preemptionStats.count} />
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mt-4">
          <AlgorithmProfileView algorithm={algorithm} />
        </div>
      </div>
    </div>
  );
};
