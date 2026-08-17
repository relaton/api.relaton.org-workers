# 07 — `@relaton/api` npm package: config-only deployments for any SDO

Decision: **yes, ship an npm package.** A template repo cannot give
config-only deploys (SDOs would freeze old code); an npm package lets any
SDO upgrade with `npm i -g @relaton/api` while their `relaton-api.yaml`
stays theirs.

## Package shape

- **Library**: exports `createRelatonApi(config)` — the Hono app (REST v3 +
  GraphQL) as a pure function of config; the Worker entry is 3 lines.
- **CLI**:
  - `relaton-api init` — scaffold `relaton-api.yaml` + worker entry + GHA
  - `relaton-api deploy` — generate wrangler config from the yaml (D1/R2
    bindings, routes for the configured domain), run migrations, deploy
  - `relaton-api ingest <flavor>` — import a dataset index (+ YAML→XML for
    R2 via the generated Ruby GHA; pure JSON-only deployments skip R2)
  - `relaton-api check` — validate config, bindings, index URLs reachable

## Config file (the ONLY thing an SDO writes)

```yaml
# relaton-api.yaml
name: my-sdo-api
cloudflare:
  account_id: env:CF_ACCOUNT_ID
  zone: example-sdo.org
  domain: api.example-sdo.org     # route + cert handled by deploy
cache: edge
flavors:
  - id: ietf
    index: https://github.com/relaton/relaton-data-ietf/raw/main/index.zip
  - id: mine
    index: https://github.com/my-sdo/relaton-data-mine/raw/main/index.zip
admin:
  token_env: RELATON_API_ADMIN_TOKEN   # never in the file
```

## Tasks

- [ ] Extract worker src/ into `packages/api` (library entry, config-typed).
- [ ] CLI (deploy via wrangler programmatic API; config schema in zod).
- [ ] Generated artifacts: worker entry, wrangler.jsonc, .github/workflows/
      deploy.yml + ingest.yml (Ruby steps generated only when XML output is
      enabled).
- [ ] End-to-end dogfood: deploy a second instance from pure config against
      a subset flavor, on a workers.dev subdomain, zero code edits.
- [ ] Publish as `@relaton/api` (GitHub Actions trusted publishing).

## Acceptance

- An SDO with one relaton-data repo reaches a live API in ≤ 4 commands and
  zero code changes; README (PR #3) updated to lead with this path.
- api.relaton.org itself deploys via the same package (dogfooded).
