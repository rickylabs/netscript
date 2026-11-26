/** @jsxImportSource npm:preact@^10.29.2 */
import { page } from 'jsr:@fresh/core@^2.3.3';

export const handler = () => page({ ok: true });
export const handlers = { GET: () => page({ ok: true }) };
export default function BothHandlersRoute() {
  return <div>ambiguous</div>;
}
