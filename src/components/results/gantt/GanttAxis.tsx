import React from 'react';
import { GanttSegment } from '../../../domain';

interface GanttAxisProps {
  segments: GanttSegment[];
  totalTime: number;
}

export const GanttAxis: React.FC<GanttAxisProps> = ({ segments, totalTime }) => {
  if (totalTime === 0) return null;

  // For very large timelines, we might want to drop some labels
  // But for accurate boundaries, let's keep all boundaries that don't overlap visually
  
  // Collect unique timestamps
  const timestamps = new Set<number>();
  timestamps.add(0);
  segments.forEach(s => {
    timestamps.add(s.startTime);
    timestamps.add(s.endTime);
  });
  
  const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

  return (
    <div className="relative w-full h-8 mt-2 text-xs text-slate-500 font-medium">
      {sortedTimestamps.map((t, idx) => {
        const leftPct = (t / totalTime) * 100;
        
        // Hide timestamps if there are too many to fit (simple collision prevention)
        // A timestamp needs about 20px of width. 
        // 20px out of, say, 800px is ~2.5%
        // If the previous timestamp was too close, hide this one unless it's the very last one
        
        return (
          <div 
            key={`tick-${t}-${idx}`}
            className="absolute top-0 flex flex-col items-center -translate-x-1/2"
            style={{ left: `${leftPct}%` }}
          >
            <div className="h-1.5 w-px bg-slate-300 mb-1"></div>
            <span style={{ 
               transform: t === 0 ? 'translateX(50%)' : t === totalTime ? 'translateX(-50%)' : 'none',
               display: 'inline-block'
            }}>{t}</span>
          </div>
        );
      })}
    </div>
  );
};
