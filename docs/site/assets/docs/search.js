// Pagefind stays a lazy static-data dependency. The native dialog owns focus and Escape.
const PAGE_SIZE = 20;
const SUB_RESULTS = 2;
const DEBOUNCE_MS = 120;
const root = new URL('../../', import.meta.url);
const dialog = document.querySelector('#search-dialog');
const trigger = document.querySelector('[data-search-trigger]');
const input = document.querySelector('#search-query');
const results = document.querySelector('#search-results');
const filters = document.querySelector('[data-search-filters]');
const status = document.querySelector('[data-search-status]');
const count = document.querySelector('[data-search-count]');
const more = document.querySelector('[data-search-more]');
const retry = document.querySelector('[data-search-retry]');
const lanes = [...document.querySelectorAll('.docs-topbar .docs-lanes a')].map((a) =>
  a.textContent.trim()
);
let indexPromise;
let availableFilters = {};
let generation = 0;
let timer;
let lane = 'All';
let limit = PAGE_SIZE;
let choices = [];
let selected = -1;
let opener;
let navigating = false;

async function loadIndex() {
  if (!indexPromise) {
    indexPromise = import(new URL('pagefind/pagefind.js', root).href).then(async (index) => {
      availableFilters = await index.filters();
      return index;
    });
  }
  return await indexPromise;
}
function safeURL(raw) {
  try {
    const url = new URL(raw, root);
    return url.origin === location.origin && url.pathname.startsWith(root.pathname) ? url : null;
  } catch {
    return null;
  }
}
function excerpt(raw) {
  const source = new DOMParser().parseFromString(String(raw || ''), 'text/html');
  const fragment = document.createDocumentFragment();
  for (const node of source.body.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      fragment.append(document.createTextNode(node.textContent));
    } else if (node.nodeName === 'MARK') {
      const mark = document.createElement('mark');
      mark.textContent = node.textContent;
      fragment.append(mark);
    } else if (!['SCRIPT', 'STYLE'].includes(node.nodeName)) {
      fragment.append(document.createTextNode(node.textContent));
    }
  }
  return fragment;
}
function setSelected(index, scroll = false) {
  selected = choices.length ? (index + choices.length) % choices.length : -1;
  choices.forEach((choice, i) => {
    choice.setAttribute('aria-selected', String(i === selected));
  });
  if (selected >= 0) {
    input.setAttribute('aria-activedescendant', choices[selected].id);
    if (scroll) choices[selected].scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
  input.setAttribute('aria-expanded', String(choices.length > 0));
}
function resetResults() {
  choices = [];
  setSelected(-1);
  results.replaceChildren();
  more.hidden = true;
  retry.hidden = true;
}
function renderFilters(counts, total) {
  const focusedLane = document.activeElement?.dataset.searchLane;
  filters.replaceChildren();
  for (const label of ['All', ...lanes]) {
    const matches = label === 'All' ? total : (counts[label] || 0);
    if (label !== 'All' && matches === 0 && label !== lane) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.searchLane = label;
    button.setAttribute('aria-pressed', String(label === lane));
    button.append(document.createTextNode(label));
    const number = document.createElement('span');
    number.textContent = String(matches);
    button.append(number);
    button.addEventListener('click', () => {
      lane = label;
      limit = PAGE_SIZE;
      input.focus();
      void runSearch(++generation);
    });
    filters.append(button);
    if (focusedLane === label) button.focus();
  }
  filters.hidden = false;
}
function option(data, sub, sequence) {
  const url = safeURL(data.url);
  if (!url) return null;
  const a = document.createElement('a');
  a.href = url.href;
  a.id = `search-option-${sequence}`;
  a.className = `docs-search-result${sub ? ' docs-search-result--sub' : ''}`;
  a.setAttribute('role', 'option');
  a.setAttribute('aria-selected', 'false');
  a.tabIndex = -1;
  const icon = document.createElement('span');
  icon.className = 'docs-search-result__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = sub ? '#' : '▤';
  const body = document.createElement('span');
  body.className = 'docs-search-result__body';
  const title = document.createElement('span');
  title.className = 'docs-search-result__title';
  title.textContent = data.title || data.meta?.title || url.pathname;
  body.append(title);
  if (!sub) {
    const path = document.createElement('span');
    path.className = 'docs-search-result__path';
    path.textContent = url.pathname.slice(root.pathname.length - 1);
    body.append(path);
    const text = document.createElement('span');
    text.className = 'docs-search-result__excerpt';
    text.append(excerpt(data.excerpt || data.plain_excerpt));
    body.append(text);
  }
  const enter = document.createElement('span');
  enter.className = 'docs-search-result__enter';
  enter.setAttribute('aria-hidden', 'true');
  enter.textContent = '↵';
  a.append(icon, body, enter);
  return a;
}
async function runSearch(request) {
  clearTimeout(timer);
  const query = input.value.trim();
  resetResults();
  if (!query) {
    filters.hidden = true;
    dialog.dataset.state = 'idle';
    status.textContent = 'Type a term to search the documentation.';
    count.textContent = 'Pagefind';
    results.setAttribute('aria-busy', 'false');
    return;
  }
  dialog.dataset.state = 'loading';
  status.textContent = 'Searching…';
  results.setAttribute('aria-busy', 'true');
  try {
    const index = await loadIndex();
    const search = await index.search(query, lane === 'All' ? {} : { filters: { lane } });
    const pages = await Promise.all(search.results.slice(0, limit).map((result) => result.data()));
    if (request !== generation || !dialog.open) return;
    const total = search.results.length;
    renderFilters(
      search.totalFilters?.lane || availableFilters.lane || {},
      search.unfilteredResultCount ?? total,
    );
    const groups = new Map();
    let sequence = 0;
    for (const page of pages) {
      const url = safeURL(page.url);
      if (!url) continue;
      const laneName = page.filters?.lane?.[0] || 'Documentation';
      const pillar = url.pathname.slice(root.pathname.length).split('/')[0].replaceAll('-', ' ') ||
        'Home';
      const label = `${laneName} · ${pillar}`;
      let group = groups.get(label);
      if (!group) {
        group = document.createElement('div');
        group.className = 'docs-search-group';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', label);
        const eyebrow = document.createElement('p');
        eyebrow.className = 'ns-eyebrow';
        eyebrow.setAttribute('aria-hidden', 'true');
        eyebrow.textContent = label;
        group.append(eyebrow);
        groups.set(label, group);
        results.append(group);
      }
      const primary = option(page, false, ++sequence);
      if (primary) group.append(primary);
      for (
        const sub of (page.sub_results || []).filter((sub) =>
          sub.url !== page.url && sub.title !== page.meta?.title
        ).slice(
          0,
          SUB_RESULTS,
        )
      ) {
        const row = option(sub, true, ++sequence);
        if (row) group.append(row);
      }
    }
    choices = [...results.querySelectorAll('[role="option"]')];
    setSelected(0);
    dialog.dataset.state = choices.length ? 'ready' : 'empty';
    status.textContent = choices.length
      ? `${total} ${total === 1 ? 'result' : 'results'}.`
      : 'No results. Try another term or choose a different lane.';
    count.textContent = `${total} ${total === 1 ? 'result' : 'results'} · Pagefind`;
    more.hidden = total <= limit;
    results.setAttribute('aria-busy', 'false');
  } catch {
    if (request !== generation || !dialog.open) return;
    resetResults();
    results.setAttribute('aria-busy', 'false');
    dialog.dataset.state = 'error';
    filters.hidden = true;
    status.textContent =
      'Search is unavailable. Reload the page or browse the documentation navigation.';
    count.textContent = 'Pagefind unavailable';
    retry.hidden = false;
  }
}
function openSearch() {
  if (!dialog || dialog.open) return;
  navigating = false;
  opener = document.activeElement;
  dialog.showModal();
  trigger.setAttribute('aria-expanded', 'true');
  input.focus();
  void runSearch(++generation);
}
trigger?.addEventListener('click', (event) => {
  event.preventDefault();
  openSearch();
});
trigger?.addEventListener('keydown', (event) => {
  if (event.key === ' ') {
    event.preventDefault();
    openSearch();
  }
});
input?.addEventListener('input', () => {
  limit = PAGE_SIZE;
  const request = ++generation;
  resetResults();
  clearTimeout(timer);
  timer = setTimeout(() => {
    void runSearch(request);
  }, DEBOUNCE_MS);
});
input?.addEventListener('keydown', (event) => {
  if (event.isComposing) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    setSelected(selected + (event.key === 'ArrowDown' ? 1 : -1), true);
  }
  if (event.key === 'Enter' && selected >= 0) {
    event.preventDefault();
    const href = choices[selected].href;
    navigating = true;
    dialog.close();
    location.assign(href);
  } else if (event.key === 'Enter') event.preventDefault();
});
results?.addEventListener('click', (event) => {
  if (event.target.closest('[role="option"]')) {
    navigating = true;
    dialog.close();
  }
});
results?.addEventListener('pointermove', (event) => {
  const row = event.target.closest('[role="option"]');
  const index = choices.indexOf(row);
  if (index >= 0) setSelected(index);
});
more?.addEventListener('click', () => {
  limit += PAGE_SIZE;
  input.focus();
  void runSearch(++generation);
});
retry?.addEventListener('click', () => location.reload());
dialog?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    dialog.close();
  }
});
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener('close', () => {
  if (dialog.open) return;
  ++generation;
  clearTimeout(timer);
  trigger.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
  if (!navigating && opener instanceof HTMLElement && opener.isConnected) opener.focus();
  navigating = false;
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (dialog.open) dialog.close();
    else openSearch();
  }
});
