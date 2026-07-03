/**
 * @module linux
 * Linux-specific defaults for the NetScript CLI bare-metal deploy target.
 *
 * All values here are DEFAULTS — they can be overridden via the
 * `deploy.targets.linux` section in netscript.config.ts, which is resolved into
 * `ResolvedLinuxDeployConfig`. Mirrors `constants/windows.ts` for the systemd
 * service manager the way `windows.ts` serves servy.
 */

/** Default systemd control CLI. */
export const DEFAULT_SYSTEMCTL_PATH = 'systemctl';

/** Default systemd journal reader CLI. */
export const DEFAULT_JOURNALCTL_PATH = 'journalctl';

/** Default Linux compile target triple for `deno compile`. */
export const DEFAULT_LINUX_COMPILE_TARGET = 'x86_64-unknown-linux-gnu';

/** Default systemd unit name prefix (`<prefix>-<service>.service`). */
export const DEFAULT_LINUX_UNIT_PREFIX = 'netscript';

/** Default base installation directory for NetScript applications on Linux. */
export const DEFAULT_LINUX_INSTALL_BASE = '/opt/netscript';

/** Default runtime state directory (systemd `RuntimeDirectory` root). */
export const DEFAULT_LINUX_RUNTIME_DIR = '/run/netscript';

/** Default `[Unit] After=` ordering dependencies. */
export const DEFAULT_SYSTEMD_AFTER = ['network-online.target'] as const;

/** Default `[Unit] Wants=` weak dependencies. */
export const DEFAULT_SYSTEMD_WANTS = ['network-online.target'] as const;

/** Default `[Install] WantedBy=` target. */
export const DEFAULT_SYSTEMD_WANTED_BY = 'multi-user.target';

/** Default `[Service] Type=`. */
export const DEFAULT_SYSTEMD_SERVICE_TYPE = 'simple';

/** Default `[Service] Restart=` policy. */
export const DEFAULT_SYSTEMD_RESTART = 'on-failure';

/** Default `[Service] RestartSec=` seconds. */
export const DEFAULT_SYSTEMD_RESTART_SEC = 5;

/** Default `[Service] TimeoutStartSec=` seconds (parity with servy StartTimeout). */
export const DEFAULT_SYSTEMD_START_TIMEOUT_SEC = 30;

/** Default `[Service] TimeoutStopSec=` seconds (parity with servy StopTimeout). */
export const DEFAULT_SYSTEMD_STOP_TIMEOUT_SEC = 30;
