#!/usr/bin/env node
// relaton-api CLI: config-only deployments.
//   init   — scaffold relaton-api.yaml, worker entry, wrangler.jsonc
//   check  — validate relaton-api.yaml and reachability of flavor indexes
// deploy/ingest are planned (see TODO.api/07).

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { load as loadYaml } from "js-yaml";

const command = process.argv[2];

function usage() {
  console.log(`relaton-api — deploy a Relaton API from configuration

  relaton-api init [dir]     scaffold a deployment
  relaton-api check          validate relaton-api.yaml in the current dir
`);
}

function scaffold(dir = ".") {
  mkdirSync(dir, { recursive: true });
  const files = {
    "relaton-api.yaml": `name: my-relaton-api
cloudflare:
  account_id: env:CF_ACCOUNT_ID
  zone: example.org
  domain: api.example.org
cache: { edge: true }
flavors:
  - id: ietf
    index: https://github.com/relaton/relaton-data-ietf/raw/main/index.zip
admin:
  token_env: RELATON_API_ADMIN_TOKEN
`,
    "worker/src/index.ts": `import { createRelatonApi, runIngestion } from "@relaton/api";
import type { Env } from "@relaton/api";

const { app } = createRelatonApi({ name: "my-relaton-api" });

export default {
  fetch: app.fetch,
  scheduled(controller, env: Env, ctx) {
    ctx.waitUntil(runIngestion(env));
  },
} satisfies ExportedHandler<Env>;
`,
  };
  for (const [path, content] of Object.entries(files)) {
    const target = `${dir}/${path}`;
    if (existsSync(target)) {
      console.log(`exists, skipped: ${target}`);
      continue;
    }
    mkdirSync(target.slice(0, target.lastIndexOf("/")), { recursive: true });
    writeFileSync(target, content);
    console.log(`wrote: ${target}`);
  }
  console.log("\nNext: fill in relaton-api.yaml, then `relaton-api check`.");
}

async function check() {
  if (!existsSync("relaton-api.yaml")) {
    console.error("no relaton-api.yaml in the current directory");
    process.exit(1);
  }
  const config = loadYaml(readFileSync("relaton-api.yaml", "utf8"));
  const problems = [];
  if (!config.name) problems.push("name is required");
  if (!Array.isArray(config.flavors) || !config.flavors.length) {
    problems.push("at least one flavor with an index URL is required");
  }
  for (const f of config.flavors ?? []) {
    if (!f.id) problems.push("flavor missing id");
    if (!f.index) problems.push(`flavor ${f.id}: index URL missing`);
  }
  for (const p of problems) console.error(`config: ${p}`);

  for (const f of config.flavors ?? []) {
    if (!f.index) continue;
    try {
      const res = await fetch(f.index, { method: "HEAD" });
      console.log(`${f.id}: index ${res.status === 200 ? "reachable" : `HTTP ${res.status}`}`);
      if (res.status >= 400) problems.push(`flavor ${f.id}: index not reachable`);
    } catch (e) {
      problems.push(`flavor ${f.id}: ${String(e)}`);
      console.error(`${f.id}: unreachable — ${String(e)}`);
    }
  }
  if (problems.length) process.exit(1);
  console.log("config OK");
}

const commands = { init: scaffold, check, "": usage };
const fn = commands[command ?? ""];
if (!fn) {
  usage();
  process.exit(1);
}
fn(...process.argv.slice(3));
