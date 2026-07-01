import { App, staticFiles, trailingSlashes } from "fresh";
import Page from "./routes/index.tsx";

export const app = new App({})
  .use(staticFiles())
  .use(trailingSlashes("never"))
  .get("/", (ctx) => ctx.render(<Page />));

if (import.meta.main) {
  await app.listen({ hostname: "127.0.0.1", port: 8071 });
}
