export const getProcessColorKey = (pid: string): string => {
  if (pid === 'CPU_IDLE') return 'bg-slate-100 border-slate-300 text-slate-500';
  
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = pid.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-100 border-blue-300 text-blue-800',
    'bg-emerald-100 border-emerald-300 text-emerald-800',
    'bg-purple-100 border-purple-300 text-purple-800',
    'bg-amber-100 border-amber-300 text-amber-800',
    'bg-rose-100 border-rose-300 text-rose-800',
    'bg-cyan-100 border-cyan-300 text-cyan-800',
    'bg-indigo-100 border-indigo-300 text-indigo-800',
    'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800',
    'bg-lime-100 border-lime-300 text-lime-800',
    'bg-orange-100 border-orange-300 text-orange-800',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};
