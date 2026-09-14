import React from 'react';
import { TimelineMarker } from './adapter';

interface GanttMarkersProps {
  markers: TimelineMarker[];
  totalTime: number;
}

export const GanttMarkers: React.FC<GanttMarkersProps> = ({ markers, totalTime }) => {
  if (totalTime === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {markers.map((marker, idx) => {
        const leftPct = (marker.timestamp / totalTime) * 100;
        
        let markerColor = 'bg-slate-400';
        let icon = null;
        
        switch (marker.type) {
          case 'PREEMPTION':
            markerColor = 'bg-red-600';
            break;
          case 'QUANTUM_EXPIRED':
            markerColor = 'bg-amber-500';
            icon = (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
            break;
          case 'QUEUE_CHANGE':
            markerColor = 'bg-blue-500';
            icon = marker.label === 'Promotion' ? (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            );
            break;
        }

          // Dynamic tooltip alignment to prevent horizontal clipping near edges
          let tooltipStyle: React.CSSProperties = { left: '50%', transform: 'translateX(-50%)' };
          let caretStyle: React.CSSProperties = { left: '50%', transform: 'translateX(-50%)' };

          if (leftPct < 15) {
            tooltipStyle = { left: '0', transform: 'translateX(-12px)' };
            caretStyle = { left: '12px', transform: 'translateX(-50%)' };
          } else if (leftPct > 85) {
            tooltipStyle = { right: '0', transform: 'translateX(12px)' };
            caretStyle = { right: '12px', transform: 'translateX(50%)' };
          }

          return (
            <div 
              key={`${marker.timestamp}-${marker.type}-${idx}`}
              className="absolute top-0 bottom-0 w-px z-20 hover:z-50 flex flex-col items-center pointer-events-auto group"
              style={{ left: `${leftPct}%` }}
            >
              {/* The vertical line */}
              <div className={`h-full ${marker.type === 'PREEMPTION' ? 'border-l-2 border-dashed border-red-600 opacity-100' : `w-px ${markerColor} opacity-70`} group-hover:opacity-100 group-hover:w-0.5 transition-all z-0`}></div>
              
              {/* The marker icon/dot */}
              <div className={`absolute -top-3 rounded-full shadow-sm border border-white flex items-center justify-center text-[10px] cursor-help z-10
                ${marker.type === 'PREEMPTION' ? 'w-4 h-4 bg-red-600' : `w-5 h-5 ${markerColor}`}
              `}>
                {marker.type !== 'PREEMPTION' && icon}
              </div>

              {/* Marker Tooltip */}
              <div 
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-12 bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none"
                style={tooltipStyle}
              >
                <div className="font-bold">{marker.label}</div>
                <div className="text-slate-300">
                  Time: {marker.timestamp} {marker.pid && `| Process: ${marker.pid}`}
                </div>
                {marker.reason && <div className="text-slate-400 text-[10px] max-w-[200px] truncate">{marker.reason}</div>}
                <div 
                  className="absolute -bottom-1 border-4 border-transparent border-t-slate-800"
                  style={caretStyle}
                ></div>
              </div>
            </div>
          );
      })}
    </div>
  );
};
