import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { AppEnv } from "./env";
import { adminRoutes } from "./routes/admin";
import { restRoutes } from "./routes/rest";
import { graphqlRoute } from "./routes/graphql";
import { renderHome } from "./routes/home";

export function createApp() {
  const app = new OpenAPIHono<AppEnv>();

  app.doc31("/openapi.json", (c) => ({
    openapi: "3.1.0",
    info: {
      title: "Relaton API",
      version: c.env.API_VERSION ?? "dev",
      description:
        "Bibliographic data for technical standards, aggregated across all relaton-data-* repositories.",
    },
    servers: [{ url: "https://api.relaton.org" }],
  }));

  app.get("/docs", (c) => c.html(`<!doctype html>
<html>
  <head>
    <title>Relaton API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <scalar-api-reference url="/openapi.json"></scalar-api-reference>
  </body>
</html>`));

  app.use("*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }));

  app.get("/", async (c) => c.html(await renderHome(c.env.DB, c.env.API_VERSION ?? "dev")));

  app.route("/", restRoutes);
  app.route("/", adminRoutes);
  app.all("/graphql", graphqlRoute());

  app.notFound((c) => c.text("Resource doesn't exist.", 404));

  return app;
}

export const app = createApp();
