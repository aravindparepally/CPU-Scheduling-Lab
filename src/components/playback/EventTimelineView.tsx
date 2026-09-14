import React from 'react';
import { SimulationResult } from '../../domain';

interface EventTimelineViewProps {
  result: SimulationResult;
  currentTime: number;
  onEventClick?: (time: number) => void;
}

export const EventTimelineView: React.FC<EventTimelineViewProps> = ({ result, currentTime, onEventClick }) => {
  const events = result.simulationEvents;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full max-h-96">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Event Log
      </h3>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-sm text-slate-400 italic text-center py-4">No events recorded.</div>
        ) : (
          events.map((event, idx) => {
            const isPast = event.timestamp <= currentTime;
            return (
              <button
                key={`${event.timestamp}-${event.type}-${idx}`}
                onClick={() => onEventClick?.(event.timestamp)}
                className={`w-full text-left p-2.5 rounded border flex gap-3 items-start transition-colors outline-none focus:ring-2 focus:ring-blue-500
                  ${isPast ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white border-dashed border-slate-200 opacity-50 hover:opacity-75'}
                `}
                aria-label={`Jump to time ${event.timestamp}`}
              >
                <div className={`font-mono text-[10px] px-1.5 py-0.5 rounded
                  ${isPast ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}
                `}>
                  t={event.timestamp}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-xs font-bold ${isPast ? 'text-slate-700' : 'text-slate-500'}`}>
                    {event.type}
                  </span>
                  {event.pid && (
                    <span className="text-[10px] font-semibold text-slate-600">
                      PID: {event.pid}
                    </span>
                  )}
                  {event.reason && (
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5">
                      {event.reason}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
