# Native control edge cases

InputOTP uses one text input so browser selection/autofill/forms remain native.
Normalize clipboard contents before maxLength can truncate separators, and
replace only the selected range. Controlled rejection must restore the real
input value, not just leave visual mirrors unchanged. Native radio controlled
requests need a render to restore checked DOM. Browser tests verify all three.

Two native slider inputs must share min/max for identical geometry. Changing
an upper thumb's native min to its neighbor changes its physical scale. Keep
shared bounds, clamp input requests and expose dependent aria-valuemin/max.
Actual keyboard tests prove native Home/End cannot cross the other thumb.
