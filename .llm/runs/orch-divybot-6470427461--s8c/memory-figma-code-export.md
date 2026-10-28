# Figma code-role migration

Use the exact b9dd32aac export, including Theme B and Theme set. Scheme, Studio flavor and Base accent aliases now traverse Theme set A → Theme Studio → Studio flavor Utility. Generator modes explicitly select set A; Theme B is retained but not emitted as a second scale.

Baseline has 281 --ns declarations per scheme. All 280 other roles remain byte-identical; the sole coordinator-approved exception is --ns-input-border: #838383 → #8d8d8d light and #7b7b7b → #6e6e6e dark. Tests compare full original declaration strings against the pre-S8c generated fixture and separately assert exact old/new borders. New export emits 462 declarations per scheme.

Code roles are --ns-code-bg and --ns-code-syntax-{keyword,function,type,string,number,comment,punctuation}. IMPORTANT uses --ns-important-{subtle,border,text}. All syntax roles pass unrounded 4.5:1 against code/bg and surface/bg. Final kind grouping is class/interface/type/enum → type; function/method/component → function; const/variable → keyword. Some reference tables (fresh-ui) have kinds but no signatures; test actual signature-bearing database tables rather than requiring a nonexistent column everywhere.
