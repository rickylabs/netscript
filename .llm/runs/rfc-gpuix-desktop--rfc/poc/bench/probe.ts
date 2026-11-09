/**
 * Cross-platform process-tree probe: resident memory and cumulative CPU time
 * for a root pid and all its descendants, measured from outside the process
 * so a single-process host (GPUIX) and a multi-process host (webview, CEF) are
 * measured the same way.
 *
 * Linux: /proc (RSS + PSS). macOS: `ps`. Windows: `Get-CimInstance Win32_Process`
 * (working set + kernel/user time).
 */
export interface TreeSample {
  /** Resident set (Windows: working set), summed over the tree, MiB. */
  readonly rssMb: number;
  /** Proportional set size, Linux only (shared pages split fairly), MiB. */
  readonly pssMb: number | null;
  /** Cumulative CPU seconds (user + kernel) over the tree. */
  readonly cpuSeconds: number;
  readonly processes: ReadonlyArray<{ pid: number; ppid: number; name: string; rssMb: number; pssMb: number | null; cpuSeconds: number }>;
}

export interface TreePart {
  readonly rssMb: number;
  readonly pssMb: number | null;
  readonly cpuSeconds: number;
  readonly count: number;
}

/**
 * Split a tree sample into the desktop host (UI, BFF, renderer helpers) and
 * the supervised NetScript graph (each stack pid and its descendants).
 */
export function splitTree(sample: TreeSample, stackRoots: readonly number[]): { host: TreePart; stack: TreePart } {
  const children = new Map<number, number[]>();
  for (const process of sample.processes) {
    const list = children.get(process.ppid) ?? [];
    list.push(process.pid);
    children.set(process.ppid, list);
  }
  const stack = new Set<number>();
  const walk = (pid: number) => {
    if (stack.has(pid)) return;
    stack.add(pid);
    for (const child of children.get(pid) ?? []) walk(child);
  };
  for (const root of stackRoots) walk(root);
  const part = (inStack: boolean): TreePart => {
    const members = sample.processes.filter((process) => stack.has(process.pid) === inStack);
    return {
      rssMb: members.reduce((sum, process) => sum + process.rssMb, 0),
      pssMb: members.every((process) => process.pssMb !== null) ? members.reduce((sum, process) => sum + (process.pssMb ?? 0), 0) : null,
      cpuSeconds: members.reduce((sum, process) => sum + process.cpuSeconds, 0),
      count: members.length,
    };
  };
  return { host: part(false), stack: part(true) };
}

interface Row {
  pid: number;
  ppid: number;
  name: string;
  rssKb: number;
  pssKb: number | null;
  cpuSeconds: number;
}

async function rowsLinux(): Promise<Row[]> {
  const rows: Row[] = [];
  for await (const entry of Deno.readDir('/proc')) {
    if (!/^\d+$/.test(entry.name)) continue;
    try {
      const stat = await Deno.readTextFile(`/proc/${entry.name}/stat`);
      const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      const name = stat.slice(stat.indexOf('(') + 1, stat.lastIndexOf(')'));
      let rssKb = 0;
      let pssKb: number | null = null;
      try {
        const rollup = await Deno.readTextFile(`/proc/${entry.name}/smaps_rollup`);
        rssKb = Number(/^Rss:\s+(\d+)/m.exec(rollup)?.[1] ?? 0);
        pssKb = Number(/^Pss:\s+(\d+)/m.exec(rollup)?.[1] ?? 0);
      } catch {
        rssKb = Number(fields[21]) * 4;
      }
      rows.push({ pid: Number(entry.name), ppid: Number(fields[1]), name, rssKb, pssKb, cpuSeconds: (Number(fields[11]) + Number(fields[12])) / 100 });
    } catch { /* exited */ }
  }
  return rows;
}

