import { createRelatonApi, runIngestion } from "@relaton/api";
import type { Env } from "@relaton/api";

const { app } = createRelatonApi({ name: "api.relaton.org" });

export default {
  fetch: app.fetch,
  scheduled(controller, env: Env, ctx) {
    ctx.waitUntil(runIngestion(env));
  },
} satisfies ExportedHandler<Env>;
