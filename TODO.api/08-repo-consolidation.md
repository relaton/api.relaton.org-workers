# 08 — Repo consolidation: api.relaton.org as the deployment hub

Goal (user-approved direction): `relaton/api.relaton.org` hosts BOTH
implementations behind one contract; `-workers` is archived.

## Structure

```
api.relaton.org/
  README.md        deployment guide (PR #3 content, updated for 07)
  ruby/            reference implementation: existing router/Finder/Storage
                   via git mv (history preserved), Rack entry replacing the
                   Lambda handler; REST v3 subset; runs the live gem
  workers/         TS deployment (from api.relaton.org-workers, incl.
                   packages/api from 07)
  .github/         deploy-cloudflare, ruby-tests, ingest
```

## Tasks

- [ ] In relaton/api.relaton.org: branch `restructure`; `git mv lib ruby/lib`
      (+ spec); add `ruby/config.ru` Rack adapter (keep old Lambda handler
      file for reference); ruby tests runnable locally.
- [ ] Import -workers tree into `workers/` (single squashed import commit).
- [ ] Port open PRs (#1 deploy, #2 ietf fixes, #3 README) as PRs here;
      re-set GH secrets/variables (CLOUDFLARE_*, RELATON_GEM, PUBID_GEM).
- [ ] Root README: hub narrative (Ruby reference vs Cloudflare deployment,
      SDO config-only path via 07).
- [ ] Merge; then in -workers: final commit adding "moved to
      relaton/api.relaton.org" README banner; archive the repo.
- [ ] Deploy pipeline still targets the same Worker name/route — zero
      production change.

## Acceptance

- One canonical repo; `git log ruby/` shows original history; production
  deployment unchanged (same worker, same route).
