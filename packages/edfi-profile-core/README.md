# edfi-profile-core

The shared heart of the Ed-Fi Implementation Usage Profile POC. **Both the
MetaEd plugin (Track A) and the Profile Studio (Track B) depend on this package**
— it is the single source of truth for what a valid profile is and what a usage
status means. Keeping the semantics here is the only way to guarantee the two
tracks can never drift.

## What's inside

- **`model/`** — the `ProfileModel` types and the `UsageStatus` enum.
- **`parser/`** — `parseProfile(yaml)` ↔ `serializeProfile(model)`. Serialization
  is deterministic and idempotent so profiles round-trip cleanly.
- **`spec/`** — `SpecIndex`, which indexes an Ed-Fi OpenAPI document and resolves
  a PascalCase resource name (e.g. `Student`) to its schema and paths regardless
  of the namespace prefix.
- **`validator/`** — `validateProfile(model, specIndex?)`. Without a spec it runs
  spec-independent rules (enum values, coverage range); with one it cross-checks
  against the base document (unknown resources/properties, required-but-not-
  populated, tightened-required).

## Usage

```ts
import { parseProfile, validateProfile, SpecIndex } from 'edfi-profile-core';

const model = parseProfile(yamlText);
const result = validateProfile(model, new SpecIndex(baseOpenApiDoc));
console.log(result.errorCount, result.issues);
```
