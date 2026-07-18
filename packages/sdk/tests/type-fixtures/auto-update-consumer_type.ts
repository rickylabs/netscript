import {
  type AutoUpdateApplyMode,
  type AutoUpdatePolicy,
  type AutoUpdateReadyEvent,
  type AutoUpdateRollbackEvent,
  type AutoUpdateStartResult,
  DEFAULT_RELEASE_CHANNEL,
  startAutoUpdate,
} from '@netscript/sdk/auto-update';

const policy: AutoUpdatePolicy = {
  checkOnLaunch: true,
  intervalMs: 60 * 60 * 1_000,
};

function handleReady(event: AutoUpdateReadyEvent): void {
  const mode: AutoUpdateApplyMode = event.applyMode;
  if (event.applyMode === 'manual') {
    const installerUrl: string = event.manualUpdateUrl;
    void installerUrl;
  } else {
    const automaticVersion: string = event.version;
    void automaticVersion;
  }
  void mode;
}

function handleRollback(event: AutoUpdateRollbackEvent): void {
  const reason: string = event.reason;
  const currentVersion: string = event.currentVersion;
  void reason;
  void currentVersion;
}

const result: AutoUpdateStartResult = startAutoUpdate({
  release: {
    baseUrl: 'https://releases.example.com/my-app',
    channel: DEFAULT_RELEASE_CHANNEL,
    publicKey: 'base64-ed25519-public-key',
    manualUpdateUrl: 'https://example.com/downloads/my-app',
  },
  policy,
  onUpdateReady: handleReady,
  onRollback: handleRollback,
});

if (result.status === 'disabled') {
  const reason: 'not-desktop' | 'missing-version' | 'missing-updater' = result.reason;
  void reason;
} else {
  const updateUrl: string = result.updateUrl;
  if (result.status === 'scheduled') {
    const firstCheckInMs: number = result.firstCheckInMs;
    void firstCheckInMs;
  }
  void updateUrl;
}
