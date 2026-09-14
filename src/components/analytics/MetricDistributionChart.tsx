import React from 'react';
import { SimulationResult } from '../../domain';

interface MetricDistributionChartProps {
  result: SimulationResult;
  metric: 'waitingTime' | 'turnaroundTime' | 'responseTime';
  title: string;
  colorClass: string;
}

export const MetricDistributionChart: React.FC<MetricDistributionChartProps> = ({ result, metric, title, colorClass }) => {
  const processes = result.finalProcesses.filter(p => p[metric] !== undefined);
  
  if (processes.length === 0) {
    return <div className="text-slate-500 text-sm italic">No data available for {title.toLowerCase()}.</div>;
  }

  // Find max value to normalize bar widths
  const maxValue = Math.max(...processes.map(p => p[metric] as number), 1); // minimum 1 to avoid divide by zero

  return (
    <div className="flex flex-col gap-2 w-full">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{title}</h4>
      
      <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2.5">
        {processes.map(p => {
          const val = p[metric] as number;
          const percentage = Math.max(2, (val / maxValue) * 100); // Minimum 2% so zero values are visible slightly
          
          return (
            <div key={p.pid} className="flex items-center gap-3 text-sm">
              <span className="w-8 font-medium text-slate-600 shrink-0">{p.pid}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden flex items-center">
                <div 
                  className={`h-full ${colorClass} transition-all duration-500 ease-out flex items-center px-1.5`}
                  style={{ width: `${percentage}%` }}
                  aria-label={`${title} for ${p.pid}: ${val}`}
                  role="progressbar"
                  aria-valuenow={val}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                >
                </div>
              </div>
              <span className="w-8 text-right font-medium text-slate-700 shrink-0">{val.toFixed(1).replace('.0', '')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
