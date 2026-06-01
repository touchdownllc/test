# The sidecar profile format (`.profile.yaml`)

A profile is a YAML sidecar that references a published Data Standard version
and annotates resources/properties with usage information. It never modifies the
canonical model — it sits alongside it.

> **Why YAML and not a MetaEd DSL?** The POC ships YAML: easy to parse, easy to
> author by hand or by tool, no ANTLR grammar work. A DSL form can follow later
> if the community prefers it. See [design-rationale.md](design-rationale.md).

## Top-level shape

```yaml
profile:
  name: SampleLeaProduction        # required
  version: "2025-26.1"             # required
  description: "..."               # optional
  extends:                         # optional — the Data Standard this targets
    dataStandard: "Ed-Fi-Model"
    version: "5.2.0"
  publisher:                       # optional
    name: "Sample LEA"
    contact: "data-team@sample-lea.org"

defaults:
  # Assumed status for a property that isn't called out on an in-use resource.
  # One of: in-use | unknown | not-populated. Default: unknown.
  unannotatedPropertyStatus: unknown

resources:
  Student:
    usage: in-use
    ...
```

## Resource entry

Keyed by the **PascalCase resource name** as it appears in the Data Standard
(e.g. `Student`, `StudentSchoolAssociation`).

```yaml
Student:
  usage: in-use                    # required
  populatedBy: ["Infinite Campus SIS"]
  refreshCadence: nightly
  coverage: 1.0
  notes: "All enrolled K-12 students"
  reason: "..."                    # used when usage is not-implemented
  properties:
    studentUniqueId:
      usage: in-use
      ...
```

## Property entry

Keyed by the property name as it appears in the resource's schema.

```yaml
middleName:
  usage: partial
  coverage: 0.62
  source: "SIS.Student.MiddleName"
  requiredByImplementation: false
  notes: "Populated when present; not backfilled"
  reason: "..."                    # used when usage is not-populated
```

## Usage statuses

| Status | Meaning | Effect on the stripped spec |
|--------|---------|-----------------------------|
| `in-use` | Actively populated. | Kept; `x-edfi-usage` attached. |
| `partial` | Populated some of the time; quantify with `coverage`. | Kept; description gets a "⚠️ ~N% of records" note. |
| `not-populated` | Resource is in use, but this property is never written. | **Property removed** (and dropped from `required`). |
| `not-implemented` | The resource itself is not exposed. *(resource level only)* | **Whole path removed.** |
| `planned` | Not in use yet, but on the roadmap. | Kept; flagged "🕒 Planned". |

## Field reference

| Field | Type | Where | Notes |
|-------|------|-------|-------|
| `usage` | enum | resource, property | Required. One of the statuses above. |
| `coverage` | float 0–1 | resource, property | Fraction of records populated; meaningful for `partial`. |
| `populatedBy` | string[] | resource | Source systems. |
| `source` | string | property | Specific source field, e.g. `SIS.Student.DOB`. |
| `refreshCadence` | string | resource | Free text: `realtime`, `nightly`, `weekly`, … |
| `requiredByImplementation` | bool | property | Optional in spec, mandatory here → promoted into `required`. |
| `notes` | string | both | Human-readable context. |
| `reason` | string | both | Why a field is `not-populated` / `not-implemented`. |

A complete worked example lives at
[`examples/sample-lea/sample-lea.profile.yaml`](../examples/sample-lea/sample-lea.profile.yaml).
