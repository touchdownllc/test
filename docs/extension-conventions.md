# `x-edfi-usage` extension conventions

The generators attach usage metadata to the OpenAPI surface using a single
vendor extension key: **`x-edfi-usage`**. It appears in two artifacts:

- the **overlay** (`overlay.yaml`), as the `update` payload of each action, and
- the **stripped spec** (`openapi-stripped.yaml`), inline on operations and
  schema properties so the metadata travels with the document.

It is valid OpenAPI: the `x-` prefix marks it as a specification extension, so
Swagger UI, codegen, and `swagger-parser` all tolerate it.

## Vocabulary note: `usage` → `status`

The authoring vocabulary in the profile YAML uses `usage:`. On the wire, inside
an OpenAPI document, the block uses `status:` so the annotation reads naturally
next to other OpenAPI fields. The mapping is 1:1; this is the only renaming.

## Resource-level block

Attached to every operation on a resource's collection path:

```yaml
x-edfi-usage:
  status: in-use
  populatedBy: ["Infinite Campus SIS"]
  refreshCadence: nightly
  coverage: 1.0
  notes: "All enrolled K-12 students"
  reason: "..."        # present when status is not-implemented
```

## Property-level block

Attached to a schema property node:

```yaml
x-edfi-usage:
  status: partial
  coverage: 0.62
  source: "SIS.Student.MiddleName"
  requiredByImplementation: true
  notes: "..."
  reason: "..."        # present when status is not-populated
```

## Field presence

Only fields the author supplied are emitted — there are no `null` placeholders.
This keeps the overlay diff-friendly and the stripped spec clean.

## Description augmentation (stripped spec only)

To make Swagger UI immediately useful **without** custom rendering, the stripped
spec also appends a short human-readable note to a property's `description`:

| Status | Appended note |
|--------|---------------|
| `partial` | `⚠️ Partially populated: ~62% of records. <notes>` |
| `planned` | `🕒 Planned — not yet populated. <notes>` |
| `in-use` + `requiredByImplementation` | `✅ Required by this implementation.` |

The original description is preserved; the note is appended.

## Overlay targeting

Overlay actions target nodes by JSONPath, per OpenAPI Overlay Specification 1.0:

```yaml
- target: "$.paths['/ed-fi/students'].get"
  update:
    x-edfi-usage: { status: in-use, ... }
- target: "$.components.schemas.edFi_student.properties.middleName"
  update:
    x-edfi-usage: { status: partial, coverage: 0.62 }
```

The overlay is **purely additive** — it never contains `remove` actions. Removal
is the stripped spec's job.
