import { describe, it, expect } from 'vitest';
import { validateProcess, validateUniquePids } from '../validation';
import { createProcess } from '../process';

describe('Domain Validation', () => {
  it('validates a correct process', () => {
    const process = createProcess('P1', 0, 5);
    const errors = validateProcess(process);
    expect(errors.length).toBe(0);
  });

  it('rejects negative arrival time', () => {
    const process = createProcess('P1', -1, 5);
    const errors = validateProcess(process);
    expect(errors.length).toBe(1);
    expect(errors[0].field).toBe('arrivalTime');
  });

  it('rejects zero or negative burst time', () => {
    const p1 = createProcess('P1', 0, 0);
    const p2 = createProcess('P2', 0, -5);
    
    expect(validateProcess(p1).length).toBe(1);
    expect(validateProcess(p2).length).toBe(1);
    expect(validateProcess(p1)[0].field).toBe('burstTime');
  });

  it('validates unique PIDs', () => {
    const p1 = createProcess('P1', 0, 5);
    const p2 = createProcess('P2', 1, 5);
    const p3 = createProcess('P1', 2, 5);

    expect(validateUniquePids([p1, p2])).toBe(true);
    expect(validateUniquePids([p1, p2, p3])).toBe(false);
  });
});
