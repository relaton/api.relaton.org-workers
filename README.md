# api.relaton.org (Cloudflare Workers)

TypeScript rewrite of the Relaton public API, served entirely from Cloudflare
(Workers + D1 + R2). Replaces the Ruby/AWS Lambda deployment.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/document?code=&year=&all_parts=&keep_year=` | Relaton XML bibdata — same contract as the Ruby API (relaton gem `use_api` clients and the relaton.org `<ApiDemo />` both call this) |
| `GET /api/v1/version?format=text\|xml\|json` | API + data versions |
| `GET /openapi.json`, `GET /docs` | OpenAPI 3.1 spec + Scalar UI |
| `POST /graphql` | GraphQL across all flavors (`document`, `documents(code/flavor/title/year/doctype, first/after)`, `flavors`, `version`); GraphiQL playground at GET `/graphql` |
| `POST /admin/ingest/:flavor` | Chunked ingestion (Bearer `ADMIN_TOKEN`) |

## Architecture

- **Worker** (`src/`): Hono + `@hono/zod-openapi` (REST/OpenAPI), `graphql-yoga`
  (GraphQL). Pure lookup layer — no document conversion at request time.
- **D1**: the cross-flavor index. `documents` rows carry normalized lookup
  keys (`norm`, `undated_norm`, `allparts_norm`); `docids` holds every
  identifier variant including pubid-canonical ones.
- **R2** (`relaton-api-data`): full bibdata XML per document at
  `<flavor>/<path>`, produced by the Ruby relaton gem at ingestion time so
  responses are byte-compatible with the old API.
- **`packages/pubid-ts`**: TypeScript port of the pubid identifier parser.
  Query codes are canonicalized with it (update_codes rules + grammar +
  canonical render). Validated against a golden corpus generated from Ruby
  pubid over real docids — 100% canonical/year parity
  (`packages/pubid-ts/test/corpus.json`, regenerate with
  `tools/gen_corpus.rb`).
- **Ingestion** (`tools/`): Ruby (relaton + pubid gems) walks a
  `relaton-data-*` checkout, converts YAML→bibdata XML, extracts lookup keys
  and pubid-canonical variants, emits JSON chunks; `post_chunks.sh` uploads
  them through the admin endpoint. `tools/backfill.sh` runs all local clones;
  `.github/workflows/ingest.yml` keeps data fresh on a schedule.

## Development

```sh
npm install
npm run dev              # wrangler dev on :8787 (local D1/R2 state)
npm test                 # vitest (workers pool) + pubid-ts corpus parity
npm run typecheck
npm run db:migrate:local # apply migrations/ to local D1
```

Secrets (local: `.dev.vars`, remote: `wrangler secret put`): `ADMIN_TOKEN`.
Cloudflare account/zone IDs live in `~/.cloudflare-credentials-relaton`.

## Compatibility notes

- Error semantics match the Ruby API: 400 missing `code`, 404 not found;
  any non-200 is a miss for gem clients.
- Stage-prefixed ids without a recognized publisher (e.g. `AWI IWA 47`
  queried as bare code) were unroutable in the Ruby stack too; here the
  pubid canonicalization closes most of that gap when the canonical form is
  indexed.
- `all_parts` returns the latest member of the family rather than a
  synthesized "(all parts)" record (known deviation, can be generated at
  ingest later).
- Undated queries return the latest edition's stored XML (the gem also
  stripped the year from the returned document; we serve it as stored).
