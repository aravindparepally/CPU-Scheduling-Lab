import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GanttChart } from '../GanttChart';
import { SimulationResult, SimulationEventType } from '../../../../domain';

describe('GanttChart Component', () => {
  const mockResult: SimulationResult = {
    ganttSegments: [
      { pid: 'CPU_IDLE', startTime: 0, endTime: 2, duration: 2 },
      { pid: 'P1', startTime: 2, endTime: 10, duration: 8 },
      { pid: 'P2', startTime: 10, endTime: 12, duration: 2 },
    ],
    simulationEvents: [
      { timestamp: 10, type: SimulationEventType.PREEMPTION, pid: 'P1', reason: 'Higher priority arrived' }
    ],
    totalSimulationTime: 12,
    finalProcesses: [],
    schedulingDecisions: [],
    cpuUtilization: 0,
    throughput: 0,
    contextSwitchCount: 0,
    averageWaitingTime: 0,
    averageTurnaroundTime: 0,
    averageResponseTime: 0
  };

  it('renders segments correctly', () => {
    render(<GanttChart result={mockResult} />);
    
    // Check IDLE
    expect(screen.getByText('IDLE')).toBeInTheDocument();
    
    // Check processes
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('P2')).toBeInTheDocument();
  });

  it('calculates proportional width correctly', () => {
    render(<GanttChart result={mockResult} />);
    
    // P1 duration 8, total 12 => width 66.666...%
    const p1Button = screen.getByLabelText(/Process P1/i);
    expect(p1Button.style.width).toBe('66.66666666666666%');
    
    // CPU IDLE duration 2, total 12 => width 16.666...%
    const idleButton = screen.getByLabelText(/CPU Idle/i);
    expect(idleButton.style.width).toBe('16.666666666666664%');
  });

  it('handles segment selection and displays details', () => {
    render(<GanttChart result={mockResult} />);
    
    // Initially prompts to select
    expect(screen.getByText(/Select an execution segment/i)).toBeInTheDocument();
    
    // Click P1
    fireEvent.click(screen.getByLabelText(/Process P1/i));
    
    // Shows details
    expect(screen.getByText('Execution Segment: P1')).toBeInTheDocument();
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // start
    expect(screen.getAllByText('10').length).toBeGreaterThan(0); // end
    expect(screen.getAllByText('8').length).toBeGreaterThan(0); // duration
    
    // Shows related events
    expect(screen.getAllByText('PREEMPTION').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Higher priority arrived').length).toBeGreaterThan(0);
  });

  it('handles zoom controls without mutating original data', () => {
    // We clone mockResult to ensure it's not mutated internally
    const originalResultStr = JSON.stringify(mockResult);
    
    render(<GanttChart result={mockResult} />);
    
    const zoomIn = screen.getByTitle('Zoom In');
    fireEvent.click(zoomIn);
    
    // Scale is applied to parent container, not modifying raw data
    expect(screen.getByText('150%')).toBeInTheDocument();
    
    // Check that original result wasn't mutated
    expect(JSON.stringify(mockResult)).toBe(originalResultStr);
  });
});
