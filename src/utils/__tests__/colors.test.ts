import { describe, it, expect } from 'vitest';
import { getProcessColorKey } from '../colors';

describe('Color System', () => {
  it('returns a distinct CPU idle color', () => {
    const color = getProcessColorKey('CPU_IDLE');
    expect(color).toContain('bg-slate-100');
  });

  it('returns deterministic colors for the same PID', () => {
    const color1 = getProcessColorKey('P1');
    const color2 = getProcessColorKey('P1');
    expect(color1).toBe(color2);
  });

  it('distributes colors among different PIDs', () => {
    const c1 = getProcessColorKey('P1');
    const c2 = getProcessColorKey('P2');
    const c3 = getProcessColorKey('P3');
    const c4 = getProcessColorKey('P4');
    
    // While hash collisions are possible, these specific PIDs should map to distinct colors
    const uniqueColors = new Set([c1, c2, c3, c4]);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });
});
