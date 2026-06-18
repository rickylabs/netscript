import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren, FreshUiElementProps } from '../_internal/public-props.ts';

export type TabsRootElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TabsListElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TabsTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type TabsContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

export interface UseTabsOptions {
  activationMode?: 'automatic' | 'manual';
  defaultValue?: string;
  id?: string;
  loop?: boolean;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  value?: string;
}

export interface UseTabsReturn {
  getContentProps: (
    value: string,
    props?: JSX.HTMLAttributes<HTMLDivElement>,
  ) => TabsContentElementProps;
  getListProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TabsListElementProps;
  getRootProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => TabsRootElementProps;
  getTriggerProps: (
    value: string,
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => TabsTriggerElementProps;
  orientation: TabsOrientation;
  value: string;
}

/** Props for the compound tabs root component. */
export type TabsRootProps = FreshUiElementProps & {
  activationMode?: 'automatic' | 'manual';
  children: FreshUiChildren;
  defaultValue?: string;
  loop?: boolean;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  value?: string;
};

/** Props for the tabs list component. */
export type TabsListProps = FreshUiElementProps & {
  children: FreshUiChildren;
};

/** Props for a tabs trigger component. */
export type TabsTriggerProps = FreshUiElementProps & {
  children: FreshUiChildren;
  value: string;
};

/** Props for a tabs content component. */
export type TabsContentProps = FreshUiElementProps & {
  children: FreshUiChildren;
  value: string;
};
