/** Lifecycle statuses returned by the Fresh Desktop RPC binding. */
export const DESKTOP_RPC_BINDING_STATUSES = {
  BOUND: 'bound',
  DISABLED: 'disabled',
} as const;

/** Reasons that Desktop RPC activation can be disabled without side effects. */
export const DESKTOP_RPC_DISABLED_REASONS = {
  NOT_DESKTOP: 'not-desktop',
  MISSING_WINDOW: 'missing-window',
} as const;
