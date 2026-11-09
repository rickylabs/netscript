/**
 * Builds the self-contained HTML evaluation report from the run evidence.
 *
 *   deno run -A report/build-report.ts --evidence=../evidence --out=<file.html> [--images=<dir of .webp>]
 *
 * Every chart is drawn from the JSON in evidence/ (bench, threads, sizes,
 * runtime portability); rerun after a laptop benchmark to refresh numbers.
 */
const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const EVIDENCE = args.get('evidence') ?? '../evidence';
const OUT = args.get('out') ?? 'report.html';
const IMAGES = args.get('images') ?? `${EVIDENCE}/report-img`;

interface Variant {
  label: string;
  coldStartMs: { median: number; min: number; max: number; samples: number[] };
  memoryMb: { rssMedian: number; pssMedian: number | null };
  processCount: number;
  processes: Array<{ name: string; rssMb: number }>;
  idleCpuPct: { median: number; samples: number[] };
  activeCpuPct: { median: number; samples: number[]; rssMedianMb: number };
  parallel: Array<{ instances: number; allReadyMs: number; totalRssMb: number; totalPssMb: number | null; rssPerInstanceMb: number }>;
}
const bench = JSON.parse(await Deno.readTextFile(`${EVIDENCE}/bench-linux-software.json`)) as { environment: Record<string, unknown>; variants: Record<string, Variant> };
const threads = await Deno.readTextFile(`${EVIDENCE}/threads-linux-software.json`).then((text) => JSON.parse(text) as Array<{ variant: string; totalCpuPct: number; breakdown: Array<{ bucket: string; cpuPct: number }>; topThreads?: Array<{ thread: string; cpuPct: number }> }>).catch(() => []);
const sizes = await Deno.readTextFile(`${EVIDENCE}/install-sizes.json`).then((text) => JSON.parse(text) as Record<string, number>).catch(() => ({} as Record<string, number>));
const winBench = await Deno.readTextFile(`${EVIDENCE}/bench-windows-yogabook9i.json`).then((text) => JSON.parse(text) as { environment: Record<string, unknown> & { machine?: Record<string, unknown> }; variants: Record<string, Variant & { parallelFailures?: string[] }> }).catch(() => null);
const winProbe = await Deno.readTextFile(`${EVIDENCE}/probe-windows-yogabook9i.json`).then((text) => JSON.parse(text) as {
  launchSummary: Array<{ host: string; kind: string; windowMedianMs: number | null; dataMedianMs: number | null; samples: string[] }>;
  gpuixThreads: Array<{ label: string; totalCpuPct: number; threads: Array<{ thread: string; cpuPct: number }> }>;
  webviewProcesses: { totalCpuPct: number; processes: Array<{ process: string; cpuPct: number }> } | null;
}).catch(() => null);
const runtimes = await Deno.readTextFile(`${EVIDENCE}/runtime-portability.json`).then((text) => JSON.parse(text) as Array<{ runtime: string; readyMs: number; rssMb: number }>).catch(() => []);

