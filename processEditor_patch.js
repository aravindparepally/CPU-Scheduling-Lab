const fs = require('fs');
let code = fs.readFileSync('src/components/process/ProcessEditor.tsx', 'utf8');

const handleArrayUpdateCode = \
  const handleArrayUpdate = (index: number, arrayField: 'cpuBursts' | 'ioBursts', arrayIndex: number, value: string) => {
    const newProcesses = [...processes];
    const val = parseInt(value, 10) || 0;
    const p = { ...newProcesses[index] };
    
    if (!p.cpuBursts) p.cpuBursts = [p.burstTime || 1, 0];
    if (!p.ioBursts) p.ioBursts = [p.ioBurstTime || 0];

    const targetArray = [...p[arrayField]];
    
    if (arrayField === 'cpuBursts' && arrayIndex === 0) {
      targetArray[arrayIndex] = Math.max(1, val);
    } else {
      targetArray[arrayIndex] = Math.max(0, val);
    }
    
    p[arrayField] = targetArray;
    p.burstTime = (p.cpuBursts || []).reduce((a, b) => a + b, 0) || 1;

    newProcesses[index] = p;
    onChange(newProcesses);
  };
\;
code = code.replace(/const handleAdd = \(\) => \{/, handleArrayUpdateCode + '\n  const handleAdd = () => {');

const oldHeaders = \<th className="px-3 py-2">Burst</th>
              {ioEnabled && (
                <>
                  <th className="px-3 py-2" title="Time in CPU burst when I/O starts">I/O Start</th>
                  <th className="px-3 py-2" title="Duration of I/O burst">I/O Burst</th>
                </>
              )}\;
const newHeaders = \{!ioEnabled ? (
                <th className="px-3 py-2">Burst</th>
              ) : (
                <>
                  <th className="px-3 py-2" title="First CPU burst">CPU Burst</th>
                  <th className="px-3 py-2" title="I/O burst duration">I/O Burst</th>
                  <th className="px-3 py-2" title="Second CPU burst">CPU Burst</th>
                </>
              )}\;
code = code.replace(oldHeaders, newHeaders);

const oldCells = \<td className="px-3 py-2">
                    <input type="number" min="1" value={p.burstTime} onChange={e => handleUpdate(idx, 'burstTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                  </td>
                  {ioEnabled && (
                    <>
                      <td className="px-3 py-2">
                        <input type="number" min="0" max={p.burstTime} value={p.ioStartTime ?? 0} onChange={e => handleUpdate(idx, 'ioStartTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={p.ioBurstTime ?? 0} onChange={e => handleUpdate(idx, 'ioBurstTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                    </>
                  )}\;
const newCells = \{!ioEnabled ? (
                    <td className="px-3 py-2">
                      <input type="number" min="1" value={p.burstTime} onChange={e => handleUpdate(idx, 'burstTime', e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={p.cpuBursts?.[0] ?? p.burstTime} onChange={e => handleArrayUpdate(idx, 'cpuBursts', 0, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={p.ioBursts?.[0] ?? p.ioBurstTime ?? 0} onChange={e => handleArrayUpdate(idx, 'ioBursts', 0, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" value={p.cpuBursts?.[1] ?? 0} onChange={e => handleArrayUpdate(idx, 'cpuBursts', 1, e.target.value)} className="w-20 p-1 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" />
                      </td>
                    </>
                  )}\;
code = code.replace(oldCells, newCells);

fs.writeFileSync('src/components/process/ProcessEditor.tsx', code);
