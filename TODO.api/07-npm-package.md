# 07 — npm package `@relaton/api` (library + CLI)

Goal: third-party SDOs deploy by configuration only. The TS API is a
library; deployments are 3-line entries plus `relaton-api.yaml`.

## Done (rev 2)

- [x] `packages/relaton-api`: `createRelatonApi(config)` factory — the Hono
      app (REST + GraphQL + admin + landing) as a pure function of config.
- [x] Worker entry reduced to config + factory call; config sourced from
      the `API_CONFIG` var (JSON), validated with zod.
- [x] CLI skeleton: `relaton-api init` (scaffolds relaton-api.yaml, worker
      entry, wrangler.jsonc), `relaton-api check` (validates config and
      index URLs).

## Remaining

- [ ] `relaton-api deploy`: generate bindings/routes from config, run D1
      migrations, `wrangler deploy` programmatically.
- [ ] `relaton-api ingest <flavor>`: import a #109 index into D1 (pure TS;
      XML blob generation opts into the generated Ruby workflow).
- [ ] Publish via GitHub trusted publishing; deployment repos pin versions.
- [ ] Dogfood: second instance from pure config on workers.dev, zero code
      edits.

## Config schema (relaton-api.yaml)

```yaml
name: my-sdo-api
cloudflare: { account_id: env:CF_ACCOUNT_ID, zone: example-sdo.org,
              domain: api.example-sdo.org }
cache: { edge: true }
flavors:
  - id: mine
    index: https://github.com/my-sdo/relaton-data-mine/raw/main/index.zip
admin: { token_env: RELATON_API_ADMIN_TOKEN }
```

## Acceptance

SDO reaches a live API in ≤ 4 commands, zero code changes; api.relaton.org
itself deploys via the same package.
