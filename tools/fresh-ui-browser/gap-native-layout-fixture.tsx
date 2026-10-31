import { useState } from 'preact/hooks';
import { ScrollArea } from '../../packages/fresh-ui/registry/components/ui/scroll-area.tsx';
import { AspectRatio } from '../../packages/fresh-ui/registry/components/ui/aspect-ratio.tsx';
import { Direction } from '../../packages/fresh-ui/registry/components/ui/direction.tsx';
import { ToggleGroup } from '../../packages/fresh-ui/registry/components/ui/toggle-group.tsx';

/** Native layout boundaries composed with real child controls. */
export function NativeLayouts() {
  const [plays, setPlays] = useState(0);
  const choices = [{ value: 'first', label: 'First' }, { value: 'second', label: 'Second' }];
  return (
    <>
      <h2>Native layout examples</h2>
      {(['vertical', 'horizontal', 'both'] as const).map((orientation) => (
        <section
          key={orientation}
          id={`native-scroll-${orientation}`}
          aria-label={`${orientation} scroll example`}
        >
          <button type='button' class='before-scroll'>Before {orientation}</button>
          <ScrollArea
            label={`${orientation} activity`}
            orientation={orientation}
            style={{ width: 'min(320px, 100%)', height: 200 }}
          >
            <div
              style={{
                width: orientation === 'vertical' ? undefined : 640,
                height: orientation === 'horizontal' ? undefined : 640,
              }}
            >
              <a href='#activity'>Activity details</a>
              {Array.from(
                { length: orientation === 'horizontal' ? 1 : 12 },
                (_, index) => <p key={index}>Activity {index + 1}: order updated</p>,
              )}
            </div>
          </ScrollArea>
          <button type='button' class='after-scroll'>After {orientation}</button>
        </section>
      ))}
      <section id='native-scroll-rtl' aria-label='Local RTL scroll example'>
        <Direction as='div' dir='rtl'>
          <ScrollArea
            label='RTL activity'
            orientation='horizontal'
            style={{ width: 'min(320px, 100%)', height: 140 }}
          >
            <div style={{ width: 640 }}>
              <a href='#rtl-activity'>RTL activity details</a>
            </div>
          </ScrollArea>
        </Direction>
      </section>
      <section id='native-ratios' aria-label='Aspect ratio examples'>
        {(['16:9', '4:3', '1:1', '21:9'] as const).map((ratio) => (
          <div key={ratio} style={{ width: 'min(336px, 100%)', marginBlock: 16 }}>
            <button type='button' class='before-ratio'>Before {ratio}</button>
            <AspectRatio ratio={ratio}>
              <button
                type='button'
                onClick={() =>
                  setPlays((n) =>
                    n + 1
                  )}
              >
                Play {ratio}
              </button>
            </AspectRatio>
            <button type='button' class='after-ratio'>After {ratio}</button>
          </div>
        ))}
        <output aria-label='Media plays'>{plays}</output>
      </section>
      <section id='native-direction' aria-label='Local direction examples'>
        <Direction as='div' class='direction-boundary' dir='rtl'>
          <ToggleGroup label='Local RTL choices' items={choices} />
          <Direction as='div' dir='ltr'>
            <ToggleGroup label='Nested LTR choices' items={choices} />
          </Direction>
          <input aria-label='Local RTL search' />
        </Direction>
      </section>
    </>
  );
}
