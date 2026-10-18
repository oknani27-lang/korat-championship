# DEMETER ReFeed — Phase 1.1

React + TypeScript + Vite + Tailwind CSS + Three.js + React Three Fiber + Drei + Lucide.

## Run locally

Requires Node.js 22.12+ (validated on Node 24.20) and npm.

```sh
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run preview
```

Open the local URL printed by Vite. This is local-only work; no backend, database, AI service, analytics, hosting account or remote model request is used.

## Design and scope

Premium white studio viewport, minimal navigation, right-side camera toolbar and soft-white process sheet. The latest design was compared with the supplied reference. The left hero contains only DEMETER ReFeed, Turn Waste Into New Value and Start Demo. It does not copy the Apple recreation's code, brand assets or imagery.

The three neutral cylinders are **UI layout placeholders, not a scientific representation of DMR**. No real machine is loaded. The sole example step is explicitly unverified. Prev/Next are correctly disabled at the boundaries; adding confirmed steps enables them automatically. No results or chemical claims are invented. The page now starts with a Compact process sheet; the full three-column desktop sheet is available through its handle or details button.

## Interactions

- Orbit: left drag; pan: right drag (or Pan tool + left drag); zoom: wheel, middle drag or Zoom tool + left drag. Touch: one finger rotates/pans according to the active mode; two fingers zoom/pan. Zoom buttons and Reset are provided. The camera has bounded zoom and polar angles.
- X-Ray toggles the existing **wireframe placeholder preview** while no model is configured. Phase 2A also provides scoped shell transparency/material restoration for future mapped models, demonstrated only on generic fixtures. This is not a validated DMR internal simulation.
- Parts opens a pending-data panel. With a populated registry, hovering highlights an instance-owned material, clicking toggles selection, and choosing a mapped object/group auto-focuses its bounds. Clear selection and Reset Overview are available. Real-model material behavior still needs verification.
- Bottom sheet expands/collapses with a short CSS grid transition. Hidden content is inert for keyboard access. Navigation uses working anchors; the mobile navigation closes after selection.
- Start Demo enters Demo Mode without changing scroll position or the URL hash, and preserves the Canvas. Manual controls are enabled on entry; the sheet remains Compact until expanded by the user.
- The 30-second UI-only timeline plays, pauses, restarts and scrubs backward/forward within the selected step. A shared reducer owns Demo Mode, current step, normalized per-step progress, selected part, sheet state and playback. Previous/Next and step buttons change steps, stop playback and reset progress. The timer stops at completion, pause, unmount, and while the document is hidden. No fluid or machine animation is driven by this preview.

## Source map

| File | Responsibility |
| --- | --- |
| `src/App.tsx` | Navbar, overall viewport composition, explanatory sections |
| `src/components/viewer/MachineViewer.tsx` | Demand-rendered Canvas, camera, lighting, placeholder, toolbar, fallback |
| `src/components/viewer/MachineModel.tsx` | Future GLB loading, node mapping, selection and hover boundary |
| `src/components/bottom-sheet/ProcessSheet.tsx` | Process, chemistry, outputs, sheet state and preview timeline |
| `src/simulation/timeline.ts` | Pure normalized-progress and step-range functions |
| `src/simulation/simulator.ts`, `useSimulator.ts` | Shared simulator reducer and playback lifecycle |
| `src/simulation/timeline.test.ts` | Boundary, seeking and invalid-configuration self-checks |
| `src/types/machine.ts` | Typed model/parts/flow/step contracts |
| `src/data/*.json` | Compile-time configuration, no untrusted remote JSON |
| `src/data/parse.ts` | Runtime validation and typed conversion of JSON formulas, vectors, IDs and ranges |
| `src/styles/app.css` | Responsive component styles and reduced-motion support |

## Integrate the real Blender GLB later

1. Save the engineering project separately; do not overwrite the original FBX or `.blend`. Verify units, pivots, materials and mesh budgets. Export **a copy** as GLB, with stable unique node names and independently selectable objects where needed. This phase did not modify or export Blender data.
2. Put the approved file at `public/models/dmr-machine.glb`.
3. Set `modelUrl` in `src/data/config.ts` to `/models/dmr-machine.glb`. The placeholder is replaced automatically by `MachineModel`; no sheet or navbar rewrite is needed. Frame/scale the verified model and adjust initial camera/target in `MachineViewer` to its actual bounds. Do not assume its physical scale matches the placeholder.
4. Populate `src/data/machine-parts.json` using exact Blender node names:

```json
[{ "id": "confirmed-part-id", "nodeName": "ExactBlenderNodeName", "label": "ชื่อชิ้นส่วนที่ยืนยัน", "focus": [0, 0, 0] }]
```

`focus` is a viewer-world-space target override or `null`. Phase 2A preserves hierarchy with skeleton-aware cloning and disposes instance-owned material/bone-texture resources while preserving shared cached GLB assets. Real rigged-model animation is not implemented. See `PHASE2A.md` for normalization, ownership and coordinate contracts.

5. Populate `flow-paths.json` only from the verified diagram:

```json
[{ "id": "confirmed-flow-id", "partIds": ["confirmed-part-id"], "points": [[0, 0, 0], [1, 0, 0]] }]
```

6. Add verified steps to `process-steps.json` using `ProcessStep`. Every step supports `title`, `subtitle`, `description`, `formulas`, `outputs`, `activeParts`, `flowPaths`, `cameraFocus` and `timeline`. Timeline ranges must be contiguous from 0 to 1, with no overlap/gap; they are validated on startup. IDs must be nonempty and unique within each file. JSON parsers validate formula token kinds and finite three-number camera/part/flow coordinates before exposing typed data. Formula tokens use `text`, `sub` or `sup`, rendered as real HTML sub/sup without raw HTML injection. Example syntax only: `[{"kind":"text","text":"A"},{"kind":"sub","text":"2"}]`.
7. Lift `progress` from `ProcessSheet` to the shared App/controller when connecting real visual animation. Pass the same value to flow, fluid level, material/X-Ray and step controllers; compute visuals from progress directly so reverse scrubbing is deterministic. These model-dependent controllers are intentionally not implemented yet.
8. Implement material highlighting and Smart X-Ray on cloned materials after parts are known; restore/dispose owned materials on unmount. Keep heavy meshes opaque unless required. Add real mobile-device profiling and GLB error/loading tests.

## Performance and verification limits

Demand rendering, DPR capped at 1.5, no external environment textures, no postprocessing or fluid physics. One low-resolution contact shadow is rendered once. The Three.js viewer is lazy-loaded so the document/UI can render first; the renderer still carries a substantial necessary WebGL bundle. Timers are cleaned up. Controls and Canvas resources are managed by R3F/Drei. WebGL failures have a readable fallback.

Build, lint and timeline checks are available above. Browser QA is performed separately from production source; see the delivered report for the actual checks passed. Mobile viewport emulation is not a real mobile GPU benchmark; 60 FPS is a target, not a guarantee. No real GLB, science data, Smart X-Ray internals or fluid animation has been validated.

## Regression audit

`npm run lint` runs ESLint and Oxlint; `npm run typecheck` also checks unit tests and the browser harness. The production build does not include the harness or synthetic fixtures. No real process dataset or Blender file is changed by the tests.

With an existing Playwright installation and Chrome, start `npm run dev` in one terminal and run the following in another:

```powershell
# If playwright resolves normally, omit this variable. Otherwise set its installed module folder.
$env:DMR_PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
npm run test:browser
```

The browser runner defaults to `http://127.0.0.1:5173`, can use `DMR_TEST_URL`, and writes ignored `test-results/` artifacts (or `DMR_TEST_OUTPUT`). The suites cover desktop/tablet/mobile, touch, context loss/recovery, lazy import failure, synthetic GLTF selection, long text, multiple steps and timer/resource cleanup. Intentional failure cases retain their expected console/network errors in the JSON report. Normal-path tests reject console errors, page errors and failed network requests.

## Phase 1.1 integration contracts

### Research

`src/data/research.json` contains six literature references (R01, R02, R06, R13, R14, R15), checked against `DMR_40L_Complete_Scientific_Engineering_Report_TH.pdf` and DOI registry metadata. Each record is validated by `parseResearch`. These are literature evidence, not experimental validation of DMR. Generic layout/search fixtures remain separate in the dev test harness.