function parseCpuTime(value: string): number {
  // ps TIME: [[dd-]hh:]mm:ss(.cc)
  const [days, rest] = value.includes('-') ? value.split('-') : ['0', value];
  const parts = rest.split(':').map(Number);
  while (parts.length < 3) parts.unshift(0);
  return Number(days) * 86_400 + parts[0] * 3600 + parts[1] * 60 + parts[2];
}

async function rowsMac(): Promise<Row[]> {
  const out = await new Deno.Command('ps', { args: ['-A', '-o', 'pid=,ppid=,rss=,time=,comm='], stdout: 'piped', stderr: 'null' }).output();
  return new TextDecoder().decode(out.stdout).split('\n').filter(Boolean).map((line) => {
    const [pid, ppid, rss, time, ...name] = line.trim().split(/\s+/);
    return { pid: Number(pid), ppid: Number(ppid), rssKb: Number(rss), pssKb: null, cpuSeconds: parseCpuTime(time), name: name.join(' ').split('/').pop() ?? '?' };
  });
}

async function rowsWindows(): Promise<Row[]> {
  const script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,WorkingSetSize,KernelModeTime,UserModeTime | ConvertTo-Json -Compress';
  const out = await new Deno.Command('powershell.exe', { args: ['-NoProfile', '-NonInteractive', '-Command', script], stdout: 'piped', stderr: 'null' }).output();
  const parsed = JSON.parse(new TextDecoder().decode(out.stdout)) as Array<Record<string, number | string>>;
  return parsed.map((row) => ({
    pid: Number(row.ProcessId),
    ppid: Number(row.ParentProcessId),
    name: String(row.Name),
    rssKb: Number(row.WorkingSetSize) / 1024,
    pssKb: null,
    // 100-ns units
    cpuSeconds: (Number(row.KernelModeTime) + Number(row.UserModeTime)) / 10_000_000,
  }));
}

export async function sampleTree(root: number): Promise<TreeSample> {
  const rows = Deno.build.os === 'linux' ? await rowsLinux() : Deno.build.os === 'darwin' ? await rowsMac() : await rowsWindows();
  const byParent = new Map<number, Row[]>();
  const byPid = new Map<number, Row>();
  for (const row of rows) {
    byPid.set(row.pid, row);
    const list = byParent.get(row.ppid) ?? [];
    list.push(row);
    byParent.set(row.ppid, list);
  }
  const members: Row[] = [];
  const seen = new Set<number>();
  const walk = (pid: number) => {
    if (seen.has(pid)) return;
    seen.add(pid);
    const row = byPid.get(pid);
    if (row) members.push(row);
    for (const child of byParent.get(pid) ?? []) walk(child.pid);
  };
  walk(root);
  const pss = members.every((row) => row.pssKb !== null) ? members.reduce((sum, row) => sum + (row.pssKb ?? 0), 0) / 1024 : null;
  return {
    rssMb: members.reduce((sum, row) => sum + row.rssKb, 0) / 1024,
    pssMb: pss,
    cpuSeconds: members.reduce((sum, row) => sum + row.cpuSeconds, 0),
    processes: members.map((row) => ({
      pid: row.pid,
      ppid: row.ppid,
      name: row.name,
      rssMb: Math.round(row.rssKb / 1024),
      pssMb: row.pssKb === null ? null : Math.round(row.pssKb / 1024),
      cpuSeconds: row.cpuSeconds,
    })),
  };
}

/** Terminate a process tree (children first). */
export async function killTree(root: number): Promise<void> {
  if (Deno.build.os === 'windows') {
    await new Deno.Command('taskkill', { args: ['/PID', String(root), '/T', '/F'], stdout: 'null', stderr: 'null' }).output().catch(() => {});
    return;
  }
  const sample = await sampleTree(root).catch(() => null);
  const pids = sample ? sample.processes.map((process) => process.pid).reverse() : [root];
  for (const pid of pids) {
    try {
      Deno.kill(pid, 'SIGTERM');
    } catch { /* gone */ }
  }
}
