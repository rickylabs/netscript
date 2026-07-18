/** Exact Aspire service-discovery key injected into the desktop process. */
export const REMOTE_SERVICE_ENV = 'services__remote__http__0';

/** Path written only after the renderer receives and acknowledges a remote response. */
export const RENDERER_EVIDENCE_ENV = 'NETSCRIPT_DESKTOP_E2E_EVIDENCE';

/** Path receiving update-ready or rollback callback evidence. */
export const UPDATE_EVIDENCE_ENV = 'NETSCRIPT_DESKTOP_E2E_UPDATE_EVIDENCE';

/** Expected updater callback before the fixture closes. */
export const EXPECTED_UPDATE_EVENT_ENV = 'NETSCRIPT_DESKTOP_E2E_EXPECT_EVENT';

/** Version baked into the current fixture package. */
export const FIXTURE_VERSION = '1.0.0';
