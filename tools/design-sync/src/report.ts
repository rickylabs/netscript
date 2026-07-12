/**
 * Compact terminal report: parity table + trap table + verdict.
 */
import type { ParityReport, TrapCheck } from './types.ts';

function pad(s: string | number, w: number): string {
  return String(s).padEnd(w);
}

export function printReport(parity: ParityReport, traps: TrapCheck[], extra: string[]): boolean {
  console.log('\nParityReport');
  console.log(
    `  ${pad('kind', 12)} ${pad('manifest', 9)} ${pad('converted', 10)} ${
      pad('cards', 6)
    } excluded`,
  );
  for (const r of parity.rows) {
    console.log(
      `  ${pad(r.kind, 12)} ${pad(r.manifest, 9)} ${pad(r.converted, 10)} ${
        pad(r.cards, 6)
      } ${r.excluded}`,
    );
  }
  if (parity.excluded.length) {
    console.log('  excluded units:');
    for (const e of parity.excluded) console.log(`    - ${e.unit}: ${e.reason}`);
  }
  if (parity.missing.length) {
    console.log('  MISSING:');
    for (const m of parity.missing) console.log(`    ! ${m}`);
  }

  console.log('\nTrapChecks');
  for (const t of traps) {
    console.log(`  [${t.result}] ${pad(t.id, 14)} ${t.evidence}`);
    for (const d of t.details.slice(0, 12)) console.log(`      - ${d}`);
    if (t.details.length > 12) console.log(`      … ${t.details.length - 12} more`);
  }

  for (const line of extra) console.log(line);

  const failed = traps.filter((t) => t.result === 'FAIL').map((t) => t.id);
  const ok = parity.ok && failed.length === 0;
  console.log(
    ok
      ? '\ndesign-sync: PASS (parity green, no FAIL traps)'
      : `\ndesign-sync: FAIL (${[...(parity.ok ? [] : ['parity']), ...failed].join(', ')})`,
  );
  return ok;
}
