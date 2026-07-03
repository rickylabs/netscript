import { describe, it } from 'jsr:@std/testing@^1/bdd';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';

import { renderSystemdUnit, type SystemdUnitConfig } from './systemd-unit.ts';
import {
  fullUnitName,
  journalctlLogsArgs,
  systemctlDaemonReloadArgs,
  systemctlDisableArgs,
  systemctlEnableArgs,
  systemctlLifecycleArgs,
} from './systemd-command.ts';

function baseUnit(overrides: Partial<SystemdUnitConfig> = {}): SystemdUnitConfig {
  return {
    description: 'NetScript users service',
    execStart: '/opt/netscript/users/bin/users',
    workingDirectory: '/opt/netscript/users',
    environment: { PORT: '8080', NETSCRIPT_ENV: 'production' },
    after: ['network-online.target'],
    wants: ['network-online.target'],
    ...overrides,
  };
}

describe('renderSystemdUnit', () => {
  it('renders a well-formed .service unit with defaults', () => {
    const unit = renderSystemdUnit(baseUnit());

    assertStringIncludes(unit, '[Unit]');
    assertStringIncludes(unit, 'Description=NetScript users service');
    assertStringIncludes(unit, 'After=network-online.target');
    assertStringIncludes(unit, 'Wants=network-online.target');
    assertStringIncludes(unit, '[Service]');
    assertStringIncludes(unit, 'Type=simple');
    assertStringIncludes(unit, 'ExecStart=/opt/netscript/users/bin/users');
    assertStringIncludes(unit, 'WorkingDirectory=/opt/netscript/users');
    assertStringIncludes(unit, 'Environment="PORT=8080"');
    assertStringIncludes(unit, 'Environment="NETSCRIPT_ENV=production"');
    assertStringIncludes(unit, 'Restart=on-failure');
    assertStringIncludes(unit, 'RestartSec=5');
    assertStringIncludes(unit, 'TimeoutStartSec=30');
    assertStringIncludes(unit, 'TimeoutStopSec=30');
    assertStringIncludes(unit, 'StandardOutput=journal');
    assertStringIncludes(unit, 'StandardError=journal');
    assertStringIncludes(unit, '[Install]');
    assertStringIncludes(unit, 'WantedBy=multi-user.target');
  });

  it('emits User/Group/RuntimeDirectory only when provided', () => {
    const withIdentity = renderSystemdUnit(
      baseUnit({ user: 'netscript', group: 'netscript', runtimeDirectory: 'netscript-users' }),
    );
    assertStringIncludes(withIdentity, 'User=netscript');
    assertStringIncludes(withIdentity, 'Group=netscript');
    assertStringIncludes(withIdentity, 'RuntimeDirectory=netscript-users');

    const withoutIdentity = renderSystemdUnit(baseUnit());
    assertEquals(withoutIdentity.includes('User='), false);
    assertEquals(withoutIdentity.includes('Group='), false);
    assertEquals(withoutIdentity.includes('RuntimeDirectory='), false);
  });

  it('escapes quotes and backslashes in Environment values', () => {
    const unit = renderSystemdUnit(
      baseUnit({ environment: { TOKEN: 'a"b\\c' } }),
    );
    assertStringIncludes(unit, 'Environment="TOKEN=a\\"b\\\\c"');
  });

  it('honors overrides for service type, restart, and wantedBy', () => {
    const unit = renderSystemdUnit(
      baseUnit({ serviceType: 'notify', restart: 'always', restartSec: 2, wantedBy: 'default.target' }),
    );
    assertStringIncludes(unit, 'Type=notify');
    assertStringIncludes(unit, 'Restart=always');
    assertStringIncludes(unit, 'RestartSec=2');
    assertStringIncludes(unit, 'WantedBy=default.target');
  });
});

describe('systemd command builders', () => {
  it('builds the full unit name with the default prefix', () => {
    assertEquals(fullUnitName('users'), 'netscript-users.service');
    assertEquals(fullUnitName('orders', 'acme'), 'acme-orders.service');
  });

  it('builds lifecycle args', () => {
    assertEquals(systemctlLifecycleArgs('start', 'netscript-users.service'), [
      'start',
      'netscript-users.service',
    ]);
    assertEquals(systemctlLifecycleArgs('stop', 'netscript-users.service'), [
      'stop',
      'netscript-users.service',
    ]);
    assertEquals(systemctlLifecycleArgs('status', 'netscript-users.service'), [
      'status',
      'netscript-users.service',
    ]);
  });

  it('builds enable args with and without --force', () => {
    assertEquals(
      systemctlEnableArgs({
        serviceName: 'netscript-users.service',
        configPath: '/etc/systemd/system/netscript-users.service',
        force: true,
      }),
      ['enable', '--force', '/etc/systemd/system/netscript-users.service'],
    );
    assertEquals(
      systemctlEnableArgs({
        serviceName: 'netscript-users.service',
        configPath: '/etc/systemd/system/netscript-users.service',
        force: false,
      }),
      ['enable', '/etc/systemd/system/netscript-users.service'],
    );
  });

  it('builds disable and daemon-reload args', () => {
    assertEquals(systemctlDisableArgs('netscript-users.service'), [
      'disable',
      'netscript-users.service',
    ]);
    assertEquals(systemctlDaemonReloadArgs(), ['daemon-reload']);
  });

  it('builds journalctl args', () => {
    assertEquals(journalctlLogsArgs('netscript-users.service'), [
      '-u',
      'netscript-users.service',
    ]);
    assertEquals(
      journalctlLogsArgs('netscript-users.service', { lines: 100, follow: true }),
      ['-u', 'netscript-users.service', '-n', '100', '-f'],
    );
  });
});
