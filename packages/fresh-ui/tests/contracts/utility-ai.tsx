import { Marker } from '../../registry/components/ui/marker.tsx';
import { Trace } from '../../registry/components/ui/trace.tsx';
import { Attachment } from '../../registry/components/ui/attachment.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

export const aiFixtures: readonly ContractRenderFixture[] = [
  ...(['default', 'border', 'separator'] as const).map((variant) => ({
    component: 'marker',
    scenario: variant,
    props: ['variant', 'icon', 'label', 'children'],
    parts: ['icon'],
    attributes: ['data-variant'],
    render: () => <Marker variant={variant} icon='ⓘ' label='Session restored'>Fallback</Marker>,
  })),
  ...(['running', 'done', 'error'] as const).map((status) => ({
    component: 'trace',
    scenario: 'aggregate-' + status,
    props: ['status', 'statusLabel', 'title', 'duration', 'children'],
    parts: ['header', 'title', 'duration'],
    attributes: ['data-status'],
    render: () => (
      <Trace status={status} title='Agent trace' duration='3.8s'>
        <Trace.Line title='Plan answer' />
      </Trace>
    ),
  })),
  ...(['done', 'running', 'pending', 'error'] as const).flatMap((status) =>
    [false, true].map((open) => ({
      component: 'trace',
      scenario: status + '/' + open,
      props: [
        'Line.title',
        'Line.status',
        'Line.statusLabel',
        'Line.description',
        'Line.duration',
        'Line.open',
        'Line.defaultOpen',
        'Line.collapsible',
        'Line.connector',
        'Line.onOpenChange',
        'Line.children',
      ],
      parts: [
        'line',
        'icon',
        'title',
        'description',
        'duration',
        'disclosure',
        'collapsible-trigger',
        'collapsible-content',
        'connector',
      ],
      attributes: ['data-status', 'data-open', 'data-collapsible', 'data-connector'],
      render: () => (
        <Trace>
          <Trace.Line
            title='Search docs'
            status={status}
            collapsible
            open={open}
            description='Two sources found'
            duration='312ms'
          >
            <a href='#sources'>Read sources</a>
          </Trace.Line>
        </Trace>
      ),
    }))
  ),
  ...(['idle', 'uploading', 'processing', 'error', 'done'] as const).flatMap((state) =>
    (['default', 'sm', 'xs'] as const).flatMap((size) =>
      (['horizontal', 'vertical'] as const).map((orientation) => ({
        component: 'attachment',
        scenario: state + '/' + size + '/' + orientation,
        props: [
          'title',
          'description',
          'media',
          'actions',
          'progress',
          'state',
          'stateLabel',
          'size',
          'orientation',
        ],
        parts: [
          'media',
          'description',
          'actions',
          ...(state === 'idle' ? [] : ['state-label', 'state-icon']),
        ],
        attributes: ['data-state', 'data-size', 'data-orientation'],
        render: () => (
          <Attachment
            title='report.pdf'
            description='PDF · 248 KB'
            media='PDF'
            state={state}
            size={size}
            orientation={orientation}
            progress={<progress aria-label='Upload progress' max={100} value={64} />}
            actions={<button type='button'>Remove report</button>}
          />
        ),
      }))
    )
  ),
];
export const aiKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'marker',
    scenario: 'marker/native-child-focus',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation:
      'Presentation is skipped; supplied native controls keep their own keyboard behavior.',
  },
  {
    component: 'trace',
    scenario: 'trace/native-disclosure',
    keys: ['Enter', 'Space', 'Tab', 'Shift+Tab'],
    expectation:
      'Native summaries propose accepted/refused state once, and collapsed output leaves the tab order.',
  },
  {
    component: 'attachment',
    scenario: 'attachment/native-actions',
    keys: ['Tab', 'Shift+Tab', 'Enter', 'Space'],
    expectation: 'Native actions activate independently; changing state preserves action focus.',
  },
];
