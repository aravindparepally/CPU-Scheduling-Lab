import { PlaybackState, PlaybackAction } from './types';

export const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  speed: 1,
  totalTime: 0,
};

export const playbackReducer = (state: PlaybackState, action: PlaybackAction): PlaybackState => {
  switch (action.type) {
    case 'PLAY':
      if (state.currentTime >= state.totalTime) {
        // If at the end, play from beginning
        return { ...state, isPlaying: true, currentTime: 0 };
      }
      return { ...state, isPlaying: true };
      
    case 'PAUSE':
      return { ...state, isPlaying: false };
      
    case 'RESET':
      return { ...state, isPlaying: false, currentTime: 0 };
      
    case 'SET_TIME': {
      const clampedTime = Math.max(0, Math.min(action.payload, state.totalTime));
      return { ...state, currentTime: clampedTime, isPlaying: false }; // Scrubbing pauses playback
    }
      
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
      
    case 'STEP_FORWARD': {
      const newTime = Math.min(state.currentTime + action.payload, state.totalTime);
      return { ...state, currentTime: newTime, isPlaying: false };
    }
      
    case 'STEP_BACKWARD': {
      const newTime = Math.max(state.currentTime - action.payload, 0);
      return { ...state, currentTime: newTime, isPlaying: false };
    }
      
    case 'INIT_RESULT':
      return { ...state, isPlaying: false, currentTime: 0, totalTime: action.payload };
      
    case 'TICK': {
      if (!state.isPlaying) return state;
      const newTime = Math.min(state.currentTime + action.payload * state.speed, state.totalTime);
      if (newTime >= state.totalTime) {
        return { ...state, currentTime: state.totalTime, isPlaying: false };
      }
      return { ...state, currentTime: newTime };
    }
      
    default:
      return state;
  }
};
