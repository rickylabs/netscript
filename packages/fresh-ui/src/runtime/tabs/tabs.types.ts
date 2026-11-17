import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the tabs root part. */
export type TabsRootElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tabs list part. */
export type TabsListElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tabs trigger part. */
export type TabsTriggerElementProps =
  & preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
/** DOM attributes returned for the tabs content part. */
export type TabsContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

/** Controlled and initial state for the tabs hook. */
export interface UseTabsOptions {
  /** Whether focusing a tab also activates its panel. */
  activationMode?: 'automatic' | 'manual';
  /** Initial selection when value is uncontrolled. */
  defaultValue?: string;
  /** Stable base identifier for accessible part relationships. */
  id?: string;
  /** Whether keyboard navigation wraps at the collection boundaries. */
  loop?: boolean;
  /** Receives selection changes requested by user interaction. */
  onValueChange?: (value: string) => void;
  /** Sets the axis used for layout and keyboard navigation. */
  orientation?: 'horizontal' | 'vertical';
  /** Controlled selected item value or values. */
  value?: string;
}

export interface UseTabsReturn {
  getContentProps: (
    value: string,
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => TabsContentElementProps;
  getListProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => TabsListElementProps;
  getRootProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => TabsRootElementProps;
  getTriggerProps: (
    value: string,
    props?: preact.JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => TabsTriggerElementProps;
  orientation: TabsOrientation;
  value: string;
}

/** Props for the compound tabs root component. */
export type TabsRootProps = UseTabsOptions & {
  children: FreshUiChildren;
};

/** Props for the tabs list component. */
export type TabsListProps = TabsListElementProps & {
  children: FreshUiChildren;
};

/** Props for a tabs trigger component. */
export type TabsTriggerProps = TabsTriggerElementProps & {
  children: FreshUiChildren;
  value: string;
};

/** Props for a tabs content component. */
export type TabsContentProps = TabsContentElementProps & {
  children: FreshUiChildren;
  value: string;
};
