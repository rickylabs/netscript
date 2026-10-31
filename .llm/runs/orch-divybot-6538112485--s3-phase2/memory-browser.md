# Browser preparation

Use tools/fresh-ui-browser package lock: npm ci --ignore-scripts in that folder
installs all7 packages without changing the lock. Playwright chromium's recorded
executable is already present. Actual browser keyboard tests are feasible here;
do not substitute state-helper tests or claim browser unavailable.
