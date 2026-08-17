# 14 — Key-derivation semantics for supplements (pubid ruby ↔ pubid-ts)

The corpus now pins lookup KEYS (norm/undated/allparts) computed through
pubid ruby structurally — the old cross-language "mirror" modules are gone
(parity is enforced by packages/pubid-ts/test/keys.test.ts).

Known divergence (4/389 corpus entries, all supplement ids):

- `ISO 668:2013/Amd 1:2016` — which year does *undated* strip (base vs
  supplement), and what is *allparts* for a supplement? Ruby strips the
  supplement year and leaves the part; TS strips the base year tail.
- `ISO 1942-4:1989/CD Amd 2` — staged supplement with no own year: TS
  over-strips the base year in `undated`; ruby leaves it.

## Tasks

- [ ] Decide semantics from the pubid model structure: `id.base.year` vs
      supplement year; part belongs to the base identifier.
- [ ] Encode once in pubid ruby's corpus generator; tighten the pubid-ts
      parity gate to 100%.
- [ ] Re-generate affected D1 rows (iso supplements) via one ingest pass.

## Acceptance

keys.test.ts parity gate at exactly 0 misses.
