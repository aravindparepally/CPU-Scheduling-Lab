import React, { useState, useMemo } from 'react';
import { SimulationResult, GanttSegment } from '../../../domain';
import { buildTimelineMarkers, getSegmentEvents } from './adapter';
import { GanttSegmentBlock } from './GanttSegmentBlock';
import { GanttMarkers } from './GanttMarkers';
import { GanttAxis } from './GanttAxis';
import { GanttDetails } from './GanttDetails';
import { GanttLegend } from './GanttLegend';
import { PlaybackState, getPlaybackPositionPercentage } from '../../../playback';

interface GanttChartProps {
  result: SimulationResult;
  playbackState?: PlaybackState;
}

export const GanttChart: React.FC<GanttChartProps> = ({ result, playbackState }) => {
  const [selectedSegment, setSelectedSegment] = useState<GanttSegment | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const totalTime = result.totalSimulationTime;
  const segments = result.ganttSegments;
  
  // Memoize marker generation since it involves iterating events
  const markers = useMemo(() => buildTimelineMarkers(result), [result]);
  
  // Calculate selected segment related events
  const selectedEvents = useMemo(() => {
    if (!selectedSegment) return [];
    return getSegmentEvents(selectedSegment, result.simulationEvents);
  }, [selectedSegment, result.simulationEvents]);

  if (segments.length === 0) return null;

  const minChartWidth = Math.max(100, zoomLevel * 100);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-800">Execution Timeline</h3>
        
        {/* Zoom Controls */}
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button 
            onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.5))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button 
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Reset Zoom"
          >
            {(zoomLevel * 100).toFixed(0)}%
          </button>
          <div className="w-px bg-slate-300 mx-1"></div>
          <button 
            onClick={() => setZoomLevel(z => Math.min(5, z + 0.5))}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Scrollable Timeline Area */}
      <div className="w-full overflow-x-auto pb-4 pt-14 custom-scrollbar">
        <div 
          className="relative h-20 bg-slate-50 border border-slate-300 rounded flex shadow-inner origin-left"
          style={{ width: `${minChartWidth}%`, minWidth: '100%' }}
        >
          {segments.map((seg, idx) => (
            <GanttSegmentBlock 
              key={`${seg.pid}-${seg.startTime}-${idx}`}
              segment={seg}
              totalTime={totalTime}
              isSelected={selectedSegment === seg}
              onSelect={() => setSelectedSegment(seg === selectedSegment ? null : seg)}
            />
          ))}
          <GanttMarkers markers={markers} totalTime={totalTime} />
          
          {/* Playback Cursor and Future Overlay */}
          {playbackState && totalTime > 0 && (
            <>
              {/* Dim future area */}
              <div 
                className="absolute top-0 bottom-0 right-0 bg-slate-50/60 backdrop-grayscale z-30 pointer-events-none"
                style={{ left: `${getPlaybackPositionPercentage(playbackState.currentTime, totalTime)}%` }}
              ></div>
              
              {/* Cursor Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                style={{ left: `${getPlaybackPositionPercentage(playbackState.currentTime, totalTime)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-red-500 border border-white shadow-sm"></div>
              </div>
            </>
          )}
        </div>
        
        <div style={{ width: `${minChartWidth}%`, minWidth: '100%' }}>
          <GanttAxis segments={segments} totalTime={totalTime} />
        </div>
      </div>

      <GanttLegend />

      <div className="mt-8">
        <GanttDetails segment={selectedSegment} events={selectedEvents} />
      </div>
    </div>
  );
};
