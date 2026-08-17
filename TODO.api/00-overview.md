# 00 — Relaton API master plan

Status: active (2026-08-17, rev 2: three-repo decomposition). Each phase has
its own file (`{n}-{name}.md`).

## Principles (rulings from this session)

1. **No legacy API support.** `/api/v1/*` is removed (410 for one release).
   v3 semantics replace it.
2. **Structured data, never smushed.** D1 stores each document as its full
   model JSON; queries hit mechanical projections and dataset-provided
   lookup keys. No lossy flattening.
3. **Identifier semantics live in the datasets, not the API** (relaton#109
   pattern). The API imports keys as opaque tokens.
4. **Three-repo decomposition** (rev 2, supersedes the single-hub plan):
   - `relaton/relaton-api-js` → publishes npm `@relaton/api` (library +
     CLI); ships the contract artifacts (OpenAPI 3.1 + JSON Schema +
     conformance fixtures). Current `-workers` repo, repurposed.
   - `relaton/relaton-api-ruby` → gem `relaton-api` (Rack app); history via
     `git subtree split` from the old repo; conformance CI against the
     published spec.
   - `relaton/api.relaton.org` → pure deployment/configuration repo
     (relaton-api.yaml, 3-line entries, workflows, secrets, this TODO tree).
5. **Third-party SDOs deploy by configuration only** — either stack, from
   published packages. Deploy = config diff; rollback = version pin.

## Code-quality constitution (applies to every repo, enforced in review)

- Model-driven, semantically-driven: code mirrors the Relaton model; wire
  names come from mappings, never hand-rolled serialization.
- OCP: new flavor / serialization / key source = new config or registry
  entry, never a switch statement edit.
- MECE + DRY: each concern in exactly one place; three similar lines beat a
  wrong abstraction.
- Performance: edge caching by default; D1 queries hit indexes; no
  per-request derivation.
- Ruby: **autoload only** within the library (autoloads declared in the
  immediate parent namespace's file, created if absent) — never
  `require_relative`/`require` of our own files; never `send` to private
  methods; never `instance_variable_set/get`; never `respond_to?` typing.
- Specs throughout: every package ships conformance/contract tests; no
  behavior without a spec.

## Phase map

| # | File | Phase | Status |
|---|---|---|---|
| 01 | 01-ietf-unified-dataset.md | IETF dataset (#109) | pending |
| 02 | 02-storage-v2.md | D1 schema v2 | pending |
| 03 | 03-api-v3.md | v3 surface | pending |
| 04 | 04-graphql-model.md | model-typed GraphQL | pending |
| 05 | 05-json-schema.md | JSON Schema contract | pending |
| 06 | 06-index-contract-all-flavors.md | index rollout | pending |
| 07 | 07-npm-package.md | `@relaton/api` | **in progress** (library extraction done; CLI init/check done; deploy/ingest pending) |
| 08 | 08-repo-decomposition.md | three-repo split | pending (rev 2) |
| 09 | 09-site-integration.md | relaton.org on v3 | pending |
| 10 | 10-observability-ops.md | ops | pending |
| 11 | 11-ruby-gem.md | `relaton-api` gem | pending |
| 12 | 12-conformance-suite.md | shared contract tests | pending |
| 13 | 13-code-quality-refactor.md | constitution applied | **in progress** (tools autoload refactor done; TS pass done) |

## Current state

Production unchanged: https://api.relaton.org via route
`api.relaton.org/*` → `api-relaton-org`; ~400k docs across 11 flavors
(D1 v1 + R2). Open PRs: #1 deploy workflow, #2 ietf fixes, #4 this plan.
