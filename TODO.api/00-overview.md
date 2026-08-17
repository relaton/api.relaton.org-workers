# 00 — Relaton API master plan

Status: active (2026-08-17). Decision log and phase map for rebuilding
api.relaton.org as the modern Relaton API. Each phase has its own file
(`{n}-{name}.md`).

## Principles (rulings from this session)

1. **No legacy API support.** `/api/v1/*` is removed. v3 semantics replace it;
   relaton.org's demo is updated accordingly. Known "compatibility
   deviations" are void.
2. **Structured data, never smushed.** D1 stores each document as its full
   model JSON; queries hit mechanically generated projection tables and
   dataset-provided lookup keys. No lossy flattening (no `title_en`).
3. **Identifier semantics live in the datasets, not the API.** relaton-data-*
   repos ship indexes with pubid-canonical ids, docid variants, cross-refs,
   and lookup keys (relaton/relaton#109 pattern). The API imports keys as
   opaque tokens and deletes all derivation code.
4. **One repo per concern.** `relaton-data-ietf` = all IETF streams, YAML
   only. API repo = deployment hub (Ruby reference + TS deployment).
5. **Third-party SDOs deploy by configuration only.** An SDO with its own
   relaton-data repo(s) runs `npx @relaton/api init && deploy` against a
   `relaton-api.yaml` — no code changes (see 07).
6. Everything runs on Cloudflare (Workers + D1 + R2). Edge caching is part of
   the design, not an afterthought.

## Phase map

| # | File | Phase | Depends on |
|---|---|---|---|
| 01 | 01-ietf-unified-dataset.md | IETF dataset (#109 execution) | — |
| 02 | 02-storage-v2.md | D1 schema v2 (JSON docs + projections) | 01 (keys format proven) |
| 03 | 03-api-v3.md | v3 HTTP surface, `/api/v1` removal, edge cache | 02 |
| 04 | 04-graphql-model.md | Model-typed GraphQL | 02 |
| 05 | 05-json-schema.md | Published JSON Schema for Relaton JSON | 02 |
| 06 | 06-index-contract-all-flavors.md | Index rollout to every flavor | 01 proven |
| 07 | 07-npm-package.md | `@relaton/api` package (config-only deploys) | 03 shape stable |
| 08 | 08-repo-consolidation.md | api.relaton.org hub (ruby/ + workers/) | 07 |
| 09 | 09-site-integration.md | relaton.org demo/explorer on v3 | 03 |
| 10 | 10-observability-ops.md | Metrics, limits, runbooks | 03 |

## Current state (2026-08-17)

- Production: https://api.relaton.org via Workers route
  `api.relaton.org/*` → `api-relaton-org` (route id 823ce28481774d6faa0a742c5622ab73;
  rollback = delete route). Old AWS A records remain but are shadowed.
- Data: 11 flavors, ~400k docs in D1 v1 + R2 XML (built via tools/build_ingest.rb).
- Repo: relaton/api.relaton.org-workers (PRs #1 deploy, #2 ietf fixes, #3 README).
- Issue relaton/relaton#109 = dataset unification plan.
- Known scratch state to replace: ietf bibxml ingestion shims, API-side key
  derivation, hand-flattened D1 columns.
