import { app } from "./app";
import type { Env } from "./env";
import { runIngestion } from "./ingest/sync";

export default {
  fetch: app.fetch,
  scheduled(controller, env, ctx) {
    ctx.waitUntil(runIngestion(env));
  },
} satisfies ExportedHandler<Env>;
