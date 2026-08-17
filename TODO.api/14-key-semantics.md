# 14 — Key-derivation semantics (pubid ruby ↔ pubid-ts) — RESOLVED

Semantics decided and corpus-pinned at 0/389 misses:
- undated drops EVERY colon-year (base and supplement)
- allparts strips the trailing part only when pubid parsed it
  (structural; a trailing "-05" is a date day, not a part)


The corpus now pins lookup KEYS (norm/undated/allparts) computed through
pubid ruby structurally — the old cross-language "mirror" modules are gone
(parity is enforced by packages/pubid-ts/test/keys.test.ts).

Known divergence (4/389 corpus entries, all supplement ids):

- `ISO 668:2013/Amd 1:2016` — which year does *undated* strip (base vs
  supplement), and what is *allparts* for a supplement? Ruby strips the
  supplement year and leaves the part; TS strips the base year tail.
- `ISO 1942-4:1989/CD Amd 2` — staged supplement with no own year: TS
  over-strips the base year in `undated`; ruby leaves it.

## Done

- [x] Semantics encoded in gen_corpus.rb (ruby) and keys.ts deriveKeys (TS)
- [x] keys.test.ts parity gate: exactly 0 misses
- [ ] One re-ingest pass for affected D1 rows (iso supplements) — rides
      with 02 storage v2 re-ingest
