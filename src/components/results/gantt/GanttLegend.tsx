import React from 'react';

export const GanttLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-4 px-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 bg-slate-100 border border-slate-300 diagonal-stripes rounded-sm"></div>
        <span>CPU Idle</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm"></div>
        <span>Process Execution</span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="w-3 h-3 rounded-full bg-red-600 shadow-sm border border-white"></span>
        <span>Preemption</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm border border-white">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span>Quantum Expiry</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-sm border border-white">
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
        <span>Queue Change</span>
      </div>
    </div>
  );
};
