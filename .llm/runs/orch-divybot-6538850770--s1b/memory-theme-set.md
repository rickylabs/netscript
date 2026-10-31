# Theme set source and ownership

Fresh source #2493 at dd442e82794c4b960e51529f1c7ac534afda75ea has 9 collections and 2186 variables. Theme, Theme B and Theme set share 340 variable names and WEB syntax; route through Theme set, never last-write-wins across these collections. Scheme, Studio flavor, Base accent reference Theme set. Existing name-migrations.json already splits four Scheme COLOR / Studio FLOAT collisions by keeping colors and adding -width to dimensions. Reuse that decision.

Theme B has authoritative scalar values that differ from old code overlays: Bloom radius/card=32, Liquid radius/card=14. Remove core overlays rather than trusting old node documentation constants. Fresh export type/em/style mixes Italic and normal weight styles across modes; model it with a stable string type, not numeric fontWeight. State opacity needs unitless number, not the old FLOAT catch-all dimension.
