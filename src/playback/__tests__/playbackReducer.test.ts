import { describe, it, expect } from 'vitest';
import { playbackReducer, initialPlaybackState } from '../playbackReducer';

describe('playbackReducer', () => {
  it('PLAY sets isPlaying to true', () => {
    const state = playbackReducer(initialPlaybackState, { type: 'PLAY' });
    expect(state.isPlaying).toBe(true);
  });

  it('PLAY resets to 0 if at the end', () => {
    const initialState = { ...initialPlaybackState, currentTime: 10, totalTime: 10 };
    const state = playbackReducer(initialState, { type: 'PLAY' });
    expect(state.isPlaying).toBe(true);
    expect(state.currentTime).toBe(0);
  });

  it('PAUSE sets isPlaying to false', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true };
    const state = playbackReducer(initialState, { type: 'PAUSE' });
    expect(state.isPlaying).toBe(false);
  });

  it('RESET sets currentTime to 0 and pauses', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true, currentTime: 5, totalTime: 10 };
    const state = playbackReducer(initialState, { type: 'RESET' });
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
  });

  it('SET_TIME clamps and pauses', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true, totalTime: 10 };
    
    let state = playbackReducer(initialState, { type: 'SET_TIME', payload: 5 });
    expect(state.currentTime).toBe(5);
    expect(state.isPlaying).toBe(false);

    state = playbackReducer(initialState, { type: 'SET_TIME', payload: 15 });
    expect(state.currentTime).toBe(10);
    expect(state.isPlaying).toBe(false);
    
    state = playbackReducer(initialState, { type: 'SET_TIME', payload: -5 });
    expect(state.currentTime).toBe(0);
  });

  it('SET_SPEED updates speed', () => {
    const state = playbackReducer(initialPlaybackState, { type: 'SET_SPEED', payload: 4 });
    expect(state.speed).toBe(4);
  });

  it('STEP_FORWARD increments and pauses', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true, currentTime: 5, totalTime: 10 };
    const state = playbackReducer(initialState, { type: 'STEP_FORWARD', payload: 2 });
    expect(state.currentTime).toBe(7);
    expect(state.isPlaying).toBe(false);
  });

  it('STEP_BACKWARD decrements and pauses', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true, currentTime: 5, totalTime: 10 };
    const state = playbackReducer(initialState, { type: 'STEP_BACKWARD', payload: 2 });
    expect(state.currentTime).toBe(3);
    expect(state.isPlaying).toBe(false);
  });

  it('INIT_RESULT initializes state', () => {
    const state = playbackReducer(initialPlaybackState, { type: 'INIT_RESULT', payload: 20 });
    expect(state.totalTime).toBe(20);
    expect(state.currentTime).toBe(0);
    expect(state.isPlaying).toBe(false);
  });

  it('TICK advances time up to totalTime and stops', () => {
    const initialState = { ...initialPlaybackState, isPlaying: true, currentTime: 5, speed: 2, totalTime: 10 };
    
    let state = playbackReducer(initialState, { type: 'TICK', payload: 1 });
    // payload 1 * speed 2 = delta 2
    expect(state.currentTime).toBe(7);
    expect(state.isPlaying).toBe(true);

    state = playbackReducer(state, { type: 'TICK', payload: 2 });
    // delta 4 => 11, capped to 10
    expect(state.currentTime).toBe(10);
    expect(state.isPlaying).toBe(false);
  });
});
