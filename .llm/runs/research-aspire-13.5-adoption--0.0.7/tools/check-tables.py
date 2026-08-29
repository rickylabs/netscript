#!/usr/bin/env python3
"""Fail if any Markdown table row in the run dir has a different cell count than its header."""
import sys, pathlib, re
root = pathlib.Path(sys.argv[1])
bad = 0
for md in sorted(root.rglob('*.md')):
    if 'sources' in md.parts or 'receipts' in md.parts:
        continue
    lines = md.read_text().split('\n')
    i = 0
    while i < len(lines):
        if lines[i].startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:-]+\|', lines[i + 1]):
            header = len(re.split(r'(?<!\\)\|', lines[i].strip().strip('|')))
            j = i + 2
            while j < len(lines) and lines[j].startswith('|'):
                n = len(re.split(r'(?<!\\)\|', lines[j].strip().strip('|')))
                if n != header:
                    print(f'{md}:{j + 1}: {n} cells, header has {header}')
                    bad += 1
                j += 1
            i = j
        else:
            i += 1
print(f'table check: {"OK" if bad == 0 else str(bad) + " bad rows"}')
sys.exit(1 if bad else 0)
