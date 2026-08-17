# 11 — Ruby gem `relaton-api` (reference implementation)

Goal: the Ruby stack as a first-class library: Rack app, same v3 contract,
gem-quality structure per the constitution.

## Structure (autoload-first)

```
relaton-api-ruby/
  lib/relaton/api.rb            # module Relaton; autoload :Api, "relaton/api"
  lib/relaton/api/              # module Api — all autoloads declared here
    app.rb                      # Rack app: Relaton::Api::App (config-driven)
    config.rb                   # Relaton::Api::Config (flavors, cache, data)
    routes/                     # module Routes; autoload one class per route
      documents.rb  flavors.rb  version.rb
    models/                     # thin adapters over the relaton gem models
    store/                      # module Store; autoload per backend
      dataset_index.rb  r2_mirror.rb  file_system.rb
  relaton-api.gemspec
  spec/                         # request specs + conformance (12)
```

## Rules (from 00 constitution, enforced)

- Only autoload within the library; the entry file declares the immediate
  child; each namespace file declares its own children.
- No `send` on private methods, no `instance_variable_{set,get}`,
  no `respond_to?` typing — public API + `is_a?` where unavoidable.
- Model-driven: responses serialize via the relaton gem models (lutaml),
  never hand-rolled to_h/from_h.
- OCP: new route/backend = new autoloaded class + registry entry.

## Tasks

- [ ] Create repo with subtree-split history from relaton/api.relaton.org.
- [ ] Port the Lambda `app.rb` router to `Api::App` (Rack) — behavior
      specified by the v3 contract, not the old Lambda event shape.
- [ ] Config object (mirror of relaton-api.yaml semantics).
- [ ] Store backends: filesystem dataset (self-host), HTTP index import.
- [ ] Request specs; conformance suite wiring (12).
- [ ] Publish gem (relaton-api) — confirm name with maintainers.

## Acceptance

`config.ru` with 3 lines + Gemfile runs a spec-conformant API over a local
dataset checkout; `bin/rspec` includes the shared conformance suite green.