async function image(name: string): Promise<string> {
  try {
    const bytes = await Deno.readFile(`${IMAGES}/${name}`);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:image/webp;base64,${btoa(binary)}`;
  } catch {
    return '';
  }
}

const esc = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (value: number, digits = 0) => value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

// Host identity → fixed categorical slot (never re-ordered by rank).
const HOSTS: Array<{ id: string; short: string; slot: number }> = [
  { id: 'gpuix', short: 'GPUIX · compiled', slot: 1 },
  { id: 'webview', short: 'WebKitGTK webview', slot: 2 },
  { id: 'cef', short: 'CEF (Chromium)', slot: 3 },
  { id: 'gpuix-run', short: 'GPUIX · deno run', slot: 4 },
];
const hosts = HOSTS.filter((host) => bench.variants[host.id]);
const v = (id: string) => bench.variants[id];

function niceMax(value: number): { max: number; step: number } {
  const raw = value / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((candidate) => candidate >= raw) ?? raw;
  return { max: Math.ceil(value / step) * step, step };
}

/** Horizontal bars (one per host), optional min–max whisker. */
function barChart(options: { id: string; unit: string; rows: Array<{ host: typeof HOSTS[number]; value: number; min?: number; max?: number; note?: string }>; digits?: number }): string {
  const width = 640;
  const labelW = 150;
  const valueW = 70;
  const rowH = 34;
  const top = 8;
  const plotW = width - labelW - valueW - 8;
  const peak = Math.max(...options.rows.map((row) => row.max ?? row.value));
  const { max, step } = niceMax(peak);
  const height = top + options.rows.length * rowH + 26;
  const x = (value: number) => labelW + (value / max) * plotW;
  let svg = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${options.id}-t" preserveAspectRatio="xMinYMin meet">`;
  for (let tick = 0; tick <= max + 1e-9; tick += step) {
    svg += `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="${top}" y2="${height - 22}"/>`;
    svg += `<text class="tick" x="${x(tick)}" y="${height - 6}" text-anchor="middle">${fmt(tick, step < 1 ? 1 : 0)}</text>`;
  }
  options.rows.forEach((row, index) => {
    const y = top + index * rowH;
    const barH = 14;
    const by = y + (rowH - barH) / 2;
    const tip = `${row.host.short}: ${fmt(row.value, options.digits ?? 0)} ${options.unit}${row.min !== undefined ? ` (min ${fmt(row.min, 0)}, max ${fmt(row.max!, 0)})` : ''}${row.note ? ` · ${row.note}` : ''}`;
    svg += `<text class="label" x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(row.host.short)}</text>`;
    svg += `<g class="hit" data-tip="${esc(tip)}"><rect x="${labelW}" y="${y + 2}" width="${plotW}" height="${rowH - 4}" fill="transparent"/>`;
    svg += `<rect class="s${row.host.slot}" x="${labelW}" y="${by}" width="${Math.max(2, x(row.value) - labelW)}" height="${barH}" rx="2"/>`;
    if (row.min !== undefined && row.max !== undefined) {
      svg += `<line class="whisker" x1="${x(row.min)}" x2="${x(row.max)}" y1="${by + barH / 2}" y2="${by + barH / 2}"/>`;
      svg += `<line class="whisker" x1="${x(row.min)}" x2="${x(row.min)}" y1="${by + 3}" y2="${by + barH - 3}"/><line class="whisker" x1="${x(row.max)}" x2="${x(row.max)}" y1="${by + 3}" y2="${by + barH - 3}"/>`;
    }
    svg += `</g><text class="value" x="${x(Math.max(row.value, row.max ?? 0)) + 6}" y="${y + rowH / 2 + 4}">${fmt(row.value, options.digits ?? 0)}</text>`;
  });
  return `${svg}<title id="${options.id}-t">${esc(options.unit)} by host</title></svg>`;
}

/** Total memory vs instance count (one line per host), direct-labelled. */
function scalingChart(): string {
  const width = 640;
  const height = 280;
  const left = 56;
  const right = 150;
  const top = 12;
  const bottom = 34;
  const counts = [1, 4, 8];
  const series = hosts.map((host) => ({ host, points: counts.map((count) => {
    const point = v(host.id).parallel.find((entry) => entry.instances === count);
    return point ? { count, value: point.totalPssMb ?? point.totalRssMb, ready: point.allReadyMs } : null;
  }).filter((point): point is { count: number; value: number; ready: number } => point !== null) })).filter((entry) => entry.points.length > 0);
  const peak = Math.max(...series.flatMap((entry) => entry.points.map((point) => point.value)));
  const { max, step } = niceMax(peak);
  const x = (count: number) => left + ((count - 1) / 7) * (width - left - right);
  const y = (value: number) => top + (1 - value / max) * (height - top - bottom);
  let svg = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Total memory (PSS) by number of concurrent instances">`;
  for (let tick = 0; tick <= max + 1e-9; tick += step) {
    svg += `<line class="grid" x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}"/><text class="tick" x="${left - 8}" y="${y(tick) + 4}" text-anchor="end">${fmt(tick)}</text>`;
  }
  for (const count of counts) svg += `<text class="tick" x="${x(count)}" y="${height - 12}" text-anchor="middle">${count} ${count === 1 ? 'instance' : 'instances'}</text>`;
  const ends: Array<{ y: number; text: string; slot: number }> = [];
  for (const { host, points } of series) {
    svg += `<polyline class="line s${host.slot}-stroke" points="${points.map((point) => `${x(point.count)},${y(point.value)}`).join(' ')}"/>`;
    for (const point of points) {
      svg += `<g class="hit" data-tip="${esc(`${host.short} × ${point.count}: ${fmt(point.value)} MB total · all ready in ${fmt(point.ready)} ms`)}"><circle cx="${x(point.count)}" cy="${y(point.value)}" r="12" fill="transparent"/><circle class="s${host.slot} ring" cx="${x(point.count)}" cy="${y(point.value)}" r="4.5"/></g>`;
    }
    const last = points.at(-1)!;
    ends.push({ y: y(last.value), text: `${host.short} · ${fmt(last.value)} MB`, slot: host.slot });
  }
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
  for (const end of ends) svg += `<text class="label" x="${width - right + 10}" y="${end.y + 4}">${esc(end.text)}</text>`;
  return `${svg}</svg>`;
}

/** Active CPU split into app JS, UI/engine threads and software rasterization. */
function threadChart(): string {
  if (threads.length === 0) return '<p class="muted">Thread breakdown not captured.</p>';
  const rows = hosts.filter((host) => threads.some((entry) => entry.variant === host.id)).map((host) => {
    const entry = threads.find((item) => item.variant === host.id)!;
    let raster = 0, app = 0, engine = 0;
    for (const item of entry.breakdown) {
      if (/rasteriz/i.test(item.bucket)) raster += item.cpuPct;
      else if (/host main|V8 helper|runtime workers/i.test(item.bucket)) app += item.cpuPct;
      else engine += item.cpuPct;
    }
    return { host, raster, app, engine, total: entry.totalCpuPct };
  });
  const width = 640;
  const labelW = 150;
  const rowH = 36;
  const plotW = width - labelW - 80;
  const { max, step } = niceMax(Math.max(...rows.map((row) => row.total)));
  const height = 8 + rows.length * rowH + 26;
  const x = (value: number) => labelW + (value / max) * plotW;
  let svg = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Active CPU split into app JavaScript, UI and engine threads, and software rasterization"><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/></pattern></defs>`;
  for (let tick = 0; tick <= max + 1e-9; tick += step) svg += `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="8" y2="${height - 22}"/><text class="tick" x="${x(tick)}" y="${height - 6}" text-anchor="middle">${fmt(tick)}%</text>`;
  rows.forEach((row, index) => {
    const y = 8 + index * rowH;
    const by = y + 10;
    const seg = (from: number, value: number, cls: string, fill = '') => value <= 0 ? '' : `<rect class="${cls}"${fill ? ` fill="${fill}"` : ''} x="${x(from) + (from > 0 ? 2 : 0)}" y="${by}" width="${Math.max(1, x(from + value) - x(from) - (from > 0 ? 2 : 0))}" height="16" rx="2"/>`;
    svg += `<text class="label" x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(row.host.short)}</text>`;
    svg += `<g class="hit" data-tip="${esc(`${row.host.short}: ${fmt(row.total, 1)}% total · app JS + host ${fmt(row.app, 1)}% · UI/engine threads ${fmt(row.engine, 1)}% · software rasterization ${fmt(row.raster, 1)}%`)}"><rect x="${labelW}" y="${y + 2}" width="${plotW}" height="${rowH - 4}" fill="transparent"/>`;
    svg += seg(0, row.app, 'ink-fill');
    svg += seg(row.app, row.engine, `s${row.host.slot}`);
    svg += seg(row.app + row.engine, row.raster, 'hatch-edge', 'url(#hatch)');
    svg += `</g><text class="value" x="${x(row.total) + 8}" y="${y + rowH / 2 + 4}">${fmt(row.total)}%</text>`;
  });
  return `${svg}</svg><div class="legend"><span><i class="sw ink-sw"></i>App JavaScript + host main thread</span><span><i class="sw s1"></i><i class="sw s2"></i><i class="sw s3"></i>UI / engine threads (GPUI UI thread, web content, compositor)</span><span><i class="sw hatch-sw"></i>Software rasterization (a GPU does this)</span></div>`;
}

function nonRasterSentence(): string {
  const split = (id: string) => {
    const entry = threads.find((item) => item.variant === id);
    if (!entry) return null;
    let raster = 0, app = 0;
    for (const item of entry.breakdown) {
      if (/rasteriz/i.test(item.bucket)) raster += item.cpuPct;
      else if (/host main|V8 helper|runtime workers/i.test(item.bucket)) app += item.cpuPct;
    }
    return { nonRaster: entry.totalCpuPct - raster, app };
  };
  const gs = split('gpuix'), ws = split('webview'), cs = split('cef');
  if (!gs) return '';
  return `Without rasterization, GPUIX still used about ${fmt(gs.nonRaster)}% (almost all on GPUI's UI thread: layout, scene rebuild and, here, software presentation), against ${ws ? fmt(ws.nonRaster) : '—'}% for WebKitGTK and ${cs ? fmt(cs.nonRaster) : '—'}% in total for CEF (its compositor threads can't be separated, so that includes rendering). The JavaScript and host main-thread bucket was ${fmt(gs.app)}%. This is the main open risk; the real-GPU benchmark decides it.`;
}


/** Stacked horizontal bars with explicit segments (ink / host colour / hatch / muted). */
function stackedChart(rows: Array<{ label: string; slot: number; segments: Array<{ name: string; value: number; kind: 'ink' | 'host' | 'hatch' | 'muted' }> }>, unit = '%'): string {
  const width = 640;
  const labelW = 170;
  const rowH = 36;
  const plotW = width - labelW - 80;
  const totals = rows.map((row) => row.segments.reduce((sum, seg) => sum + seg.value, 0));
  const { max, step } = niceMax(Math.max(...totals));
  const height = 8 + rows.length * rowH + 26;
  const x = (value: number) => labelW + (value / max) * plotW;
  let svg = `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="CPU by thread or process"><defs><pattern id="hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="hatch-bg"/><line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/></pattern></defs>`;
  for (let tick = 0; tick <= max + 1e-9; tick += step) svg += `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="8" y2="${height - 22}"/><text class="tick" x="${x(tick)}" y="${height - 6}" text-anchor="middle">${fmt(tick)}${unit}</text>`;
  rows.forEach((row, index) => {
    const y = 8 + index * rowH;
    const by = y + 10;
    let from = 0;
    const tip = `${row.label}: ${fmt(totals[index], 1)}${unit} total · ` + row.segments.map((seg) => `${seg.name} ${fmt(seg.value, 1)}${unit}`).join(' · ');
    svg += `<text class="label" x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(row.label)}</text><g class="hit" data-tip="${esc(tip)}"><rect x="${labelW}" y="${y + 2}" width="${plotW}" height="${rowH - 4}" fill="transparent"/>`;
    for (const seg of row.segments) {
      if (seg.value <= 0) continue;
      const x0 = x(from) + (from > 0 ? 2 : 0);
      const w = Math.max(1, x(from + seg.value) - x0);
      const cls = seg.kind === 'ink' ? 'ink-fill' : seg.kind === 'host' ? `s${row.slot}` : seg.kind === 'muted' ? 'muted-fill' : 'hatch-edge';
      svg += `<rect class="${cls}"${seg.kind === 'hatch' ? ' fill="url(#hatch2)"' : ''} x="${x0}" y="${by}" width="${w}" height="16" rx="2"/>`;
      from += seg.value;
    }
    svg += `</g><text class="value" x="${x(totals[index]) + 8}" y="${y + rowH / 2 + 4}">${fmt(totals[index])}${unit}</text>`;
  });
  return `${svg}</svg>`;
}

function windowsSection(): string {
  if (!winBench) return '';
  const g = winBench.variants.gpuix;
  const w = winBench.variants.webview;
  const m = winBench.environment.machine ?? {};
  const G = { id: 'gpuix', short: 'GPUIX', slot: 1 };
  const W = { id: 'webview2', short: 'WebView2', slot: 2 };
  const p8 = g.parallel.find((entry) => entry.instances === 8);
  let cpu = '';
  if (winProbe) {
    const thread = (label: string, name: string) => winProbe.gpuixThreads.find((row) => row.label.startsWith(label))?.threads.filter((t) => t.thread === name).reduce((sum, t) => sum + t.cpuPct, 0) ?? 0;
    const total = (label: string) => winProbe.gpuixThreads.find((row) => row.label.startsWith(label))?.totalCpuPct ?? 0;
    const gRow = (label: string, key: string) => {
      const ui = thread(key, 'gpuix-ui');
      const js = thread(key, 'main');
      return { label, slot: 1, segments: [{ name: 'JavaScript main thread', value: js, kind: 'ink' as const }, { name: 'GPUI UI thread', value: ui, kind: 'host' as const }, { name: 'other threads', value: Math.max(0, total(key) - ui - js), kind: 'muted' as const }] };
    };
    const rows = [gRow('GPUIX · overview, 20/s', 'GPUIX overview, 20'), gRow('GPUIX · settings, 20/s', 'GPUIX settings'), gRow('GPUIX · overview, idle', 'GPUIX overview, idle')];
    if (winProbe.webviewProcesses) {
      const part = (name: string) => winProbe.webviewProcesses!.processes.filter((row) => row.process.startsWith(name)).reduce((sum, row) => sum + row.cpuPct, 0);
      const host = part('host');
      const renderer = part('renderer');
      const gpu = part('gpu-process');
      rows.push({ label: 'WebView2 · overview, 20/s', slot: 2, segments: [{ name: 'host (Deno + service)', value: host, kind: 'ink' }, { name: 'renderer (JS, layout, paint)', value: renderer, kind: 'host' }, { name: 'GPU process', value: gpu, kind: 'hatch' }, { name: 'other processes', value: Math.max(0, winProbe.webviewProcesses.totalCpuPct - host - renderer - gpu), kind: 'muted' }] });
    }
    const launchRow = (host: string, kind: string) => {
      const row = winProbe.launchSummary.find((item) => item.host === host && item.kind.startsWith(kind));
      return row ? `${fmt(row.windowMedianMs ?? 0)} / ${fmt(row.dataMedianMs ?? 0)} ms` : '—';
    };
    cpu = `<div class="grid2">
      <figure class="card"><h3>Where the CPU goes <span class="eyebrow">% of one core · 10 s</span></h3>${stackedChart(rows)}
        <div class="legend"><span><i class="sw ink-sw"></i>JavaScript / host (Preact, service, SDK)</span><span><i class="sw s1"></i><i class="sw s2"></i>GPUI UI thread / WebView2 renderer</span><span><i class="sw hatch-sw"></i>WebView2 GPU process</span><span><i class="sw muted-sw"></i>Other</span></div>
        <figcaption>App JavaScript is about 3% on either host. GPUI's UI thread uses 88% on the busy overview and 3% on the quiet settings screen at the same event rate: the cost is GPUI's per-frame work when large visible areas keep changing.</figcaption></figure>
      <div class="card"><h3>Launch types <span class="eyebrow">window / data on screen · median of 3</span></h3>
        <div class="scroll"><table class="data"><thead><tr><th>Launch</th><th>GPUIX</th><th>WebView2</th></tr></thead><tbody>
          <tr><th scope="row">First launch (no code cache)</th><td>${launchRow('gpuix', 'first')}</td><td>${launchRow('webview', 'first')}</td></tr>
          <tr><th scope="row">Relaunch, existing data</th><td>${launchRow('gpuix', 'relaunch')}</td><td>${launchRow('webview', 'relaunch')}</td></tr>
          <tr><th scope="row">New data, cache warm</th><td>${launchRow('gpuix', 'new profile')}</td><td>${launchRow('webview', 'new profile')}</td></tr>
        </tbody></table></div>
        <p class="muted">Indicative only: individual launches on this machine (four displays, background browser) ranged from under 1 s to 13 s, and WebView2 relaunches were erratic. On Linux, a normal relaunch showed data in 0.43 s (GPUIX) against 0.75 s (webview).</p></div>
    </div>`;
  }
  return `<section aria-labelledby="realgpu">
  <div class="sec-head"><span class="eyebrow">Decision gate 1 · real GPU · ${esc(String(m.name ?? 'Windows laptop').replace(/\s*\(.*\)$/, ''))}</span><h2 id="realgpu">On your laptop: memory wins, CPU under load loses</h2>
  <p class="prose muted">${esc(String(m.windows ?? 'Windows 11'))} · ${esc(String(m.cpu ?? ''))} · ${esc(String((m.gpus as string[] | undefined)?.[0] ?? ''))} · ${esc(String(m.ramGb ?? ''))} GB · ${esc(String(m.power ?? ''))} · WebView2 ${esc(String(m.webview2 ?? ''))}. Same app and method, run by the installable's <code>--bench</code>.</p></div>
  <div class="kpis">
    <div class="kpi"><span>Memory (working set)</span><b>${fmt(g.memoryMb.rssMedian)} vs ${fmt(w.memoryMb.rssMedian)} MB</b><span>GPUIX · WebView2 (shared pages counted per process)</span></div>
    <div class="kpi"><span>Processes</span><b>${g.processCount} vs ${w.processCount}</b><span>GPUIX · WebView2</span></div>
    <div class="kpi"><span>8 instances</span><b>${p8 ? `${fmt(p8.totalRssMb)} MB` : '—'}</b><span>${p8 ? `all ready in ${fmt(p8.allReadyMs / 1000, 1)} s` : ''} · WebView2: 4 and 8 never started</span></div>
    <div class="kpi"><span>CPU at 20 updates/s</span><b>${fmt(g.activeCpuPct.median)}% vs ${fmt(w.activeCpuPct.median)}%</b><span>Gate 1 not met · idle ${fmt(g.idleCpuPct.median, 1)}% vs ${fmt(w.idleCpuPct.median, 1)}%</span></div>
  </div>
  <div class="grid2">
    <figure class="card"><h3>Memory per instance <span class="eyebrow">working set · MB</span></h3>${barChart({ id: 'wmem', unit: 'MB', rows: [{ host: G, value: g.memoryMb.rssMedian, note: '1 process' }, { host: W, value: w.memoryMb.rssMedian, note: `${w.processCount} processes` }] })}<figcaption>Windows counts pages shared between WebView2's processes once per process, so the true gap is smaller than 2×.</figcaption></figure>
    <figure class="card"><h3>CPU, idle and under load <span class="eyebrow">% of one core · median</span></h3>${stackedChart([
      { label: 'GPUIX · idle', slot: 1, segments: [{ name: 'idle', value: g.idleCpuPct.median, kind: 'host' }] },
      { label: 'WebView2 · idle', slot: 2, segments: [{ name: 'idle', value: w.idleCpuPct.median, kind: 'host' }] },
      { label: 'GPUIX · 20 updates/s', slot: 1, segments: [{ name: 'active', value: g.activeCpuPct.median, kind: 'host' }] },
      { label: 'WebView2 · 20 updates/s', slot: 2, segments: [{ name: 'active', value: w.activeCpuPct.median, kind: 'host' }] },
    ])}<figcaption>Cold start with new data: ${fmt(g.coldStartMs.median)} ms (GPUIX) vs ${fmt(w.coldStartMs.median)} ms (WebView2, first run ${fmt(w.coldStartMs.max)} ms).</figcaption></figure>
  </div>
  ${cpu}
  <p class="note prose">Path to passing gate 1: coalesce data-driven updates to a frame budget in the runtime (live feeds rarely need more than 10 Hz), virtualize long lists, and upstream incremental rendering of unchanged subtrees plus an event-driven frame pump to GPUIX. Then re-measure on Windows and Apple Silicon.</p>
</section>`;
}

const img = {
  gpuixLight: await image('gpuix-overview-light.webp'),
  gpuixDark: await image('gpuix-overview-dark.webp'),
  webview: await image('webview-overview-light.webp'),
  sheetLight: await image('sheet-light.webp'),
  sheetDark: await image('sheet-dark.webp'),
  runtime: await image('runtime-sheet.webp'),
  signIn: await image('gpuix-sign-in.webp'),
};

const g = v('gpuix');
const w = v('webview');
const c = v('cef');
const pct = (a: number, b: number) => Math.round((1 - a / b) * 100);
const memG = g?.memoryMb.pssMedian ?? 0;
const memW = w?.memoryMb.pssMedian ?? 0;
const memC = c?.memoryMb.pssMedian ?? 0;
const eight = (variant: Variant | undefined) => variant?.parallel.find((entry) => entry.instances === 8);

const tableRows = hosts.map((host) => {
  const r = v(host.id);
  const p8 = eight(r);
  return `<tr><th scope="row"><i class="sw s${host.slot}"></i>${esc(host.short)}</th><td>${fmt(r.coldStartMs.median)} ms</td><td>${fmt(r.coldStartMs.min)}–${fmt(r.coldStartMs.max)}</td><td>${r.memoryMb.pssMedian === null ? '—' : fmt(r.memoryMb.pssMedian)} MB</td><td>${fmt(r.memoryMb.rssMedian)} MB</td><td>${r.processCount}</td><td>${fmt(r.idleCpuPct.median, 1)}%</td><td>${fmt(r.activeCpuPct.median, 1)}%</td><td>${p8 ? `${fmt(p8.totalPssMb ?? p8.totalRssMb)} MB` : '—'}</td><td>${p8 ? `${fmt(p8.allReadyMs)} ms` : '—'}</td><td>${sizes[host.id] ? `${fmt(sizes[host.id])} MB` : '—'}</td></tr>`;
}).join('');

const env = bench.environment;
const html = `<title>GPUIX Desktop Evaluation</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: one reading column (≈68ch) with wide figure rows; NetScript Studio Utility — monochrome chrome, sharp 0–2px radii, hairlines, mono for data; red only for the mark and failures. */
:root {
  --bg: #ffffff; --surface: #fafafa; --raise: #f3f3f4; --line: #e5e5e8; --line-strong: #cfcfd5;
  --ink: #17171a; --ink-2: #55555d; --ink-3: #8a8a94; --mark: #d52b1e; --good: #1f7a3d; --warn: #8f5600; --bad: #c42318;
  --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #eda100;
  --sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #0d0d10; --surface: #131317; --raise: #1a1a1f; --line: #26262c; --line-strong: #383840;
  --ink: #ececf0; --ink-2: #a4a4ae; --ink-3: #74747e; --mark: #ff5a4d; --good: #4cc27a; --warn: #e0a43a; --bad: #ff6b5e;
  --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #0d0d10; --surface: #131317; --raise: #1a1a1f; --line: #26262c; --line-strong: #383840;
  --ink: #ececf0; --ink-2: #a4a4ae; --ink-3: #74747e; --mark: #ff5a4d; --good: #4cc27a; --warn: #e0a43a; --bad: #ff6b5e;
  --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; color-scheme: dark }
* { box-sizing: border-box }
body { background: var(--bg); color: var(--ink); font: 15px/1.6 var(--sans); }
.page { max-width: 1120px; margin: 0 auto; padding-block: 40px 96px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); display: grid; gap: 56px }
.prose { max-width: 70ch }
h1, h2, h3 { text-wrap: balance; margin: 0; letter-spacing: -0.01em }
h1 { font-size: clamp(28px, 4vw, 40px); font-weight: 600; line-height: 1.15 }
h2 { font-size: 22px; font-weight: 600; line-height: 1.3 }
h3 { font-size: 15px; font-weight: 600 }
p { margin: 0 }
a { color: var(--ink); text-underline-offset: 3px }
code, .mono { font-family: var(--mono); font-size: 0.88em }
.eyebrow { font: 500 11px/1.4 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3) }
.muted { color: var(--ink-2) }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600 }
.brand i { width: 14px; height: 14px; background: var(--mark); border-radius: 1px; display: inline-block }
header.top { display: grid; gap: 18px }
.meta { display: flex; flex-wrap: wrap; gap: 8px 20px; color: var(--ink-3); font: 12px/1.5 var(--mono) }
section { display: grid; gap: 20px }
.sec-head { display: grid; gap: 6px; border-top: 1px solid var(--line); padding-top: 18px }
.answers { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 330px), 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line) }
.answer { background: var(--bg); padding: 18px; display: grid; gap: 8px; align-content: start; min-width: 0 }
.answer .q { font: 500 12px/1.4 var(--mono); color: var(--ink-3) }
.verdict { display: inline-flex; align-items: center; gap: 6px; font: 500 12px/1 var(--mono); padding: 4px 7px; border: 1px solid var(--line-strong); border-radius: 2px; width: fit-content }
.verdict::before { content: ""; width: 7px; height: 7px; border-radius: 1px; background: currentColor }
.v-yes { color: var(--good) } .v-no { color: var(--bad) } .v-partial { color: var(--warn) } .v-neutral { color: var(--ink-2) }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 12px }
.kpi { border: 1px solid var(--line); padding: 14px 16px; display: grid; gap: 4px; min-width: 0 }
.kpi b { font: 400 26px/1.15 var(--mono); font-variant-numeric: tabular-nums }
.kpi span { font-size: 13px; color: var(--ink-2) }
.grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr)); gap: 20px }
figure { margin: 0; display: grid; gap: 10px; min-width: 0 }
figcaption { font-size: 13px; color: var(--ink-2) }
.card { border: 1px solid var(--line); padding: 16px; display: grid; gap: 12px; min-width: 0; background: var(--bg) }
.card h3 { display: flex; justify-content: space-between; gap: 12px; align-items: baseline }
.shot { width: 100%; border: 1px solid var(--line); display: block; background: var(--surface) }
.chart { width: 100%; height: auto; display: block; overflow: visible }
.chart .grid { stroke: var(--line); stroke-width: 1 }
.chart .tick { fill: var(--ink-3); font: 11px var(--mono) }
.chart .label { fill: var(--ink-2); font: 12px var(--sans) }
.chart .value { fill: var(--ink); font: 500 12px var(--mono) }
.chart .whisker { stroke: var(--ink); stroke-width: 1.5; opacity: 0.55 }
.chart .line { fill: none; stroke-width: 2 }
.chart .ring { stroke: var(--bg); stroke-width: 2 }
.chart .hatch-bg { fill: var(--raise) } .chart .hatch-line { stroke: var(--ink-3); stroke-width: 2 }
.chart .hatch-edge { stroke: var(--ink-3); stroke-width: 1 }
.ink-fill { fill: var(--ink) } i.sw.ink-sw { background: var(--ink) } .muted-fill { fill: var(--line-strong) } i.sw.muted-sw { background: var(--line-strong) }
.s1 { fill: var(--s1) } .s2 { fill: var(--s2) } .s3 { fill: var(--s3) } .s4 { fill: var(--s4) }
.s1-stroke { stroke: var(--s1) } .s2-stroke { stroke: var(--s2) } .s3-stroke { stroke: var(--s3) } .s4-stroke { stroke: var(--s4) }
i.sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 8px; vertical-align: -1px }
i.sw.s1 { background: var(--s1) } i.sw.s2 { background: var(--s2) } i.sw.s3 { background: var(--s3) } i.sw.s4 { background: var(--s4) }
i.hatch-sw { background: repeating-linear-gradient(45deg, var(--ink-3) 0 2px, var(--raise) 2px 5px); outline: 1px solid var(--ink-3) }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 12px; color: var(--ink-2) }
.scroll { overflow-x: auto; border: 1px solid var(--line) }
table { border-collapse: collapse; width: 100%; font-size: 13px; font-variant-numeric: tabular-nums }
th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); vertical-align: top }
thead th { font: 500 11px/1.4 var(--mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-3); background: var(--surface); white-space: nowrap }
tbody th { font-weight: 500; white-space: nowrap }
td.num, .data td { font-family: var(--mono); font-size: 12.5px; white-space: nowrap }
tr:last-child th, tr:last-child td { border-bottom: 0 }
.st { font: 500 12px var(--mono); white-space: nowrap } .st.ok { color: var(--good) } .st.part { color: var(--warn) } .st.no { color: var(--bad) } .st.na { color: var(--ink-3) }
.note { border-left: 2px solid var(--ink); padding: 4px 0 4px 14px; color: var(--ink-2); font-size: 14px }
ul.tight { margin: 0; padding-left: 18px; display: grid; gap: 6px }
.files { display: grid; gap: 8px }
.file { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 16px; border: 1px solid var(--line); padding: 12px 14px; align-items: baseline }
.file code { overflow-wrap: anywhere }
.file .hash { grid-column: 1 / -1; color: var(--ink-3); font: 11px var(--mono); overflow-wrap: anywhere }
pre.mermaid { background: var(--surface); border: 1px solid var(--line); padding: 16px; margin: 0; overflow-x: auto }
#tip { position: fixed; pointer-events: none; z-index: 20; background: var(--ink); color: var(--bg); font: 12px/1.4 var(--mono); padding: 6px 8px; border-radius: 2px; max-width: 320px; opacity: 0; transition: opacity 80ms }
.hit { cursor: default } .hit:focus { outline: none } .hit:focus-visible rect:not([fill="transparent"]), .hit:focus-visible circle:not([fill="transparent"]) { stroke: var(--ink); stroke-width: 2 }
@media (prefers-reduced-motion: reduce) { #tip { transition: none } }
</style>
<div class="page">
<header class="top">
  <div class="brand"><i aria-hidden="true"></i>NetScript <span class="eyebrow">RFC evidence · rfc-gpuix-desktop</span></div>
  <h1>GPUIX as NetScript's native desktop renderer</h1>
  <p class="prose muted">An evaluation of <a href="https://gpuix.dev">GPUIX</a> (React and Solid bindings for Zed's GPU UI framework) as the renderer for NetScript desktop apps: whether Preact can drive it, how it plugs into the NetScript service, SDK, streams and KV, what a real app costs in memory and CPU against today's Deno Desktop webview, and what has to be built. Every number on this page comes from the PoC in the run directory.</p>
  <div class="meta"><span>2026-11-09</span><span>GPUIX 0.11.0 · Deno 2.9.7 · Bun 1.4.4 · Node 24</span><span>@netscript/* 0.0.9 (JSR)</span><span>branch docs/rfc-gpuix-native-desktop</span></div>
</header>

<section aria-labelledby="answers">
  <div class="sec-head"><span class="eyebrow">Your five questions</span><h2 id="answers">Short answers</h2></div>
  <div class="answers">
    <div class="answer"><span class="q">1 · Preact through the compat layer?</span><span class="verdict v-no">No, but yes natively</span><p><code>@gpuix/react</code> sits on <code>react-reconciler</code>, which reads React's private internals at load and crashes under <code>preact/compat</code>. GPUIX's framework-neutral host layer let me write a Preact renderer instead (≈500 lines). Preact 10, signals and the full app run on it.</p></div>
    <div class="answer"><span class="q">2 · Connection to the NetScript ecosystem</span><span class="verdict v-yes">In one process</span><p>Service, typed SDK client, durable-stream consumer and KV run in the same process as the window. The webview RPC bridge disappears. Gaps: cookie sessions (bridged to bearer), auto-update adapter, packaging backend, a native component kit.</p></div>
    <div class="answer"><span class="q">3 · Working PoC + benchmark</span><span class="verdict v-partial">Built · measured · mixed</span><p>Scaffold-style workspace app: overview, records, record detail, health, design, settings, sign-in, in light and dark. One process; ${memW ? `${pct(memG, memW)}% less memory than the WebKit webview and ${pct(memG, memC)}% less than CEF` : 'lower memory'}; on your laptop half the memory of WebView2 and many instances where WebView2 stalls. But 2.2× its CPU under frequent updates, almost all in GPUI's UI thread.</p></div>
    <div class="answer"><span class="q">4 · Installable for your laptop</span><span class="verdict v-yes">Windows · macOS · Linux</span><p>NSIS installer and portable zip for Windows x64, an ad-hoc-signed app for Apple Silicon, a tarball for Linux. Each includes <code>--bench</code> to rerun this benchmark on your real GPU.</p></div>
    <div class="answer"><span class="q">5 · RFC</span><span class="verdict v-partial">Incubate, gated</span><p>Gate 1 (real-GPU CPU) is not met yet. An opt-in native desktop track (<code>rfcs/0000-gpuix-native-desktop-renderer.md</code>). The Deno Desktop webview stays the default until the real-GPU benchmark, upstream maturity, accessibility and packaging gates pass.</p></div>
    <div class="answer"><span class="q">+ · Fresh on GPUIX?</span><span class="verdict v-neutral">2.x no · 3.x later</span><p>Unchanged Fresh pages can't run on GPUIX: GPUIX has no CSS engine. Fresh 2 has no renderer seam. Fresh 3 does (<code>renderPage(inner)</code>), so a native render target is a credible future plugin; the PoC's router already uses its route-module shape.</p></div>
  </div>
</section>

<section aria-labelledby="headline">
  <div class="sec-head"><span class="eyebrow">Linux, software rendering</span><h2 id="headline">Same app, same service, different host</h2></div>
  <div class="kpis">
    <div class="kpi"><span>Processes per app</span><b>${g?.processCount ?? '—'} vs ${w?.processCount ?? '—'} vs ${c?.processCount ?? '—'}</b><span>GPUIX · WebKitGTK · CEF</span></div>
    <div class="kpi"><span>Memory per instance (PSS)</span><b>${fmt(memG)} MB</b><span>vs ${fmt(memW)} MB webview, ${fmt(memC)} MB CEF</span></div>
    <div class="kpi"><span>8 instances, total memory</span><b>${fmt(eight(g)?.totalPssMb ?? 0)} MB</b><span>vs ${fmt(eight(w)?.totalPssMb ?? 0)} MB webview${eight(c) ? `, ${fmt(eight(c)?.totalPssMb ?? 0)} MB CEF` : ''}</span></div>
    <div class="kpi"><span>Runtimes that run the UI</span><b>3</b><span>Deno 2.9 · Bun 1.4 · Node 24, unchanged source</span></div>
  </div>
  <p class="note prose">There is no GPU on the build host. Every host here renders in software: GPUI through Mesa lavapipe, WebKitGTK and CEF through software compositing. That mostly affects <b>active CPU</b>. The real-GPU section below shows that GPUIX's higher CPU under load is not a software-rendering artifact: it persists on a laptop GPU.</p>
</section>

${windowsSection()}

<section aria-labelledby="bench">
  <div class="sec-head"><span class="eyebrow">Linux benchmark (software rendering) · ${esc(String(env.os ?? 'linux-x86_64'))} · ${esc(String(env.cpus ?? ''))} CPUs · 5 cold runs, 3 active runs per host</span><h2 id="bench">Measurements</h2>
  <p class="prose muted">Method: spawn → first data-backed frame painted, fresh profile each run; memory is summed over the whole process tree 3 s after ready (PSS splits shared pages fairly); idle CPU is measured over 10 s with no activity, active CPU over 10 s with the simulated workers pushing 20 events/s (live feed, job progress, throttled aggregate refetch). The host is shared (load average 4–7 during the runs), so medians limit that noise rather than remove it. Hover a mark for details.</p></div>
  <div class="legend">${hosts.map((host) => `<span><i class="sw s${host.slot}"></i>${esc(v(host.id).label)}</span>`).join('')}</div>
  <div class="grid2">
    <figure class="card"><h3>Memory per instance <span class="eyebrow">PSS · MB · lower is better</span></h3>${barChart({ id: 'mem', unit: 'MB', rows: hosts.map((host) => ({ host, value: v(host.id).memoryMb.pssMedian ?? v(host.id).memoryMb.rssMedian, note: `${v(host.id).processCount} processes` })) })}<figcaption>Proportional set size of the whole process tree, median of 5 runs.</figcaption></figure>
    <figure class="card"><h3>Cold start <span class="eyebrow">ms · lower is better</span></h3>${barChart({ id: 'cold', unit: 'ms', rows: hosts.map((host) => ({ host, value: v(host.id).coldStartMs.median, min: v(host.id).coldStartMs.min, max: v(host.id).coldStartMs.max })) })}<figcaption>Median with min–max whiskers. Includes starting the embedded service, signing in and loading the overview. <code>deno compile</code> adds roughly ${g && v('gpuix-run') ? fmt(g.coldStartMs.median - v('gpuix-run').coldStartMs.median) : '—'} ms over <code>deno run</code>.</figcaption></figure>
    <figure class="card"><h3>Parallel instances <span class="eyebrow">total PSS · MB</span></h3>${scalingChart()}<figcaption>Total memory with 1, 4 and 8 copies open at once (PSS splits shared pages between them). ${c && !eight(c) ? 'CEF ×4 and ×8 never reached ready within 90 s: concurrent launches of the same CEF app stall at startup here (in three trials of two launches, the second page waited about 10 s twice and never loaded once; evidence/cef-concurrent-start.log).' : ''}</figcaption></figure>
    <figure class="card"><h3>Idle CPU <span class="eyebrow">% of one core · lower is better</span></h3>${barChart({ id: 'idle', unit: '% CPU', digits: 1, rows: hosts.map((host) => ({ host, value: v(host.id).idleCpuPct.median })) })}<figcaption>10 s with no activity. GPUIX pays for its 8 ms frame pump; WebKitGTK's idle cost is specific to software compositing on Xvfb (CEF idles near zero).</figcaption></figure>
    <figure class="card"><h3>Active CPU, by where it goes <span class="eyebrow">% of one core · 20 events/s</span></h3>${threadChart()}<figcaption>Per-thread CPU over 10 s at 20 updates/s. ${nonRasterSentence()}</figcaption></figure>
    <figure class="card"><h3>Install size <span class="eyebrow">MB · uncompressed</span></h3>${barChart({ id: 'size', unit: 'MB', rows: hosts.filter((host) => sizes[host.id]).map((host) => ({ host, value: sizes[host.id] })) })}<figcaption>Linux builds as shipped, each without other hosts' or platforms' binaries. GPUIX is 133 MB on Windows and 123 MB on macOS (smaller addon). Downloads bundling both hosts: 57–94 MB.</figcaption></figure>
  </div>
  <div class="scroll"><table class="data"><thead><tr><th>Host</th><th>Cold start</th><th>Range</th><th>Memory PSS</th><th>RSS</th><th>Procs</th><th>Idle CPU</th><th>Active CPU</th><th>8× memory</th><th>8× all ready</th><th>Install</th></tr></thead><tbody>${tableRows}</tbody></table></div>
</section>

<section aria-labelledby="poc">
  <div class="sec-head"><span class="eyebrow">Proof of concept</span><h2 id="poc">The app, rendered by GPUI</h2>
  <p class="prose muted">A NetScript workspace in the scaffold's shape. It runs an embedded <code>@netscript/service</code> with cookie sessions, the typed SDK client, a durable activity stream fed by simulated workers, and Deno KV for settings and persisted edits. Views use a small primitives layer that renders to GPUIX natively or to HTML, which is how the webview baseline shows the identical tree.</p></div>
  <div class="grid2">
    <figure><img class="shot" src="${img.gpuixLight}" alt="GPUIX overview screen in light mode: stat cards, weekly chart, status breakdown, recent records and live activity"><figcaption>GPUIX · overview, light.</figcaption></figure>
    <figure><img class="shot" src="${img.webview}" alt="The same overview rendered as HTML in the WebKitGTK webview"><figcaption>Same Preact tree as HTML in the Deno Desktop webview (baseline).</figcaption></figure>
  </div>
  <figure><img class="shot" src="${img.sheetLight}" alt="Six GPUIX screens in light mode: overview, records, record detail, system health, design tokens, settings"><figcaption>All six screens via real X11 clicks: overview, records, record detail, system health (GPUI frame stats), design tokens, settings.</figcaption></figure>
  <figure><img class="shot" src="${img.sheetDark}" alt="The same six screens in the dark scheme"><figcaption>Dark scheme, designed rather than inverted: ink stays a raised dark surface.</figcaption></figure>
  <div class="grid2">
    <figure><img class="shot" src="${img.runtime}" alt="The same gpuix-preact demo running on Deno 2.9.7, Bun 1.4.4 and Node 24"><figcaption>One adapter source, three runtimes.</figcaption></figure>
    <div class="card"><h3>Runtime portability</h3><div class="scroll"><table class="data"><thead><tr><th>Runtime</th><th>Ready</th><th>RSS</th></tr></thead><tbody>${runtimes.map((row) => `<tr><th scope="row">${esc(row.runtime)}</th><td>${fmt(row.readyMs)} ms</td><td>${fmt(row.rssMb)} MB</td></tr>`).join('')}</tbody></table></div><p class="muted">Minimal tree (title, button, 12 rows). The UI layer is not tied to Deno; the Deno-specific part of a native app is the embedded service, which the general migration has to handle anyway.</p></div>
  </div>
</section>

<section aria-labelledby="arch">
  <div class="sec-head"><span class="eyebrow">Architecture</span><h2 id="arch">What changes when the webview goes away</h2></div>
  <div class="grid2">
    <figure class="card"><h3>Today · Deno Desktop webview</h3>
<pre class="mermaid">flowchart TB
  subgraph Host[deno desktop host process]
    S[NetScript service] --- B[bindDesktopRpcWindow]
  end
  subgraph Web[webview processes]
    F[Fresh / Preact islands] --> C[createDesktopServiceClient]
  end
  B <-. MessagePort oRPC .-> C
  F -->|HTTP + cookies| S
</pre><figcaption>Three processes on WebKitGTK, eight on CEF. The window boundary needs its own RPC transport.</figcaption></figure>
    <figure class="card"><h3>Proposed · GPUIX native</h3>
<pre class="mermaid">flowchart TB
  subgraph App[one process: Deno, Bun or Node]
    P[Preact tree] --> R[gpuix-preact renderer] --> G[GPUI on Metal / DX11 / Vulkan]
    P --> SDK[SDK client + stream consumer] --> S[embedded or remote service]
    P --> KV[KV settings and session]
  end
</pre><figcaption>One process. The SDK talks to the service exactly as it would to a remote one.</figcaption></figure>
  </div>
</section>

<section aria-labelledby="integration">
  <div class="sec-head"><span class="eyebrow">NetScript ecosystem</span><h2 id="integration">Integration map</h2></div>
  <div class="scroll"><table><thead><tr><th>Surface</th><th>Status</th><th>What happened</th></tr></thead><tbody>
    <tr><th scope="row"><code>@netscript/service</code></th><td class="st ok">works</td><td>Embedded via <code>createService().withAuthn().withRPC().withHealth().build()</code>. The builder's default RPC path (<code>/api/rpc</code>) does not match the SDK's (<code>/api/rpc/v1/&lt;router&gt;</code>); fixed with <code>buildServiceRpcPath()</code>.</td></tr>
    <tr><th scope="row"><code>@netscript/sdk/client</code></th><td class="st ok">works</td><td>Typed oRPC with <code>resolveServiceUrl</code> injection; the same code targets a remote, Aspire-hosted service.</td></tr>
    <tr><th scope="row"><code>@netscript/sdk/streams/consumer</code></th><td class="st ok">works</td><td>The DOM-free fetch consumer from the Expo work drives the live feed and job progress, with offset resume.</td></tr>
    <tr><th scope="row"><code>@netscript/kv</code></th><td class="st ok">works</td><td>Settings, session and persisted record edits (verified across a service restart).</td></tr>
    <tr><th scope="row">Cookie sessions</th><td class="st part">bridged</td><td>The SDK reserves the <code>cookie</code> header (correct for browsers), and a native host has no cookie jar. The host turns the session cookie into <code>Authorization: Bearer</code>. Production path: RFC 0001's bearer contribution plus better-auth's bearer plugin.</td></tr>
    <tr><th scope="row"><code>@netscript/sdk/auto-update</code></th><td class="st part">adapter</td><td>Wraps <code>Deno.autoUpdate</code>, which only exists under <code>deno desktop</code>. Its <code>NativeAutoUpdate</code> port is the seam; GPUIX offers <code>checkUpdate</code> on GitHub Releases.</td></tr>
    <tr><th scope="row"><code>@netscript/fresh-ui</code></th><td class="st part">port</td><td>Token presets are data and carry over; CSS components do not. A native primitives collection is needed.</td></tr>
    <tr><th scope="row"><code>netscript deploy desktop</code></th><td class="st part">backend</td><td>Wraps <code>deno desktop</code>. The PoC packages with <code>deno compile</code> plus per-OS bundling.</td></tr>
    <tr><th scope="row"><code>@netscript/fresh/desktop</code>, <code>@netscript/sdk/desktop</code></th><td class="st na">not needed</td><td>No window boundary to cross.</td></tr>
    <tr><th scope="row">Workers, sagas, triggers, streams plugins</th><td class="st ok">unchanged</td><td>Server-side; the desktop reaches them through the SDK and streams.</td></tr>
  </tbody></table></div>
</section>

<section aria-labelledby="features">
  <div class="sec-head"><span class="eyebrow">Feature completeness</span><h2 id="features">What the native host can and can't do yet</h2></div>
  <div class="scroll"><table><thead><tr><th>Capability</th><th>GPUIX host (0.11.0)</th><th>Deno Desktop webview</th></tr></thead><tbody>
    ${[
      ['Window, title, resize', 'ok:yes', 'ok:yes'],
      ['File and folder picker', 'ok:promptForPaths', 'ok:dialogs'],
      ['Clipboard', 'part:on main, not in 0.11.0', 'ok:yes'],
      ['OS notifications', 'part:on main; PoC uses an in-app toast', 'ok:yes'],
      ['Tray / app menu', 'part:app menu, no tray', 'ok:tray and menus'],
      ['Auto-update', 'part:checkUpdate; NetScript adapter needed', 'ok:Deno.autoUpdate'],
      ['Installers', 'part:deno compile + hand-built bundles', 'ok:app, dmg, AppImage, deb, rpm, msi'],
      ['Accessibility', 'part:AccessKit, ARIA subset', 'ok:full platform tree'],
      ['Text input, IME, selection', 'ok:native GPUI input', 'ok:yes'],
      ['CSS, HTML, third-party DOM widgets', 'no:style objects only', 'ok:yes'],
      ['Embedded web content (OAuth pages)', 'no:system browser + loopback', 'ok:yes'],
      ['Markdown, code, diff, virtual list, motion', 'ok:native elements', 'ok:via libraries'],
      ['Devtools / HMR', 'part:automation tree; Bun --hot remount', 'ok:CEF devtools, HMR'],
      ['fetch, WebSocket, SSE over fetch, crypto, Intl', 'ok:full runtime', 'ok:browser'],
      ['Cookies', 'part:host jar → bearer', 'ok:browser jar'],
      ['Durable streams', 'ok:fetch consumer', 'ok:yes'],
      ['Persistent storage', 'ok:Deno KV, filesystem', 'ok:localStorage, IndexedDB'],
      ['Survives the Deno end of life', 'ok:Deno, Bun, Node', 'no:Deno-only'],
      ['Intel macOS', 'no:not built upstream', 'ok:yes'],
    ].map(([cap, a, b]) => {
      const cell = (value: string) => {
        const [state, text] = value.split(/:(.*)/s);
        const label = state === 'ok' ? 'yes' : state === 'part' ? 'partial' : 'no';
        return `<td><span class="st ${state === 'ok' ? 'ok' : state === 'part' ? 'part' : 'no'}">${label}</span> <span class="muted">${esc(text)}</span></td>`;
      };
      return `<tr><th scope="row">${esc(cap)}</th>${cell(a)}${cell(b)}</tr>`;
    }).join('')}
  </tbody></table></div>
</section>

<section aria-labelledby="work">
  <div class="sec-head"><span class="eyebrow">Rewrite, port, adapt</span><h2 id="work">What it takes</h2></div>
  <div class="grid2">
    <div class="card"><h3>Carries over unchanged</h3><ul class="tight"><li>Contracts, service code, plugins and server runtime</li><li>Components' logic: hooks, signals, context, state</li><li>SDK client, durable-stream consumer, KV, telemetry</li><li>Route modules in Fresh 3's shape (middleware → handler → page)</li></ul></div>
    <div class="card"><h3>Must be rewritten</h3><ul class="tight"><li>Leaf markup and styles: HTML tags and CSS classes become primitives with style objects</li><li>fresh-ui components (CSS) → a native collection driven by the same tokens</li><li>Any third-party DOM widget (charts, editors)</li><li>OAuth or doc pages shown in-app → system browser</li></ul></div>
    <div class="card"><h3>Adapters to build</h3><ul class="tight"><li><code>@netscript/desktop-native</code>: the Preact renderer and a native host port</li><li>Native credentials: adopt the RFC 0001 bearer contribution</li><li><code>NativeAutoUpdate</code> for non-<code>deno desktop</code> hosts</li><li>Packaging backend for <code>netscript deploy desktop --renderer gpuix</code></li></ul></div>
    <div class="card"><h3>Risks</h3><ul class="tight"><li>GPUIX is pre-1.0 with one principal maintainer and a pinned GPUI fork; the PoC hit API drift between 0.11.0 and <code>main</code></li><li>Software-rendered environments (VMs, RDP) pay full-frame redraws</li><li>Accessibility is an ARIA subset; no Intel Mac build</li><li>Larger than the webview build: 185 MB on Linux (123–133 MB on macOS and Windows) against 112 MB</li></ul></div>
  </div>
</section>

<section aria-labelledby="install">
  <div class="sec-head"><span class="eyebrow">Try it</span><h2 id="install">Installables</h2>
  <p class="prose muted">Sign in with any email and the password <code>netscript</code>. To benchmark on your machine, run the bundled bench script (Windows: <em>Run benchmark</em> in the Start menu; macOS: <code>bench.command</code>; Linux: <code>bench.sh</code>). It launches the app repeatedly and writes <code>netscript-bench-*.json</code> and <code>.md</code> to your home folder. macOS builds are ad-hoc signed: run <code>xattr -dr com.apple.quarantine NetScript.app</code> once. Windows shows a SmartScreen prompt for unsigned apps (More info → Run anyway).</p></div>
  <div class="files">
    __FILES__
  </div>
</section>

<section aria-labelledby="rfc">
  <div class="sec-head"><span class="eyebrow">Decision</span><h2 id="rfc">RFC: incubate behind four gates</h2></div>
  <p class="prose">The RFC proposes an opt-in native desktop track. It ships as a Preact renderer package, a fresh-ui native collection, the bearer credential path, an auto-update adapter and a packaging backend. The Deno Desktop webview remains the default until all four gates pass:</p>
  <div class="answers">
    <div class="answer"><span class="q">Gate 1 · not met yet</span><p>A real-GPU benchmark on Windows and macOS laptops shows active CPU at or below the webview, and confirms the memory and scaling gains. On the Windows laptop, memory and scaling hold; CPU under load is 81% against 37%.</p></div>
    <div class="answer"><span class="q">Gate 2</span><p>A GPUIX release ships clipboard and notifications, and the project agrees an upgrade policy: exact pins, plus vendoring or forking if upstream stalls.</p></div>
    <div class="answer"><span class="q">Gate 3</span><p>Accessibility meets an agreed bar: keyboard navigation and screen-reader smoke tests on macOS and Windows.</p></div>
    <div class="answer"><span class="q">Gate 4</span><p>Packaging reaches parity: signing, notarization, installers and auto-update.</p></div>
  </div>
  <p class="muted prose">Sources: run directory <code>.llm/runs/rfc-gpuix-desktop--rfc/</code> (research, PoC, evidence), Fresh 3 <code>next</code> branch, Deno/Cloudflare coverage (<a href="https://linuxiac.com/cloudflare-acquires-deno-javascript-runtime/">linuxiac</a>, <a href="https://thenewstack.io/cloudflare-acquires-deno-ryan-dahl/">The New Stack</a>).</p>
</section>
</div>
<div id="tip" role="status" aria-live="polite"></div>
<script>
(() => {
  const tip = document.getElementById('tip');
  const show = (el, x, y) => { tip.textContent = el.getAttribute('data-tip'); tip.style.left = Math.min(x + 14, innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = (y + 14) + 'px'; tip.style.opacity = '1'; };
  const hide = () => { tip.style.opacity = '0'; };
  document.querySelectorAll('.hit').forEach((el) => {
    el.setAttribute('tabindex', '0');
    el.addEventListener('pointermove', (e) => show(el, e.clientX, e.clientY));
    el.addEventListener('pointerleave', hide);
    el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); show(el, r.left + r.width / 2, r.top); });
    el.addEventListener('blur', hide);
  });
})();
</script>
`;

const files = JSON.parse(await Deno.readTextFile(`${EVIDENCE}/artifacts.json`).catch(() => '[]')) as Array<{ name: string; os: string; sizeMb: number; sha256: string; where: string }>;
const filesHtml = files.map((file) => `<div class="file"><div><b>${esc(file.os)}</b> · <code>${esc(file.name)}</code></div><span class="mono muted">${fmt(file.sizeMb)} MB</span><span class="muted">${esc(file.where)}</span><span class="hash">sha256 ${esc(file.sha256)}</span></div>`).join('');
await Deno.writeTextFile(OUT, html.replace('__FILES__', filesHtml || '<p class="muted">Artifacts not listed.</p>'));
console.log(`wrote ${OUT} (${Math.round((await Deno.stat(OUT)).size / 1024)} KB)`);
