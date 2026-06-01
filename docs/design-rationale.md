# Design rationale

## Why a sidecar, not a model change

The Ed-Fi Data Standard and its generated OpenAPI document describe the *model
surface* — everything that *could* be populated. That document is canonical and
shared across the whole ecosystem; mutating it per-deployment would fork it and
break the shared contract. So usage lives in a **sidecar profile** that
references a published Data Standard version (`extends.dataStandard` +
`extends.version`) and is applied by tooling. The canonical artifacts are never
touched.

## Why an OpenAPI Overlay

The [OpenAPI Overlay Specification 1.0](https://github.com/OAI/Overlay-Specification)
exists precisely for "decorate a base document without editing it." Emitting an
overlay means:

- the base spec and the usage annotations version independently;
- anyone with the base spec + overlay can reconstruct the annotated view;
- the mechanism is standard, so other Overlay-aware tooling can consume it.

The overlay is **purely additive**. The opinionated, lossy transformation
(removing things) is a separate artifact — the stripped spec — so the two
concerns never get conflated.

## Why a separate stripped spec

Consumers don't want "the full model plus a side file telling them what to
ignore." They want *the actual surface*. The stripped spec is a complete, valid
OpenAPI 3.0 document that:

- removes `not-implemented` resource paths entirely,
- removes `not-populated` properties (and fixes up `required`),
- keeps `x-edfi-usage` on what remains, and
- augments descriptions so Swagger UI is useful with **zero** custom rendering.

Validating it with `@apidevtools/swagger-parser` is a hard acceptance criterion —
if it doesn't validate as OpenAPI 3.0, the POC has failed its core promise.

## Relationship to Ed-Fi Profiles

This is the question that will come up first, so it's worth being precise.

| | **Ed-Fi Profiles (XML)** | **Implementation Usage Profile (this POC)** |
|---|---|---|
| Purpose | **Enforcement** — what an API client *may* see/write. | **Description** — what the implementation *actually populates*. |
| Enforced at | ODS/API runtime. | Nowhere; it's documentation/tooling metadata. |
| Audience | Security/integration admins. | Data architects, consumers, RFP authors, AI agents. |
| Shape | XML, predates modern OpenAPI tooling. | YAML sidecar + OpenAPI overlay/stripped spec. |

They are **complementary, not competing**. Profiles say "client X is *allowed* to
see fields A, B, C." A usage profile says "this deployment *populates* fields A
and B; C is policy-empty." Ideally one source of truth could eventually generate
both — that's a roadmap conversation, not a POC goal.

## Why two tracks instead of "just use MetaEd"

MetaEd is the right surface for the *generation pipeline* and the wrong surface
for the *authoring audience*. The person who knows what's in use — a district
data architect, a vendor PM, a consultant doing an assessment — will not clone a
repo and run a Node toolchain. Track B (the browser studio) meets them where they
are; Track A (the plugin/CLI) meets the platform engineers where they are. Both
depend on the same `edfi-profile-core`, so the two audiences can never produce
incompatible profiles.

That role separation is itself the pitch: *the person who knows isn't the person
who codes.* It defuses the predictable "MetaEd already does this" objection by
making clear MetaEd is the wrong **authoring** surface even where it's the right
**generation** surface.

## The AI/agent angle

An LLM-driven agent querying an Ed-Fi API has no way to tell an intentionally
empty field from a data-quality hole. `citizenshipStatusDescriptor: not-populated`
with `reason: "Not collected per board policy 5.4"` turns a silent null into
explicit, machine-readable policy. As agent-mediated data access grows, "this
null is expected" vs. "this null is missing" becomes a first-class need — and a
likely wedge for getting the broader ecosystem interested.

## Open questions deferred past the POC

- **DSL vs. YAML** for the profile format (POC ships YAML).
- **Profile composition / inheritance** (an agency extending a vendor base) —
  the `extends:` block leaves room for it.
- **Descriptor/enum-value granularity** ("we only use 3 values of
  `GradeLevelDescriptor`") — POC stays at the property level.
- **OpenAPI 3.1** — Ed-Fi emits 3.0 today; the overlay spec works for both.
- **Studio CORS proxy** — POC documents the upload workaround instead.
