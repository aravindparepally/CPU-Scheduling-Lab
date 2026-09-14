import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the application shell with title', () => {
    render(<App />);
    const titleElement = screen.getByRole('heading', { level: 1, name: /CPU Scheduling Lab/i });
    expect(titleElement).toBeInTheDocument();
  });
});
