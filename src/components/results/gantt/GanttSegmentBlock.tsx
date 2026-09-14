import React from 'react';
import { GanttSegment } from '../../../domain';
import { getProcessColorKey } from '../../../utils/colors';

interface GanttSegmentBlockProps {
  segment: GanttSegment;
  totalTime: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const GanttSegmentBlock: React.FC<GanttSegmentBlockProps> = ({ segment, totalTime, isSelected, onSelect }) => {
  if (totalTime === 0 || segment.duration === 0) return null;

  const widthPct = (segment.duration / totalTime) * 100;
  const colorClass = getProcessColorKey(segment.pid);
  const isIdle = segment.pid === 'CPU_IDLE';

  return (
    <button 
      onClick={onSelect}
      className={`h-full border-r border-slate-300 last:border-r-0 flex flex-col justify-center items-center relative group outline-none transition-all duration-200
        ${colorClass}
        ${isSelected ? 'ring-2 ring-blue-500 ring-inset shadow-inner scale-[1.02] z-10' : 'hover:brightness-95'}
        ${isIdle ? 'diagonal-stripes opacity-70' : ''}
      `}
      style={{ width: `${widthPct}%` }}
      aria-label={`${isIdle ? 'CPU Idle' : `Process ${segment.pid}`} from time ${segment.startTime} to ${segment.endTime}, duration ${segment.duration}`}
    >
      {/* Hide text if segment is too small to render comfortably */}
      {widthPct > 2 && (
        <span className="font-bold text-xs truncate w-full text-center px-1 select-none pointer-events-none">
          {isIdle ? 'IDLE' : segment.pid}
        </span>
      )}
      {widthPct > 5 && !isIdle && (
        <span className="text-[10px] opacity-70 truncate w-full text-center select-none pointer-events-none">
          {segment.duration}u
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-12 bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
        <div className="font-bold">{isIdle ? 'CPU Idle' : `Process: ${segment.pid}`}</div>
        <div className="text-slate-300">
          {segment.startTime} → {segment.endTime} (dur: {segment.duration})
        </div>
        {/* Triangle arrow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </button>
  );
};
