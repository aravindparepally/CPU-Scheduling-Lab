import React from 'react';
import { GanttSegment, SimulationEvent } from '../../../domain';

interface GanttDetailsProps {
  segment: GanttSegment | null;
  events: SimulationEvent[];
}

export const GanttDetails: React.FC<GanttDetailsProps> = ({ segment, events }) => {
  if (!segment) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 text-sm h-32 text-center">
        <svg className="w-8 h-8 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        Select an execution segment to inspect its details.
      </div>
    );
  }

  const isIdle = segment.pid === 'CPU_IDLE';

  return (
    <div className="bg-white border border-blue-100 shadow-sm rounded-lg p-5">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
        <div className={`w-3 h-3 rounded-full ${isIdle ? 'bg-slate-400' : 'bg-blue-500'}`}></div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          {isIdle ? 'CPU Idle Segment' : `Execution Segment: ${segment.pid}`}
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Start Time</div>
          <div className="text-sm font-medium text-slate-800">{segment.startTime}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">End Time</div>
          <div className="text-sm font-medium text-slate-800">{segment.endTime}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Duration</div>
          <div className="text-sm font-medium text-slate-800">{segment.duration}</div>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[10px] uppercase font-semibold text-slate-500 mb-2">Related Events</div>
          <ul className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2 items-start">
                <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-1 py-0.5 rounded shrink-0">t={e.timestamp}</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-800">{e.type}</span>
                  {e.reason && <span className="text-slate-500">{e.reason}</span>}
                  {e.newQueue !== undefined && <span className="text-blue-600 font-medium">Moved to Queue {e.newQueue}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
