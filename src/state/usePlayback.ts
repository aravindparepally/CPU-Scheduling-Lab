import { useReducer, useEffect, useRef, useCallback } from 'react';
import { SimulationResult } from '../domain';
import { playbackReducer, initialPlaybackState } from '../playback/playbackReducer';
import { PlaybackState } from '../playback/types';

export function usePlayback(result: SimulationResult | null) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  
  // Keep refs for the animation loop to access latest state without dependency cycles
  const stateRef = useRef<PlaybackState>(state);
  const resultRef = useRef<SimulationResult | null>(result);
  const lastWallClockRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  // When result changes, reset playback automatically
  useEffect(() => {
    if (result) {
      dispatch({ type: 'INIT_RESULT', payload: result.totalSimulationTime });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [result]);

  const tick = useCallback((timestamp: number) => {
    if (!lastWallClockRef.current) {
      lastWallClockRef.current = timestamp;
    }

    const currentState = stateRef.current;
    const currentResult = resultRef.current;
    
    if (currentState.isPlaying && currentResult) {
      const elapsedMs = timestamp - lastWallClockRef.current;
      
      // Calculate delta simulation time based on real elapsed time and speed.
      // E.g., if real elapsed is 16ms (0.016s), and we want 1 simulation unit per second at 1x speed:
      // deltaSim = 0.016 * speed
      // Adjust multiplier if simulation feels too slow. Let's map 1 simulation unit = 1 second.
      const deltaSim = (elapsedMs / 1000) * currentState.speed;

      dispatch({ type: 'TICK', payload: deltaSim });
    }

    lastWallClockRef.current = timestamp;
    
    // Continue loop if still playing (dispatch will flip isPlaying to false if end is reached, 
    // but we can just let it run and it will no-op if isPlaying is false next frame)
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [tick]);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      dispatch({ type: 'PAUSE' });
    } else {
      dispatch({ type: 'PLAY' });
    }
  }, [state.isPlaying]);

  const setSpeed = useCallback((speed: number) => {
    dispatch({ type: 'SET_SPEED', payload: speed });
  }, []);

  const setTime = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME', payload: time });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const stepForward = useCallback((amount: number = 1) => {
    dispatch({ type: 'STEP_FORWARD', payload: amount });
  }, []);

  const stepBackward = useCallback((amount: number = 1) => {
    dispatch({ type: 'STEP_BACKWARD', payload: amount });
  }, []);

  return {
    state,
    togglePlay,
    setSpeed,
    setTime,
    reset,
    stepForward,
    stepBackward
  };
}
