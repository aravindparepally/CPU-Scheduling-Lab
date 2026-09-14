import React from 'react';
import { SimulationResult } from '../../domain';

interface MetricsTableProps {
  result: SimulationResult;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ result }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <h3 className="text-sm font-bold text-slate-800 mb-4">Process Metrics</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3">PID</th>
              <th className="px-4 py-3 text-right">AT</th>
              <th className="px-4 py-3 text-right">BT</th>
              <th className="px-4 py-3 text-right">CT</th>
              <th className="px-4 py-3 text-right">TAT</th>
              <th className="px-4 py-3 text-right">WT</th>
              <th className="px-4 py-3 text-right">RT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.finalProcesses.map((p) => (
              <tr key={p.pid} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{p.pid}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{p.arrivalTime}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{p.burstTime}</td>
                <td className="px-4 py-2.5 text-right font-medium text-blue-600">{p.completionTime}</td>
                <td className="px-4 py-2.5 text-right font-medium text-purple-600">{p.turnaroundTime}</td>
                <td className="px-4 py-2.5 text-right font-medium text-rose-600">{p.waitingTime}</td>
                <td className="px-4 py-2.5 text-right font-medium text-emerald-600">{p.responseTime}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t-2 border-slate-200">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wider">Averages</td>
              <td className="px-4 py-3 text-right">{result.averageTurnaroundTime.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{result.averageWaitingTime.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">{result.averageResponseTime.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
