export function getPlaybackPositionPercentage(currentTime: number, totalTime: number): number {
  if (totalTime <= 0) return 100;
  if (currentTime <= 0) return 0;
  if (currentTime >= totalTime) return 100;
  return (currentTime / totalTime) * 100;
}
