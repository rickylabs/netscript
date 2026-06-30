import type { TriggerId } from '../domain/mod.ts';

/** Stored enabled-state override for a trigger definition. */
export type TriggerEnabledStateOverride = Readonly<{
  triggerId: TriggerId;
  enabled: boolean;
  updatedAt: string;
}>;

/** Persistent enabled-state boundary for trigger enable/disable routes. */
export interface TriggerEnabledStatePort {
  /** Return the resolved enabled state; triggers are enabled by default. */
  isEnabled(id: TriggerId): Promise<boolean>;
  /** Store or clear an enabled-state override for a trigger definition. */
  setEnabled(id: TriggerId, enabled: boolean): Promise<void>;
  /** List stored enabled-state overrides only. */
  list(): Promise<readonly TriggerEnabledStateOverride[]>;
}
