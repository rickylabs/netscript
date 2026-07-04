import { assertEquals } from 'jsr:@std/assert@^1';

import type { OsServicePort, OsServiceOperation } from '../ports/os-service-port.ts';
import type { ReleaseRecord } from '../../kernel/domain/deploy/rollback-convention.ts';
import {
  type ActivationFsPort,
  DirSwapActivationPort,
  type ServiceActivationOptions,
  SymlinkActivationPort,
} from './service-activation-port.ts';

interface Harness {
  readonly fs: ActivationFsPort;
  readonly service: OsServicePort;
  readonly events: string[];
  readonly files: Map<string, string>;
  readonly links: Map<string, string>;
}

function harness(seed?: { files?: Record<string, string>; links?: Record<string, string> }): Harness {
  const events: string[] = [];
  const files = new Map<string, string>(Object.entries(seed?.files ?? {}));
  const links = new Map<string, string>(Object.entries(seed?.links ?? {}));

  const fs: ActivationFsPort = {
    symlink(target, path, type) {
      events.push(`symlink ${target} -> ${path} (${type})`);
      links.set(path, target);
      return Promise.resolve();
    },
    rename(from, to) {
      events.push(`rename ${from} -> ${to}`);
      const target = links.get(from);
      if (target !== undefined) {
        links.delete(from);
        links.set(to, target);
      }
      return Promise.resolve();
    },
    readLink(path) {
      return Promise.resolve(links.get(path));
    },
    remove(path, options) {
      events.push(`remove ${path}${options?.recursive ? ' (recursive)' : ''}`);
      links.delete(path);
      files.delete(path);
      return Promise.resolve();
    },
    readTextFile(path) {
      return Promise.resolve(files.get(path));
    },
    writeTextFile(path, content) {
      events.push(`write ${path}`);
      files.set(path, content);
      return Promise.resolve();
    },
  };

  const service: OsServicePort = {
    install() {
      throw new Error('unexpected install');
    },
    run(operation: Exclude<OsServiceOperation, 'install'>, serviceName: string) {
      events.push(`service ${operation} ${serviceName}`);
      return Promise.resolve({ success: true, message: '', code: 0 });
    },
  };

  return { fs, service, events, files, links };
}

function options(h: Harness): ServiceActivationOptions {
  return {
    releasesDir: '/opt/app/releases',
    currentLink: '/opt/app/current',
    historyFile: '/opt/app/releases.json',
    serviceName: 'app.service',
    service: h.service,
    fs: h.fs,
    now: () => 1234,
  };
}

Deno.test('SymlinkActivationPort activates via atomic symlink+rename before restart', async () => {
  const h = harness();
  const port = new SymlinkActivationPort(options(h));

  await port.activate('2026-07-04T00-00-00');

  assertEquals(h.events, [
    'symlink /opt/app/releases/2026-07-04T00-00-00 -> /opt/app/current.tmp-1234 (dir)',
    'rename /opt/app/current.tmp-1234 -> /opt/app/current',
    'service stop app.service',
    'service start app.service',
  ]);
  assertEquals(h.links.get('/opt/app/current'), '/opt/app/releases/2026-07-04T00-00-00');
});

Deno.test('DirSwapActivationPort removes the old junction then recreates before restart', async () => {
  const h = harness({ links: { '/opt/app/current': '/opt/app/releases/old' } });
  const port = new DirSwapActivationPort(options(h));

  await port.activate('new');

  assertEquals(h.events, [
    'remove /opt/app/current',
    'symlink /opt/app/releases/new -> /opt/app/current (dir)',
    'service stop app.service',
    'service start app.service',
  ]);
  assertEquals(h.links.get('/opt/app/current'), '/opt/app/releases/new');
});

Deno.test('current resolves the active release id from the current link basename', async () => {
  const h = harness({ links: { '/opt/app/current': '/opt/app/releases/rel-7' } });
  const port = new SymlinkActivationPort(options(h));

  assertEquals(await port.current(), 'rel-7');
});

Deno.test('current is undefined when no current link exists', async () => {
  const h = harness();
  const port = new SymlinkActivationPort(options(h));

  assertEquals(await port.current(), undefined);
});

Deno.test('record appends to persisted history and history reads it back', async () => {
  const h = harness();
  const port = new SymlinkActivationPort(options(h));
  const first: ReleaseRecord = { id: 'a', recordedAt: 1, healthy: true };
  const second: ReleaseRecord = { id: 'b', recordedAt: 2, healthy: true };

  await port.record(first);
  await port.record(second);

  assertEquals(await port.history(), [first, second]);
});

Deno.test('prune removes each pruned release directory recursively', async () => {
  const h = harness();
  const port = new SymlinkActivationPort(options(h));

  await port.prune(['old-1', 'old-2']);

  assertEquals(h.events, [
    'remove /opt/app/releases/old-1 (recursive)',
    'remove /opt/app/releases/old-2 (recursive)',
  ]);
});
