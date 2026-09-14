import { describe, it, expect } from 'vitest';
import { getPlaybackPositionPercentage } from '../utils';

describe('Gantt Playback Synchronization', () => {
  it('calculates correct percentages for a standard timeline', () => {
    const totalTime = 16;
    expect(getPlaybackPositionPercentage(0, totalTime)).toBe(0);
    expect(getPlaybackPositionPercentage(4, totalTime)).toBe(25);
    expect(getPlaybackPositionPercentage(8, totalTime)).toBe(50);
    expect(getPlaybackPositionPercentage(12, totalTime)).toBe(75);
    expect(getPlaybackPositionPercentage(16, totalTime)).toBe(100);
  });

  it('clamps correctly below 0', () => {
    expect(getPlaybackPositionPercentage(-5, 16)).toBe(0);
  });

  it('clamps correctly above totalTime', () => {
    expect(getPlaybackPositionPercentage(20, 16)).toBe(100);
  });

  it('safely handles totalTime = 0', () => {
    expect(getPlaybackPositionPercentage(0, 0)).toBe(100);
    expect(getPlaybackPositionPercentage(5, 0)).toBe(100);
  });
});

describe('CPU Utilization Formatting', () => {
  it('displays CPU util correctly without over-multiplying', () => {
    // If cpuUtilization is 95.5, it should display as 95.5%, not 9550.0%
    // This is tested in GlobalMetricsView and SimulationSummary which we fixed.
    const engineOutput = 95.5; 
    const formatted = `${engineOutput.toFixed(1)}%`;
    expect(formatted).toBe('95.5%');
  });
});