Fields: `id`, `title`, `authors` (array), `year`, `publication` (journal or publisher), optional `doi`, `sourceUrl`, optional `pdfUrl`, `summary`, `processIds`, `supports`, `limitations`, and `unverifiedClaims` (the last three are arrays of concise statements). Omit unknown optional fields. Source URLs must be HTTP(S); PDFs can also use a same-origin absolute path such as `/papers/verified-document.pdf`. Put local PDFs in `public/papers/`. DOI values use their identifier, not a full resolver URL.

Optional `category` and `componentIds` provide literature categorization and the report's proposed equipment associations. `processIds` contains only matching real process IDs and may be empty while the simulator has placeholder steps. Each process may additionally hold curated `researchIds`. The expanded sheet resolves these IDs, paper process IDs, or exact matching active component IDs through `researchForStep`; it links to Research without adding content to the compact sheet. No production placeholder was renamed or linked artificially.

Cards show one original research figure with attribution, title, authors/year, concise Thai summary and the original-source link. Search and filter controls were removed at the user's request; all six records remain visible. Figure files are local in `public/research/`, with provenance documented in its README. Images load lazily and use contain sizing without cropping the research content. Scientific support, limitations and unverified claims remain in structured data; they do not certify the DMR hardware. See `PHASE2C.md` for traceability and link-check limitations. The Navbar Start Demo button was removed; the hero button retains in-place Demo entry.

### Sheet and timeline

Compact is the default. It shows the current step number/title, Manual Timeline and Previous/Next controls. Expanded reveals the full process, formulas and outputs; desktop stays three columns and mobile stacks. The sheet sits after the responsive viewport in normal document flow, so expanding it never covers the viewer toolbar. All content remains scrollable. Its handle/details button expands it explicitly. Changing this view state does not reset or duplicate the Canvas or playback timer.

### Machine / process additions

- `MachinePart.id` is the stable component ID; `nodeName` is the exact GLB node or parent assembly name. Optional `xrayNodeNames` names internal nodes and `connectionPoints` provides `{id, position: [x,y,z]}`. Connection positions are local to their mapped node; a future controller must transform them through that node's world matrix.
- `FlowPath` retains `id`, `partIds` and world-space `points`. Optional `from`/`to` references use `{partId, connectionId}` and are checked against the parts registry.
- `ProcessStep` retains the existing formulas, descriptions, outputs, camera focus and active parts. Optional `activeXrayParts` holds component IDs, and optional `researchIds` holds paper IDs.
- Optional `timeline.phases` holds `{id, start, end}` with global normalized 0–1 times, bounded by the owning step. Overlap/gaps between phases are allowed for future parallel effects; step ranges themselves still cover 0–1 without gaps/overlap.
- `viewerQuality` in `src/data/config.ts` controls DPR range, contact-shadow enablement and resolution. Defaults remain DPR 1–1.5 and a 128-pixel, single-frame contact shadow. No extra quality-switch UI or GPU effects were added.

Set `modelUrl` to `/models/dmr-machine.glb` only after placing the approved file in `public/models/`. `MachineViewer` also accepts typed `url`, `registry` and `quality` props for integration/testing. Loading shows a DOM status; a missing/invalid file falls back to a clearly marked placeholder with the actual error detail. Loaded models validate registry and X-Ray node names. Unmapped parts are reported and disabled in the Parts panel; remaining camera interaction is preserved. Changing the source reuses the same Canvas. Contact shadows regenerate after loading or WebGL restoration rather than leaving an empty cached shadow.

Invalid configuration is exposed through `dataIssues` with the original parser detail. Other sections stay usable. Missing process metadata shows its own pending state and does not start a timeline. GLB error recovery and research JSON validation are not a substitute for real-model/research review.

The browser regression suite covers Start Demo without scrolling, per-step timeline synchronization, rapid navigation, Compact/Expanded geometry, Research records/search/filter/empty states, metadata fallback, async loading, invalid mapping, camera context cleanup, material restoration and reversible generic flow paths without a second Canvas. GLB-related tests use generic glTF fixtures, not a DMR model. See `PHASE2A.md` and `PHASE2C.md` for current integration notes. Real DMR model integration, scientific machine animation and validation remain pending.

Known upstream warning: R3F 9.8.2 constructs `THREE.Clock`, which Three.js deprecated since r183. This audit does not silence warnings, patch node_modules, or migrate the app to an unstable renderer major. The warning is nonfatal. The lazy viewer chunk also remains above Vite's 500 kB advisory threshold. See `AUDIT.md` for findings, evidence and push readiness.
