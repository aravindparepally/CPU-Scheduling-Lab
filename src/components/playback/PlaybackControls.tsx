import React from 'react';
import { PlaybackState } from '../../playback';

interface PlaybackControlsProps {
  state: PlaybackState;
  togglePlay: () => void;
  reset: () => void;
  stepForward: (amount?: number) => void;
  stepBackward: (amount?: number) => void;
  setSpeed: (speed: number) => void;
  setTime: (time: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  state,
  togglePlay,
  reset,
  stepForward,
  stepBackward,
  setSpeed,
  setTime,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 flex flex-col gap-4">
      {/* Top row: Buttons and Speed Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
            title="Reset"
            aria-label="Reset playback"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>
          
          <button
            onClick={() => stepBackward(1)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
            title="Step Backward"
            aria-label="Step Backward"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-md text-white transition-transform active:scale-95 focus:ring-4 focus:ring-blue-200 outline-none
              ${state.isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}
            `}
            title={state.isPlaying ? 'Pause' : 'Play'}
            aria-label={state.isPlaying ? 'Pause playback' : 'Start playback'}
          >
            {state.isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 pl-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => stepForward(1)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
            title="Step Forward"
            aria-label="Step Forward"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">Speed:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-xs font-semibold rounded outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${state.speed === s ? 'bg-blue-500 text-white shadow-sm border border-transparent' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}
                `}
                aria-label={`Set speed to ${s}x`}
                aria-pressed={state.speed === s}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Scrubber */}
      <div className="flex flex-col relative mt-2 mb-2 w-full">
        <div className="relative w-full flex items-center h-4">
          <input 
            type="range" 
            min="0" 
            max={state.totalTime || 1} 
            step="0.1"
            value={state.currentTime}
            onChange={(e) => setTime(parseFloat(e.target.value))}
            className="absolute w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 m-0 p-0"
            style={{ width: 'calc(100% + 16px)', left: '-8px' }}
            aria-label="Playback timeline scrubber"
            disabled={state.totalTime === 0}
          />
        </div>
        
        {/* Labels exactly aligned with the ends */}
        <div className="flex justify-between w-full mt-2 text-xs font-medium text-slate-600 relative h-4">
          <span className="absolute left-0" style={{ transform: 'translateX(0)' }}>0</span>
          <span className="absolute left-1/2 transform -translate-x-1/2 text-slate-500">
            {state.currentTime.toFixed(1)} / {state.totalTime.toFixed(1)}
          </span>
          <span className="absolute right-0" style={{ transform: 'translateX(0)' }}>{state.totalTime}</span>
        </div>
      </div>
    </div>
  );
};
