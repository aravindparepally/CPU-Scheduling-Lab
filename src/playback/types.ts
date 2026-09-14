export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
  totalTime: number;
}

export type PlaybackAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'RESET' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'STEP_FORWARD'; payload: number }
  | { type: 'STEP_BACKWARD'; payload: number }
  | { type: 'INIT_RESULT'; payload: number }
  | { type: 'TICK'; payload: number }; // delta time
