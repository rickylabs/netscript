# Root catalog declarations must travel with copied imports

A root import map entry such as zod: catalog: makes an isolated fixture invalid if it copies imports but drops catalog. The release workflow recovery fixture must copy tasks, imports and catalog together. Otherwise it fails resolution before reaching the permission denial/content-verdict behavior it is supposed to prove. Keep those behavioral assertions unchanged. The red case reports package zod not found in catalog; the complete module passes 8 tests after copying the catalog.
