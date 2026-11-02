/**
 * @component Stepper
 * @layer 2
 * @depends theme-seed
 * @description Ordered progress steps; only actual links participate in native keyboard navigation.
 */
import type { ComponentChildren, JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';

export interface StepperStep {
  id: string;
  title: ComponentChildren;
  description?: ComponentChildren;
  status: 'complete' | 'current' | 'upcoming' | 'error';
  href?: string;
}
export interface StepperProps extends Omit<JSX.HTMLAttributes<HTMLOListElement>, 'class'> {
  steps: readonly StepperStep[];
  orientation?: 'horizontal' | 'vertical';
  description?: boolean;
  connector?: boolean;
  class?: string;
}

/** aria-current belongs to the current step; status is also readable without color. */
export function Stepper(
  {
    steps,
    orientation = 'horizontal',
    description = true,
    connector = true,
    class: className,
    ...props
  }: StepperProps,
): VNode {
  if (steps.filter((step) => step.status === 'current').length > 1) {
    throw new RangeError('Only one step may be current.');
  }
  return (
    <ol
      {...props}
      class={cn('ns-stepper', className)}
      role='list'
      data-scope='stepper'
      data-part='root'
      data-orientation={orientation}
    >
      {steps.map((step, index) => (
        <li
          key={step.id}
          data-scope='stepper'
          data-part='step'
          data-status={step.status}
          aria-current={step.status === 'current' ? 'step' : undefined}
        >
          <span data-scope='stepper' data-part='indicator' aria-hidden='true'>
            {step.status === 'complete' ? '✓' : step.status === 'error' ? '×' : index + 1}
          </span>
          <span data-scope='stepper' data-part='body'>
            {step.href
              ? <a href={step.href} data-scope='stepper' data-part='title'>{step.title}</a>
              : <span data-scope='stepper' data-part='title'>{step.title}</span>}
            <span class='ns-stepper__sr'>({step.status})</span>
            {description && step.description && (
              <span data-scope='stepper' data-part='description'>{step.description}</span>
            )}
          </span>
          {connector && index < steps.length - 1 && (
            <span data-scope='stepper' data-part='connector' aria-hidden='true' />
          )}
        </li>
      ))}
    </ol>
  );
}
