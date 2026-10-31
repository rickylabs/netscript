import { MessageScroller } from '../../registry/components/ui/message-scroller.tsx';
import { Questionnaire } from '../../registry/components/ui/questionnaire.tsx';
import type { ContractKeyboardFixture, ContractRenderFixture } from './style-provider.ts';

const options = [{ value: 'postgres', label: 'PostgreSQL', shortcut: '1' }, {
  value: 'sqlite',
  label: 'SQLite',
  shortcut: '2',
}, { value: 'kv', label: 'Deno KV', disabled: true }];

export const aiInteractionFixtures: readonly ContractRenderFixture[] = [
  ...[false, true].map((followEnd) => ({
    component: 'message-scroller',
    scenario: 'ssr-follow-' + followEnd,
    props: ['label', 'followEnd', 'endThreshold', 'scrollLabel', 'children', 'Item.children'],
    parts: ['item'],
    attributes: ['data-scrollable'],
    render: () => (
      <MessageScroller
        label='Conversation'
        followEnd={followEnd}
        endThreshold={1}
        style={{ height: 320 }}
      >
        <MessageScroller.Item>
          <a href='#source'>Source</a>
        </MessageScroller.Item>
      </MessageScroller>
    ),
  })),
  ...(['question', 'freeform', 'complete'] as const).flatMap((step) =>
    [false, true].map((multiple) => ({
      component: 'questionnaire',
      scenario: step + '/' + multiple,
      props: [
        'title',
        'description',
        'error',
        'progress',
        'actions',
        'children',
        'options',
        'step',
        'multiple',
        'name',
        'disabled',
        'value',
        'defaultValue',
        'onValueChange',
        'text',
        'defaultText',
        'onTextChange',
        'placeholder',
      ],
      parts: [
        'description',
        'error',
        'progress',
        'actions',
        'content',
        ...(step === 'complete' ? [] : ['input']),
        ...(step === 'question' ? ['choices', 'choice', 'shortcut', 'label', 'indicator'] : []),
      ],
      attributes: ['data-step', ...(step === 'question' ? ['data-multiple', 'data-state'] : [])],
      render: () => (
        <Questionnaire
          title='Which database?'
          description='Choose your project storage'
          error='Review your answer'
          step={step}
          multiple={multiple}
          options={options}
          defaultValue={['postgres']}
          defaultText='Local development'
          name='database'
          progress={<progress aria-label='Questions completed' max={2} value={1} />}
          actions={<button type='submit'>Submit answer</button>}
        >
          Host instructions
        </Questionnaire>
      ),
    }))
  ),
];
export const aiInteractionKeyboard: readonly ContractKeyboardFixture[] = [
  {
    component: 'message-scroller',
    scenario: 'message-scroller/native-pinned-scroll',
    keys: ['Tab', 'ArrowDown', 'PageDown', 'PageUp', 'Home', 'End', 'Enter', 'Space'],
    expectation:
      'Native viewport keys scroll; pinned growth follows, reading does not jump, latest button retains focus after activation.',
  },
  {
    component: 'questionnaire',
    scenario: 'questionnaire/native-answer-form',
    keys: ['Tab', 'Shift+Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'],
    expectation:
      'Native radios/checkboxes/textarea and submit button retain keyboard behavior; controlled refusal and native reset preserve accepted state.',
  },
];
