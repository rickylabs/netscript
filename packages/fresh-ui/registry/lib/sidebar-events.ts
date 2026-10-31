/** Private DOM interoperability for a server shell and an independently hydrated toggle. */
export const SIDEBAR_SELECTORS = {
  sidebar: '[data-sidebar]',
  backdrop: '[data-sidebar-backdrop]',
  shell: '[data-scope="app-shell"][data-part="root"]',
  disclosure: 'details.ns-dashboard__disclosure',
} as const;

/** Requests stay on one shell root; notifications describe actual native state. */
export const SIDEBAR_EVENTS = {
  request: 'netscript:sidebar-request',
  state: 'netscript:sidebar-state',
} as const;

/** The controls target is the currently mounted disclosure, aside or dialog. */
export interface SidebarState {
  open: boolean;
  controls: string;
}

/** Reject malformed external requests rather than coercing arbitrary event payloads. */
export function sidebarRequest(event: Event): boolean | undefined {
  const detail: unknown = (event as CustomEvent<unknown>).detail;
  return typeof detail === 'object' && detail !== null && 'open' in detail &&
      typeof detail.open === 'boolean'
    ? detail.open
    : undefined;
}

/** Read physical state so a controlled refusal and a platform close stay truthful. */
export function readSidebarState(root: Element): SidebarState | undefined {
  const target = [...root.querySelectorAll<HTMLDetailsElement | HTMLDialogElement | HTMLElement>(
    `${SIDEBAR_SELECTORS.disclosure}, dialog.ns-dashboard__drawer, aside[data-sidebar]`,
  )].find((element) => element.closest(SIDEBAR_SELECTORS.shell) === root);
  if (!target?.isConnected || !target.id) return undefined;
  return {
    controls: target.id,
    open: target instanceof HTMLDetailsElement || target instanceof HTMLDialogElement
      ? target.open
      : true,
  };
}

/** Notify only toggles connected to this shell; nothing bubbles to an outer shell. */
export function announceSidebarState(root: Element): void {
  root.dispatchEvent(new CustomEvent(SIDEBAR_EVENTS.state, { detail: readSidebarState(root) }));
}
