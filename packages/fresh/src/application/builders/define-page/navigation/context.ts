import { type Context, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type {
  AnyDefinePageTypeState,
  DefinePageLayoutContextBase,
  DefinePageRouteNav,
  DefinePageSlot,
  PathParamSchema,
  SearchParamSchema,
  UnknownRecord,
} from '../types.ts';

/** Context value shared by define-page navigation hooks and links. */
export interface DefinePageNavigationContextValue {
  readonly routePattern: string;
  readonly pathSchema?: PathParamSchema<object>;
  readonly searchSchema?: SearchParamSchema<object>;
  readonly runtimeContext: DefinePageLayoutContextBase<AnyDefinePageTypeState, boolean>;
  readonly slots: Record<string, DefinePageSlot<UnknownRecord>>;
  readonly nav: DefinePageRouteNav<object, object>;
}

/** Preact context used by define-page navigation helpers. */
export const DefinePageNavigationContext: Context<DefinePageNavigationContextValue | null> =
  createContext(null as DefinePageNavigationContextValue | null) as Context<
    DefinePageNavigationContextValue | null
  >;

/** Read the required define-page navigation context or throw a caller-facing error. */
export function useRequiredNavigationContext(): DefinePageNavigationContextValue {
  const navigationContext = useContext(DefinePageNavigationContext) as
    | DefinePageNavigationContextValue
    | null;

  if (!navigationContext) {
    throw new Error(
      'definePage() hooks must be rendered inside a definePage() route render tree.',
    );
  }

  return navigationContext;
}

/** Read the navigation context when hooks are available, otherwise return null. */
export function readNavigationContext(): DefinePageNavigationContextValue | null {
  try {
    return useContext(DefinePageNavigationContext) as DefinePageNavigationContextValue | null;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (
        error.message.includes('Hook can only be invoked') ||
        error.message.includes("reading 'context'")
      )
    ) {
      return null;
    }

    throw error;
  }
}
