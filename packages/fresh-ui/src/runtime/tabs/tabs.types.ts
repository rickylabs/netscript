import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

export type TabsRootElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TabsListElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type TabsTriggerElementProps =
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  & MachineDataAttributes;
export type TabsContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

export interface UseTabsOptions {
  activationMode?: TabsActivationMode;
  defaultValue?: string;
  id?: string;
  loop?: boolean;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
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

export interface TabsRootProps extends UseTabsOptions {
  children: ComponentChildren;
}

export interface TabsListProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
}

export interface TabsTriggerProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  value: string;
}

export interface TabsContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
  value: string;
}
