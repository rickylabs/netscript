/** A renderable child accepted by a keyed Fresh partial. */
export type ComponentChild = object | string | number | bigint | boolean | null | undefined;

/** One renderable child or an ordered collection of children. */
export type ComponentChildren = ComponentChild | ComponentChild[];

/** A route mutation accepted by the partial-navigation coordinator. */
export interface RouteChange {
  /** History operation that changed the current route. */
  readonly kind: 'push' | 'replace' | 'pop';
  /** Absolute route URL after the accepted mutation. */
  readonly url: URL;
  /** History state associated with the accepted mutation. */
  readonly state: unknown;
}

/** Explicit lifecycle for Fresh partial-navigation ordering. */
export interface PartialNavigationCoordinator {
  /**
   * Activate a same-origin URL through Fresh's client-navigation link contract.
   *
   * @param href - Absolute or document-relative URL to activate.
   * @throws {TypeError} When `href` resolves to a different origin.
   */
  navigate(href: string | URL): void;

  /**
   * Observe accepted route mutations.
   *
   * @param listener - Callback invoked after an accepted history mutation.
   * @returns A function that removes this subscription once.
   */
  subscribe(listener: (change: RouteChange) => void): () => void;

  /**
   * Release this installation handle.
   *
   * Final disposal restores wrappers still owned by the package and waits for
   * every in-flight partial body to reach EOF. A server that never finishes a
   * body therefore keeps this promise pending.
   *
   * @returns A promise that settles after final owned response drains finish.
   */
  dispose(): Promise<void>;
}

/** Props for a Fresh partial whose reconciliation identity follows its name. */
export interface KeyedPartialProps {
  /** Fresh partial name and native Preact key. */
  readonly name: string;
  /** How Fresh applies matching response content. */
  readonly mode?: 'replace' | 'append' | 'prepend';
  /** Content rendered inside the partial boundary. */
  readonly children?: ComponentChildren;
}
