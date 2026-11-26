import { Partial } from 'fresh/runtime';
import { define } from '@app/utils.ts';

export default define.page(function DeferProbePartial() {
  return (
    <Partial name='defer-probe'>
      <div id='defer-target' data-defer-state='loaded'>loaded-from-partial</div>
    </Partial>
  );
});
