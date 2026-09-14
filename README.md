# CPU Scheduling Laboratory

A professional, interactive, and educational web application for simulating and visualizing CPU Scheduling Algorithms.

## Overview

The CPU Scheduling Laboratory is a production-ready educational tool designed to help computer science students, educators, and developers understand operating system scheduling dynamics. It allows users to create process configurations, run them against industry-standard scheduling algorithms, and visually inspect the timeline, CPU states, ready queues, and advanced analytical metrics down to the millisecond.

The application strictly separates mathematical scheduling logic (the "engine") from the visual presentation, guaranteeing deterministic and accurate results.

## Features

- **10 Supported Scheduling Algorithms**:
  - First Come First Serve (FCFS)
  - Shortest Job First (SJF)
  - Shortest Remaining Time First (SRTF)
  - Round Robin (RR)
  - Longest Job First (LJF)
  - Longest Remaining Time First (LRTF)
  - Highest Response Ratio Next (HRRN)
  - Priority Scheduling (Preemptive & Non-preemptive)
  - Multilevel Queue (MLQ)
  - Multilevel Feedback Queue (MLFQ)
- **Interactive Gantt Chart**: Deep-dive timeline visualization of execution, preemption, and idle states.
- **Time-Travel Playback**: Play, pause, scrub, and step through the simulation timeline.
- **Real-Time Queue Inspector**: Watch processes move through MLFQ queues, promote/demote, and fight for CPU time.
- **Advanced Educational Analytics**: Comprehensive breakdowns of Waiting Time, Turnaround Time, Context Switches, CPU utilization, and algorithm behavioral characteristics.

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite 8
- **Testing**: Vitest & React Testing Library (135+ tests)
- **Architecture**: Domain-Driven Design (Engine -> Result -> Playback -> Visualization)

## Project Architecture

The architecture rigorously separates simulation math from React visualization.

```text
src/
├── domain/       # Core types (Process, Events, GanttSegment)
├── simulation/   # Pure mathematical scheduling engine
├── playback/     # Temporal state management over SimulationResult
├── analytics/    # Derived metric analysis and algorithm insights
├── components/   # React visual layer (Gantt, Dashboards, Tables)
└── state/        # React Context & Hooks (useSimulation, usePlayback)
```

### Data Flow
`User Input` → `Simulation Engine (runSimulation)` → `Immutable SimulationResult` → `Playback/Analytics` → `React UI`

## Installation & Local Development

Requires Node.js 18+ installed.

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd cpu-scheduling-lab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

## Testing

The project contains a comprehensive test suite (135+ tests) verifying deterministic algorithm behavior, queue transitions, preemption boundaries, and UI integration.

To run the test suite:
```bash
npm run test
```

## Building for Production

To build an optimized, static version of the application:
```bash
npm run build
```
This will compile the TypeScript, bundle the React application, and output the static files into the `dist/` directory.

You can preview the built site locally using:
```bash
npm run preview
```

## Deployment

This application is a 100% client-side Single Page Application (SPA) with no backend requirements. It can be hosted on any static hosting provider.

### Vercel / Netlify / Cloudflare Pages
1. Connect your GitHub repository.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Deploy!

### GitHub Pages
1. Build the app locally or via Actions (`npm run build`).
2. Serve the `dist/` folder via GitHub Pages.

## Safety & Accuracy

This simulator was built with strict safety constraints:
- Scheduling algorithms do not rely on browser timers (`setTimeout`); they execute synchronously yielding a deterministic `SimulationResult`.
- The playback animation does not re-simulate logic, ensuring 100% mathematical consistency when scrubbing through the timeline.
- Metric formatting does not alter the underlying data.
