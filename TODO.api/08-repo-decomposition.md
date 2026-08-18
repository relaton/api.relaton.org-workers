# 08 — Repo decomposition: implementation libraries + deployment config

Goal (rev 2, supersedes the single-hub plan): three repos, one contract.
Production never changes worker/route during the migration.

## Tasks

- [ ] `relaton/relaton-api-js`: rename of relaton-api-js once 07
      ships a stable alpha; PRs #1/#2 land here; publishes @relaton/api.
- [ ] `relaton/relaton-api-ruby`: create; `git subtree split -P lib` (and
      `spec/`) from relaton/api.relaton.org pushed as founding history;
      scaffold per 11-ruby-gem.md.
- [ ] `relaton/api.relaton.org` → pure deployment repo (branch
      `deployment-only`): tag `legacy-lambda-final` first; new tree =
      relaton-api.yaml + worker/ entry + ruby/config.ru + workflows + this
      TODO tree + README (from PR #3 content).
- [ ] Deploy the SAME worker name + route from the new repo (zero-downtime
      cutover; rollback = re-deploy previous ref).
- [ ] Re-set GH secrets/variables in the deployment repo
      (CLOUDFLARE_*, RELATON_GEM, PUBID_GEM).
- [ ] PR #4 (this tree) merges into the deployment repo.

## Acceptance

- `api.relaton.org` repo diff = config only; implementation PRs live in the
  two library repos.
- `git log` in relaton-api-ruby reaches the original Lambda-era commits.
