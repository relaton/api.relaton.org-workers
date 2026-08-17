# 13 — Code-quality refactor (constitution applied to existing code)

Goal: bring current code to the 00 constitution before extraction widens.

## Done

- [x] tools/: library code moved to `tools/lib/relaton_api/` with
      autoload-only loading (namespace files declare children); entry
      scripts boot via `$LOAD_PATH` + top-level require of the namespace
      file only. No `require_relative` inside the library tree.
- [x] TS pass: no dynamic-dispatch equivalents of `send`/`respond_to`
  patterns in src/; routes are registry-shaped (OCP); pubid-ts carries the
  grammar (model-driven); corpus parity test = spec throughout.

## Remaining

- [ ] `src/routes/home.ts`: extract the HTML template to a typed renderer
      module once storage v2 lands (single responsibility).
- [ ] `src/lib/lookup.ts`: deleted entirely with 06 (dataset keys replace
      derivation) — do not invest further here.
- [ ] admin ingest: replace per-row statement building with a typed
      `IngestChunk` model + projection writer when 02 lands.
- [ ] tools/build_ingest.rb: split script from library logic (script keeps
      CLI parsing only; logic moves to RelatonApi::Ingest classes) when
      11 extracts the gem.

## Review checklist (PRs must state)

Ruby: autoload only / no send-private / no ivar set/get / no respond_to.
TS: strict types, no `any`, registry over switch, spec coverage for changed
behavior.
