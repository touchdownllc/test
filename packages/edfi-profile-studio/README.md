# edfi-profile-studio (Track B)

A browser SPA for authoring Ed-Fi implementation usage profiles — for the person
who *knows what's in use* but isn't a developer. Load a Swagger spec, mark up
resources and properties by clicking, export a `profile.yaml` that the Track A
CLI consumes unchanged.

- **No backend.** Spec is fetched/uploaded into memory; profile is built in
  memory; export is a client-side download. Works offline after first load.
- **Shared core.** Imports `edfi-profile-core` so validation and the profile
  format are identical to what a developer would hand-write — no drift.

## Develop / build

```bash
npm install
npm run build                                  # build the shared core first
npm run dev --workspace edfi-profile-studio    # Vite dev server
npm run build:studio                           # static build → dist/ (deploy anywhere)
```

The Vite config aliases `edfi-profile-core` to its TypeScript source (the
published CommonJS build re-exports via `__exportStar`, which Rollup's static
analyzer can't trace) and sets `base: ''` so the static build works under any
sub-path, including a GitHub Pages project URL.

## Layout

```
src/
  lib/specAdapter.ts     walks an OpenAPI doc → UI resource/property tree
  state/profileStore.ts  zustand store; recomputes validation on every edit
  components/            SpecLoader, ProfileLoader, ResourceList, ResourceDetail,
                         UsagePicker, CoverageBadge, ProfileExporter, ValidationBanner
  samples/               bundled Ed-Fi 5.2 spec + Sample LEA profile (?raw imports)
```

See [../../docs/studio-walkthrough.md](../../docs/studio-walkthrough.md) for the
full workflow.
