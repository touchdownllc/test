# Ed-Fi Implementation Usage Profile — POC

Two complementary tools that let an Ed-Fi implementer describe **which resources
and elements of the ODS/API are actually in use** in their deployment.

The canonical Ed-Fi model and OpenAPI document are **never mutated**. Usage
annotations live in a **sidecar profile** that references a published Data
Standard version, and a generator turns that profile into artifacts consumers
can actually use.

## Why this matters

The Ed-Fi ODS/API OpenAPI document describes the **model surface** — every
resource and property the Data Standard defines. It does not describe what a
particular agency or vendor **actually populates**. Consumers (downstream apps,
analytics teams, RFP respondents, and increasingly AI/agent contexts) routinely
ask *"which fields can we count on?"* — and today the answer is tribal knowledge
or a spreadsheet.

This POC fills that gap with a descriptive, tooling-friendly artifact:

- An LLM-driven agent hitting an Ed-Fi API benefits enormously from knowing that
  an absent `citizenshipStatusDescriptor` is **policy, not missing data**.
- A consumer integrating against a district's ODS gets a **stripped OpenAPI doc**
  showing only what's real, ready to render in Swagger UI.
- A district documenting conformance for an RFP gets a **coverage report** in
  one command.

## Two tracks, one shared core

The person who *knows* what's in use (data architect, integration lead, district
CIO, vendor PM) is rarely the person who works in MetaEd (data modeler, platform
engineer). Forcing the former to learn the latter's toolchain kills adoption — so
there are two tracks that converge on a single profile format and a single
validation core.

```
┌─────────────────────────────────────────────────────────────────┐
│  Track B: Profile Studio (browser, no toolchain)                 │
│  Load Swagger ─▶ Mark up resources/properties ─▶ Export profile  │
└─────────────────────────────────┬────────────────────────────────┘
                                   │  profile.yaml (shared format)
┌─────────────────────────────────▼────────────────────────────────┐
│  Track A: MetaEd Plugin + CLI Generator                           │
│  Read profile ─▶ Validate ─▶ Emit overlay, stripped spec, report  │
└───────────────────────────────────────────────────────────────────┘
```

`edfi-profile-core` is the **only** place profile semantics are defined; the
plugin and the studio both depend on it, so a profile authored in the browser is
byte-for-byte the kind a developer would hand-write.

## Packages

| Package | What it is |
|---------|------------|
| [`edfi-profile-core`](packages/edfi-profile-core) | Shared model, YAML parser/serializer, OpenAPI spec index, validator. |
| [`metaed-plugin-edfi-implementation-profile`](packages/metaed-plugin-edfi-implementation-profile) | The three generators (overlay, stripped spec, coverage report), shaped as a MetaEd plugin. |
| [`edfi-profile-cli`](packages/edfi-profile-cli) | `edfi-profile generate` / `validate` CLI. |
| [`edfi-profile-studio`](packages/edfi-profile-studio) | Browser SPA for authoring profiles (Track B). |

## Quick start (Track A)

```bash
npm install
npm run build
npm test

# Generate all three artifacts for the worked example:
node packages/edfi-profile-cli/dist/cli.js generate \
  --profile examples/sample-lea/sample-lea.profile.yaml \
  --base    examples/ed-fi-base/openapi-5.2.yaml \
  --out-dir ./output

# Or run the full pipeline + summary:
./demo.sh
```

Outputs land in `./output/`:

- `overlay.yaml` — OpenAPI Overlay 1.0, purely additive `x-edfi-usage` blocks.
- `openapi-stripped.yaml` — a complete, valid OpenAPI 3.0 doc with
  not-implemented paths and not-populated properties removed.
- `coverage.json` / `coverage.md` — machine- and human-readable coverage summary.

## Quick start (Track B)

```bash
npm install
npm run build                 # builds the shared core the studio depends on
npm run build:studio          # static SPA in packages/edfi-profile-studio/dist
npm run dev --workspace edfi-profile-studio   # or run the dev server
```

Then: **Load bundled Ed-Fi 5.2 sample** → mark up resources/properties → **Export
profile.yaml** → feed it to the Track A CLI above. See
[docs/studio-walkthrough.md](docs/studio-walkthrough.md).

## The three usage statuses that change output

| Status | Stripped spec behavior |
|--------|------------------------|
| `in-use` / `partial` / `planned` | Property/path kept; `x-edfi-usage` attached; partial/planned get a description note. |
| `not-populated` | Property removed from the schema (and from `required`). |
| `not-implemented` | The whole resource path is removed. |

## Documentation

- [docs/profile-format.md](docs/profile-format.md) — the sidecar `.profile.yaml` format.
- [docs/extension-conventions.md](docs/extension-conventions.md) — the `x-edfi-usage` field reference.
- [docs/studio-walkthrough.md](docs/studio-walkthrough.md) — Track B workflow.
- [docs/design-rationale.md](docs/design-rationale.md) — why sidecar, why overlay, and the relationship to Ed-Fi Profiles.

## POC scope

This is a proof of concept. Three resources (Student, StudentSchoolAssociation,
StudentEducationOrganizationAssociation) are enough to prove the pattern. The
base spec in `examples/ed-fi-base/` is a self-contained curated subset of the
Ed-Fi Data Standard 5.2 OpenAPI document. See the handoff doc for what is
explicitly out of scope (runtime enforcement, profile composition, npm publish,
full Data Standard coverage).
