import { AppShell } from './components/layout/AppShell';
import { AlgorithmSelector } from './components/algorithm/AlgorithmSelector';

import { ConfigurationPanel } from './components/configuration/ConfigurationPanel';
import { ProcessEditor } from './components/process/ProcessEditor';
import { SimulationSummary } from './components/results/SimulationSummary';
import { GanttChart } from './components/results/gantt/GanttChart';
import { PlaybackControls } from './components/playback/PlaybackControls';
import { CPUStateView } from './components/playback/CPUStateView';
import { ReadyQueueView } from './components/playback/ReadyQueueView';
import { SchedulingDecisionView } from './components/playback/SchedulingDecisionView';
import { EventTimelineView } from './components/playback/EventTimelineView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { usePlayback } from './state/usePlayback';
import { useSimulation } from './state/useSimulation';
import { getAlgorithmCapabilities } from './simulation';

function App() {
  const {
    processes,
    algorithm,
    config,
    result,
    isStale,
    error,
    updateAlgorithm,
    updateConfig,
    updateProcesses,
    run
  } = useSimulation();

  const playback = usePlayback(result);
  
  const capabilities = getAlgorithmCapabilities(algorithm);

  return (
    <AppShell>
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Configuration */}
        <div className="w-full lg:w-[45%] flex flex-col">

          
          <AlgorithmSelector 
            algorithm={algorithm} 
            onAlgorithmChange={updateAlgorithm} 
          />
          
          <ConfigurationPanel 
            algorithm={algorithm} 
            config={config} 
            onConfigChange={updateConfig} 
          />
          
          <ProcessEditor 
            processes={processes} 
            onChange={updateProcesses} 
            capabilities={capabilities}
            playbackState={{ currentTime: playback.state.currentTime, result }}
            ioEnabled={config.ioEnabled}
          />

          <div className="mt-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <strong className="font-bold">Simulation Error:</strong> {error}
              </div>
            )}
            
            <button 
              onClick={run}
              disabled={processes.length === 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2
                ${processes.length === 0 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : isStale 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-lg' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isStale ? 'RUN SIMULATION' : 'SIMULATION UP TO DATE (RUN AGAIN)'}
            </button>
            {isStale && result && (
              <p className="text-center text-xs text-amber-600 font-medium mt-3 bg-amber-50 py-1.5 rounded-md border border-amber-100">
                ⚠️ Inputs changed. Previous results are now stale.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="w-full lg:w-[55%] flex flex-col">
          {!result ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-8 text-center">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No Simulation Results</h3>
              <p className="text-sm max-w-md mx-auto">
                Configure your processes on the left and click <strong className="text-slate-500">Run Simulation</strong> to generate timelines and metrics.
              </p>
            </div>
          ) : (
            <div className={`transition-opacity duration-300 ${isStale ? 'opacity-50 grayscale-[30%]' : 'opacity-100'}`}>
              <SimulationSummary result={result} algorithm={algorithm} />
              
              <PlaybackControls 
                state={playback.state} 
                togglePlay={playback.togglePlay}
                reset={playback.reset}
                stepForward={playback.stepForward}
                stepBackward={playback.stepBackward}
                setSpeed={playback.setSpeed}
                setTime={playback.setTime}
              />
              
              <GanttChart result={result} playbackState={playback.state} />
              
              <AnalyticsDashboard result={result} algorithm={algorithm} />

              <div className="flex flex-col lg:flex-row gap-6 mb-8 mt-6">
                <div className="flex-1 flex flex-col gap-6">
                  <CPUStateView result={result} currentTime={playback.state.currentTime} />
                  <ReadyQueueView result={result} currentTime={playback.state.currentTime} />
                  <SchedulingDecisionView result={result} currentTime={playback.state.currentTime} />
                </div>
                <div className="flex-1">
                  <EventTimelineView 
                    result={result} 
                    currentTime={playback.state.currentTime} 
                    onEventClick={playback.setTime}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </AppShell>
  );
}

export default App;
