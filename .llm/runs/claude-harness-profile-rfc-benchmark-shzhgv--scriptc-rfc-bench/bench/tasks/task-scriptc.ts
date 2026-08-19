/**
 * Subjects B/C — scriptc-compiled static binary (B) and executable-control (C, same binary).
 *
 * Node globals only: no `Deno.*` anywhere (SC0001 fires even behind `typeof` guards at
 * scriptc 0.0.32 — research F3). No Math transcendentals (SC2012), no spread-after-props
 * (SC1090). MINSTD LCG core duplicated verbatim per worklog Design §1.
 *
 * Build: scriptc build task-scriptc.ts -o build/task-scriptc-native
 */

import { readFileSync } from 'node:fs';

const MINSTD_MULTIPLIER = 48271;
const MINSTD_MODULUS = 2147483647;
const ACC_MODULUS = 1000000007;

function runLcg(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * MINSTD_MULTIPLIER) % MINSTD_MODULUS;
    acc = (acc + state) % ACC_MODULUS;
  }
  return acc;
}

function readVmHwmKb(): number | null {
  try {
    const status = readFileSync('/proc/self/status', 'utf8');
    const lines = status.split('\n');
    for (const line of lines) {
      if (line.startsWith('VmHWM:')) {
        const kb = Number(line.replace(/[^0-9]/g, ''));
        return Number.isFinite(kb) ? kb : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

const n = Number(process.argv[2] ?? '100000');
const seed = Number(process.argv[3] ?? '42');
const acc = runLcg(n, seed);
const correlationId = process.env.CORRELATION_ID ?? null;
console.log(JSON.stringify({ acc, n, seed, correlationId, vmHwmKb: readVmHwmKb() }));
