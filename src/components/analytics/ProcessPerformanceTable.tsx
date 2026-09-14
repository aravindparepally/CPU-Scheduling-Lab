import React from 'react';
import { SimulationResult } from '../../domain';

interface ProcessPerformanceTableProps {
  result: SimulationResult;
}

export const ProcessPerformanceTable: React.FC<ProcessPerformanceTableProps> = ({ result }) => {
  if (result.finalProcesses.length === 0) {
    return <div className="text-slate-500 text-sm italic py-4">No process data available.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
            <th className="px-3 py-2 rounded-tl-lg">PID</th>
            <th className="px-3 py-2">AT</th>
            <th className="px-3 py-2">BT</th>
            <th className="px-3 py-2">CT</th>
            <th className="px-3 py-2">TAT</th>
            <th className="px-3 py-2">WT</th>
            <th className="px-3 py-2 rounded-tr-lg">RT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {result.finalProcesses.map(p => (
            <tr key={p.pid} className="hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 font-medium text-slate-800">{p.pid}</td>
              <td className="px-3 py-2 text-slate-600">{p.arrivalTime}</td>
              <td className="px-3 py-2 text-slate-600">{p.burstTime}</td>
              <td className="px-3 py-2 text-slate-600">{p.completionTime ?? '-'}</td>
              <td className="px-3 py-2 font-medium text-blue-700">{p.turnaroundTime ?? '-'}</td>
              <td className="px-3 py-2 font-medium text-amber-700">{p.waitingTime ?? '-'}</td>
              <td className="px-3 py-2 font-medium text-emerald-700">{p.responseTime ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
