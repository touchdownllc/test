# Profile Studio walkthrough (Track B)

The studio is a browser SPA for the person who *knows what's in use* but isn't a
developer — a data architect, integration lead, vendor PM, or consultant. No
repo clone, no Node toolchain: open a URL, load a Swagger doc, click through it,
download a `profile.yaml`.

> **Screenshots:** capture these in a browser and drop them in `docs/images/`.
> Placeholders below mark each step. (See "Capturing screenshots" at the end.)

## Running it locally

```bash
npm install
npm run build                                    # builds the shared core
npm run dev --workspace edfi-profile-studio      # dev server (Vite, ~localhost:5173)
# or a static build:
npm run build:studio                             # → packages/edfi-profile-studio/dist
```

The static `dist/` is self-contained and deployable to GitHub Pages or any
static host. Once loaded it works **offline** — except fetching a spec from a URL.

## The workflow

### 1. Load a base spec

Three ways, top-left:

- **Load bundled Ed-Fi 5.2 sample** — zero config, recommended for demos.
- **Fetch URL** — paste a Swagger/OpenAPI URL. May hit CORS (see below).
- **Upload file** — a `.yaml`/`.yml`/`.json` you downloaded.

![Loading a spec](images/01-load-spec.png)

### 2. (Optional) Import an existing profile

Click **Load Sample LEA profile** or **Import profile.yaml** to continue prior
work. The studio restores every resource/property annotation.

### 3. Navigate resources (left rail)

The rail lists every resource in the spec with a colored status badge. Filter by
name, or flip **Show only marked** to hide everything you haven't touched.

![Resource list](images/02-resource-list.png)

### 4. Mark up a resource

Select a resource. In the right pane set its **usage status**, `coverage`,
`refreshCadence`, `populatedBy`, and `notes`. Choosing `not-implemented` reveals
a **reason** field and hides the property table (the whole resource is excluded).

### 5. Mark up properties

For in-use resources, the property table shows each field's name, type, and a
red dot if it's **required in the spec**. Per property you can set status,
`coverage`, `source`, and tick **req-impl** (required by this implementation).

![Property markup](images/03-property-markup.png)

### 6. Watch validation live

The floating panel (bottom-right) updates on every change. Mark a spec-required
field as `not-populated` and you'll immediately see the non-conformance error —
the same rule the CLI enforces, because both use `edfi-profile-core`.

![Live validation](images/04-validation.png)

### 7. Export

Set the profile **name** and **version** in the top bar, then **Export
profile.yaml**. Hand that file to whoever runs the generator.

## End-to-end demo script

This is the smoke test in §11 of the handoff — studio output must feed Track A
unchanged:

1. **Load bundled Ed-Fi 5.2 sample.**
2. Mark up the same three resources as the Sample LEA example
   (Student in-use with a partial `middleName` and not-populated
   `citizenshipStatusDescriptor`; StudentSchoolAssociation in-use;
   StudentEducationOrganizationAssociation not-implemented).
3. **Export profile.yaml.**
4. Run it through the CLI:
   ```bash
   node packages/edfi-profile-cli/dist/cli.js generate \
     --profile ~/Downloads/MyProfile.profile.yaml \
     --base    examples/ed-fi-base/openapi-5.2.yaml \
     --out-dir ./output
   ```
5. Confirm matching artifacts — `coverage.md` should match what the studio's
   validation panel showed.

The automated version of this guarantee lives in
`packages/edfi-profile-studio/test/store.test.ts` (load spec → mark up → export →
re-parse + validate with the shared core).

## CORS reality check

Fetching a spec from `https://api.ed-fi.org/...` will usually fail CORS in the
browser. The studio surfaces a clear error telling you to download the spec and
upload it instead. The bundled sample covers most demos with zero config. A tiny
optional fetch proxy is noted as future work (out of POC scope).

## Capturing screenshots

The build is verified; only the images are a manual step. With the dev server
running:

1. `npm run dev --workspace edfi-profile-studio`
2. Open the printed localhost URL.
3. Walk steps 1–7 above, screenshotting each, saving to `docs/images/01-…png`
   etc. (Or record a short GIF for the README — the most compelling demo asset.)
