/** Merge with Vite's ambient environment instead of redefining ImportMeta.env. */
interface ImportMetaEnv {
  readonly VITE_services__streams__http__0?: string;
  readonly VITE_STREAMS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
