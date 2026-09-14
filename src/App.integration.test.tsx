import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Integration', () => {
  it('1. Initial page loads and default example appears', () => {
    render(<App />);
    expect(screen.getByText('CPU Scheduling Lab')).toBeInTheDocument();
    // Default preset is FCFS typically
    expect(screen.getByText(/Scheduling Algorithm/)).toBeInTheDocument();
    expect(screen.getByText('No Simulation Results')).toBeInTheDocument();
  });

  it('2. Selecting an algorithm updates the configuration panel', () => {
    render(<App />);
    const select = screen.getAllByRole('combobox')[0]; // Algorithm selector
    fireEvent.change(select, { target: { value: 'MLFQ' } });
    
    // Check if configuration panel shows MLFQ settings
    expect(screen.getByText(/Queue Quantums/i)).toBeInTheDocument();
  });

  it('3. Run Simulation displays real results and Gantt preview', () => {
    render(<App />);
    // Add a process so it can run
    const addBtn = screen.getByRole('button', { name: /Add Process/i });
    fireEvent.click(addBtn);

    const runBtn = screen.getByRole('button', { name: /RUN SIMULATION/i });
    fireEvent.click(runBtn);
    
    // Results should appear
    expect(screen.getByText('Simulation Results')).toBeInTheDocument();
    expect(screen.getByText('Execution Timeline')).toBeInTheDocument();
    expect(screen.getByText('Process Performance')).toBeInTheDocument();
  });

  it('4. Updates results when changing algorithm and resets playback', () => {
    render(<App />);
    const addBtn = screen.getByRole('button', { name: /Add Process/i });
    fireEvent.click(addBtn);
    
    const runBtn = screen.getByRole('button', { name: /RUN SIMULATION/i });
    fireEvent.click(runBtn);
    
    // Playback should be at 0 initially
    expect(screen.getByText(/0\.0 \//)).toBeInTheDocument();
    
    const algoSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(algoSelect, { target: { value: 'SJF' } });
    
    // Run again
    fireEvent.click(screen.getByRole('button', { name: /RUN SIMULATION/i }));
    expect(screen.getAllByText(/0\.0 \//).length).toBeGreaterThan(0);
  });

  it('5. Editing process input marks result stale', () => {
    render(<App />);
    const addBtn = screen.getByRole('button', { name: /Add Process/i });
    fireEvent.click(addBtn);

    const runBtn = screen.getByRole('button', { name: /RUN SIMULATION/i });
    fireEvent.click(runBtn);
    
    expect(screen.getByText('SIMULATION UP TO DATE (RUN AGAIN)')).toBeInTheDocument();
    
    // Change algorithm to SJF
    const algSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(algSelect, { target: { value: 'SJF' } });
    
    expect(screen.getByText('RUN SIMULATION')).toBeInTheDocument();
    expect(screen.getByText(/Inputs changed/i)).toBeInTheDocument();
  });
});
