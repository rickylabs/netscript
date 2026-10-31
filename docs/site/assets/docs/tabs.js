// Tabs enhance visible HTML panels; runtime choices synchronize across groups and navigation.
const RUNTIME_KEY = 'ns-runtime';
const groups = [...document.querySelectorAll('.ns-tabbed')];
const activators = new Map();
function rememberRuntime(label, except) {
  try {
    localStorage.setItem(RUNTIME_KEY, label);
  } catch { /* Persistence is optional. */ }
  for (const [group, activate] of activators) {
    if (group === except || !group.hasAttribute('data-ns-runtime-group')) continue;
    const index = [...group.querySelectorAll('[role="tab"]')].findIndex((tab) =>
      tab.dataset.nsRuntime === label
    );
    if (index >= 0) activate(index, false);
  }
}
for (const group of groups) {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];
  if (!tabs.length || tabs.length !== panels.length) continue;
  const activate = (index, persist = true) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    const language = group.querySelector('[data-tab-language]');
    if (language) language.textContent = tabs[index].dataset.codeLanguage;
    const filename = group.querySelector('[data-tab-filename]');
    if (filename) {
      filename.textContent = tabs[index].dataset.codeFilename || '';
      filename.title = filename.textContent;
      filename.hidden = !filename.textContent;
    }
    const copy = group.querySelector('[data-tab-copy]');
    if (copy) copy.setAttribute('aria-label', `Copy ${tabs[index].textContent.trim()} code`);
    if (persist && group.hasAttribute('data-ns-runtime-group')) {
      rememberRuntime(tabs[index].dataset.nsRuntime, group);
    }
  };
  activators.set(group, activate);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = (index + tabs.length - 1) % tabs.length;
      }
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
  group.classList.add('is-enhanced');
  let selected = 0;
  if (group.hasAttribute('data-ns-runtime-group')) {
    try {
      const stored = localStorage.getItem(RUNTIME_KEY);
      const index = tabs.findIndex((tab) => tab.dataset.nsRuntime === stored);
      if (index >= 0) selected = index;
    } catch { /* Use first runtime. */ }
  }
  activate(selected, false);
}
for (const comparison of document.querySelectorAll('[data-ns-comparison]')) {
  const select = comparison.querySelector('[data-ns-comparison-select]');
  if (!select) continue;
  const update = () => {
    comparison.querySelectorAll('[data-ns-competitor]').forEach((node) => {
      node.hidden = node.dataset.nsCompetitor !== select.value;
    });
    comparison.querySelectorAll('[data-ns-competitor-label]').forEach((node) => {
      node.textContent = select.selectedOptions[0]?.textContent || 'Comparison';
    });
  };
  select.addEventListener('change', update);
  comparison.classList.add('is-enhanced');
  update();
}

const status = document.createElement('span');
status.className = 'ns-sr-only';
status.setAttribute('role', 'status');
document.body.append(status);
async function copy(text, button) {
  const previous = [...button.childNodes].map((node) => node.cloneNode(true));
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
    status.textContent = 'Copied to clipboard';
  } catch {
    button.textContent = 'Copy unavailable';
    status.textContent = 'Clipboard unavailable. Select the text and copy it.';
  }
  setTimeout(() => {
    button.replaceChildren(...previous);
  }, 1800);
}
for (const button of document.querySelectorAll('[data-code-copy]')) {
  button.addEventListener(
    'click',
    () => {
      const code = button.hasAttribute('data-tab-copy')
        ? button.closest('.ns-tabbed').querySelector('[role="tabpanel"]:not([hidden]) pre code')
        : button.closest('[data-code-block]').querySelector('pre code');
      if (code) copy(code.textContent, button);
    },
  );
}
for (const button of document.querySelectorAll('[data-copy-path]')) {
  button.addEventListener(
    'click',
    () =>
      copy(
        button.closest('.ns-file-path').querySelector('.ns-file-path__value').textContent,
        button,
      ),
  );
}
for (const table of document.querySelectorAll('.ns-prose table')) table.tabIndex = 0;
