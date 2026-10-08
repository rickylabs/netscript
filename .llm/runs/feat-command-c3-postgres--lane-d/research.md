# C3 research

Re-baselined approved plan against current main 72cb3c9d706c6e6a02035c7d9ab124cb945155da, including merged C1 and C2. Read issue #1484 and all comments; all five acceptance boxes remain pending. C2 already owns generic CommandStorePort<TTx>, rows, capabilities and trusted store-error vocabulary in database/commands.
RFC 0003 requires consumer-owned schema/migrations/generated callback type and one physical provider transaction. Existing withTransaction erases the callback into the root client; new implementation must preserve separate root and callback types.
NetScript find_guidance consulted for transaction/store/schema work. Its matches are general database generation guidance; RFC 0003 and current contracts are the specific authority.
Planned public surface: database transaction callback port and named PostgreSQL command adapter, explicit return annotations and publish includes; no consumer-specific generated Prisma type in framework exports. Full-export doc lint and native isolated publish are required. Existing direct pg/Prisma dependencies retained without upgrade.
