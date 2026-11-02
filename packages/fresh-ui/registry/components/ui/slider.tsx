/**
 * @component Slider
 * @layer 2
 * @depends theme-seed
 * @description One or two native range inputs own keyboard, stepping and form semantics.
 */
import type { JSX, VNode } from 'preact';
import { useState } from 'preact/hooks';
import { cn } from '../../lib/cn.ts';

/** Numeric thumb values are separate from the design's value-label visibility boolean. */
export interface SliderProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'onChange'> {
  label: string;
  labels?: readonly string[];
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  thumbs?: 1 | 2;
  values?: readonly number[];
  defaultValues?: readonly number[];
  onValuesChange?: (values: readonly number[]) => void;
  orientation?: 'horizontal' | 'vertical';
  state?: 'rest' | 'hover' | 'focus' | 'disabled';
  disabled?: boolean;
  value?: boolean;
  class?: string;
}

/** Native range keys adjust only the focused thumb; the thumbs cannot cross. */
export function Slider({
  label,
  labels,
  name,
  min = 0,
  max = 100,
  step = 1,
  thumbs = 1,
  values,
  defaultValues,
  onValuesChange,
  orientation = 'horizontal',
  state = 'rest',
  disabled = false,
  value: showValue = false,
  class: className,
  ...props
}: SliderProps): VNode {
  const [local, setLocal] = useState(defaultValues ?? (thumbs === 2 ? [min, max] : [min]));
  const current = values ?? local;
  if (current.some((point) => !Number.isFinite(point))) {
    throw new RangeError('Slider values must be finite.');
  }
  if (
    !Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(step) ||
    step <= 0
  ) throw new RangeError('Slider requires finite min < max and positive step.');
  const points = Array.from(
    { length: thumbs },
    (_, index) => Math.max(min, Math.min(max, current[index] ?? min)),
  ).sort((a, b) => a - b);
  const unavailable = disabled || state === 'disabled';
  const start = thumbs === 2 ? (points[0] - min) / (max - min) * 100 : 0;
  const end = (points[thumbs - 1] - min) / (max - min) * 100;
  return (
    <div
      {...props}
      class={cn('ns-slider', className)}
      data-scope='slider'
      data-part='root'
      data-orientation={orientation}
      data-thumbs={thumbs}
      data-state={unavailable ? 'disabled' : state}
    >
      <div class='ns-slider__track' data-scope='slider' data-part='track'>
        <span
          data-scope='slider'
          data-part='range'
          style={orientation === 'horizontal'
            ? { insetInlineStart: `${start}%`, inlineSize: `${end - start}%` }
            : { insetBlockEnd: `${start}%`, blockSize: `${end - start}%` }}
        />
      </div>
      {points.map((point, index) => (
        <input
          key={index}
          type='range'
          // At coincident upper values, the lower thumb must remain grabbable.
          style={{
            zIndex: thumbs === 2 && points[0] === points[1] && points[0] > (min + max) / 2
              ? thumbs - index
              : index + 1,
          }}
          value={point}
          step={step}
          min={min}
          max={max}
          aria-valuemin={thumbs === 2 && index === 1 ? points[0] : min}
          aria-valuemax={thumbs === 2 && index === 0 ? points[1] : max}
          name={name ? thumbs === 2 ? `${name}[${index}]` : name : undefined}
          aria-label={labels?.[index] ?? (thumbs === 2 ? `${label} ${index + 1}` : label)}
          aria-orientation={orientation}
          disabled={unavailable}
          data-scope='slider'
          data-part='thumb'
          onInput={(event) => {
            const next = [...points];
            next[index] = Math.max(
              index === 1 ? points[0] : min,
              Math.min(
                thumbs === 2 && index === 0 ? points[1] : max,
                event.currentTarget.valueAsNumber,
              ),
            );
            event.currentTarget.value = String(values === undefined ? next[index] : point);
            if (values === undefined) setLocal(next);
            onValuesChange?.(next);
          }}
        />
      ))}
      {showValue && (
        <output data-scope='slider' data-part='value-label'>{points.join(' – ')}</output>
      )}
    </div>
  );
}
