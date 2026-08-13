import { assertEquals } from '@std/assert';
import { join } from '@std/path';

import { executeGate } from './command-lifecycle.ts';
import type { GateReceipt, GateRequest } from './contract.ts';
import { AtomicFileReceiptStore, LifecycleMemoryStore } from './receipt-store.ts';

function request(argv: string[]): GateRequest {
  return {
    gateId: 'test',
    invocationId: 'test-1',
    argv,
    cwd: Deno.cwd(),
    gitHead: 'abc',
    actualGitHead: 'abc',
    timeoutMs: 5_000,
    runnerIdentity: 'test',
    attempt: 1,
  };
}

Deno.test('command lifecycle claims before spawn and settles terminal receipt', async () => {
  const root = await Deno.makeTempDir();
  try {
    const path = join(root, 'receipt.json');
    const result = await executeGate(
      request([Deno.execPath(), 'eval', 'console.log("ok")']),
      { store: new AtomicFileReceiptStore(path) },
    );
    assertEquals(result.outcome, 'PASS');
    assertEquals(JSON.parse(await Deno.readTextFile(path)).outcome, 'PASS');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('command lifecycle replays one same-id promise', async () => {
  const root = await Deno.makeTempDir();
  try {
    const memory = new LifecycleMemoryStore<GateReceipt>();
    const options = { store: new AtomicFileReceiptStore(join(root, 'receipt.json')), memory };
    const input = request([Deno.execPath(), 'eval', 'console.log("ok")']);
    const [left, right] = await Promise.all([
      executeGate(input, options),
      executeGate(input, options),
    ]);
    assertEquals(left.requestHash, right.requestHash);
    assertEquals(memory.size, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('command lifecycle emits SKIPPED without spawning', async () => {
  const root = await Deno.makeTempDir();
  try {
    const result = await executeGate(
      request([`must-not-spawn-${crypto.randomUUID()}`]),
      { store: new AtomicFileReceiptStore(join(root, 'receipt.json')), skipReason: 'policy skip' },
    );
    assertEquals(result.outcome, 'SKIPPED');
    assertEquals(result.reason, 'policy skip');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('command lifecycle validates and hashes a fresh JSON child report', async () => {
  const root = await Deno.makeTempDir();
  try {
    const report = join(root, 'child.json');
    const script = `await Deno.writeTextFile(${JSON.stringify(report)}, '{"ok":true}\\n')`;
    const result = await executeGate(
      request([Deno.execPath(), 'eval', script]),
      {
        store: new AtomicFileReceiptStore(join(root, 'receipt.json')),
        childReport: report,
      },
    );
    assertEquals(result.outcome, 'PASS');
    assertEquals(result.childReportEvidence?.path, report);
    assertEquals(result.childReportEvidence?.sha256.length, 64);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('command lifecycle fails closed on missing, malformed, or stale child reports', async () => {
  for (const mode of ['missing', 'malformed', 'stale'] as const) {
    const root = await Deno.makeTempDir();
    try {
      const report = join(root, 'child.json');
      if (mode === 'stale') await Deno.writeTextFile(report, '{"old":true}\n');
      const script = mode === 'malformed'
        ? `await Deno.writeTextFile(${JSON.stringify(report)}, 'not json')`
        : 'console.log("done")';
      const result = await executeGate(
        request([Deno.execPath(), 'eval', script]),
        {
          store: new AtomicFileReceiptStore(join(root, 'receipt.json')),
          childReport: report,
        },
      );
      assertEquals(result.outcome, 'FAIL', mode);
      assertEquals(result.exitCode, 1, mode);
      assertEquals(result.reason?.includes('Child report'), true, mode);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  }
});
