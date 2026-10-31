# JSR request policy and proof

CLI published plugin metadata uses FetchJsrPluginValidator -> WebFetchJsrHttpClient; integrity and Prisma fragment copy use WebJsrPackageFileFetcher. Retry both at their existing Web edges. Keep HTTP failure diagnostics in a structured internal error and map it back to invalid-metadata at the validator so install retains ScaffoldValidationError/code semantics. Keep raw body reads within transport retry, JSON parsing outside it. A Retry-After beyond the accepted delay ceiling must stop retries rather than clamp and retry earlier than the server allows.

The focused directory suite passes with --allow-all --deny-net --cached-only --unstable-kv --frozen, proving tests cannot contact the registry. Broader public/local install and maintainer copy suites are independent integration proof. Disable MAX_ATTEMPTS in an isolated snapshot for the negative control; transient and count assertions must fail.
