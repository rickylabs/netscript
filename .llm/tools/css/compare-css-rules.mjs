/** Compare the browser's parsed, ordered CSS contracts without erasing quoted whitespace. */
export async function compareCssRules(page, before, after) {
  return await page.evaluate(({ before, after }) => {
    const normalize = (value) =>
      value.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\s+/g, (_, quoted) => quoted ?? ' ');

    // Parent lists change nesting specificity. A conservative comparator must reject them.
    function compound(selector) {
      let depth = 0, quote = '', escaped = false;
      for (const char of selector) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (quote) {
          if (char === quote) quote = '';
          continue;
        }
        if (char === '"' || char === "'") {
          quote = char;
          continue;
        }
        if (char === '(' || char === '[') depth++;
        else if (char === ')' || char === ']') depth--;
        else if (depth === 0 && /[\s,>+~]/.test(char)) return false;
      }
      return depth === 0 && !quote;
    }

    function selectors(value) {
      const result = [];
      let depth = 0, quote = '', escaped = false, start = 0;
      for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (quote) {
          if (char === quote) quote = '';
          continue;
        }
        if (char === '"' || char === "'") {
          quote = char;
          continue;
        }
        if (char === '(' || char === '[') depth++;
        else if (char === ')' || char === ']') depth--;
        else if (char === ',' && depth === 0) {
          result.push(value.slice(start, i).trim());
          start = i + 1;
        }
      }
      result.push(value.slice(start).trim());
      return result;
    }

    function contract(css) {
      const sheet = new CSSStyleSheet();
      // Constructed sheets cannot load imports. Keep the literal import contract as evidence.
      const imports = [...css.matchAll(/@import\s+[^;]+;/g)].map(([value]) => normalize(value));
      sheet.replaceSync(css.replace(/@import\s+[^;]+;/g, ''));
      const records = imports.map((value) => [[], value]);
      function visit(rules, parent = '', conditions = []) {
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            let selector = rule.selectorText;
            if (parent) {
              if (
                !compound(parent) ||
                selectors(selector).some((part) =>
                  !part.startsWith('&') || part.slice(1).includes('&')
                )
              ) {
                throw new Error(
                  'Unsupported nesting: require one compound parent and leading & descendants',
                );
              }
              selector = selector.replaceAll('&', parent);
            }
            if (rule.style.length) {
              records.push([conditions, selector, normalize(rule.style.cssText)]);
            }
            if (rule.cssRules.length) visit(rule.cssRules, selector, conditions);
          } else if (rule.cssRules) {
            const condition = normalize(rule.cssText.slice(0, rule.cssText.indexOf('{')).trim());
            visit(rule.cssRules, parent, [...conditions, condition]);
          } else {
            // CSSNestedDeclarations retains an implicit parent; never discard that selector.
            if (parent && rule.style) {
              throw new Error('Unsupported nesting: declarations require an explicit style rule');
            }
            records.push([conditions, normalize(rule.cssText)]);
          }
        }
      }
      visit(sheet.cssRules);
      return records;
    }
    const a = contract(before), b = contract(after);
    const differences = [];
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      if (JSON.stringify(a[index]) !== JSON.stringify(b[index])) {
        differences.push({ index, before: a[index], after: b[index] });
      }
    }
    return { beforeRules: a.length, afterRules: b.length, differences };
  }, { before, after });
}
