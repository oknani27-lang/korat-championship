# Phase 2A — simulation infrastructure

Local branch: `feature/dmr-3d-integration`, based on `main` / `dmr-phase1.1-stable` (`3640ca0`). No final machine, science data, Blender files or deployment is included.

## Run the generic demonstration

```sh
npm install
npm run dev
```

Open `/tests/harness.html?case=integration` on the dev server. This page is a clearly labelled **software fixture**, separate from the public homepage. It generates a small generic cube scene as an in-memory glTF data URL; no GLB/FBX file or DMR machine asset is created. `/tests/harness.html?case=integration-normalized` demonstrates explicitly configured bounds normalization.

- Start Demo enables the existing per-step timeline.
- Early phase exposes a transparent generic shell around another selectable object. Scrub forward/backward to restore it deterministically.
- Later phase enables two named polyline routes, including one reversed route with a local start/end range.
- Open Parts under the existing secondary toolbar. Select/toggle/clear a generic group or object; selection auto-focuses its world bounds. Orbit/wheel/pan interrupts the camera transition. Reset Overview cancels motion and clears selection.
- Normal restores normal part surfaces; the override is reset when changing steps. Manual X-Ray targets the selected or active parts, rather than fading the entire scene by default.
- Unmount/Mount exercises resource lifecycle. All names, paths and phases on this page are generic test data, never DMR definitions.

The test entry and its fixture are not entry points/assets in the production build. The public site still has `modelUrl = null`, empty machine parts/flows and the original placeholder geometry/UI.

## Architecture and ownership

| Module | Interface / responsibility |
|---|---|
| `src/simulation/model.ts` | `createModelInstance(source, parts, transform)` returns cloned hierarchy, named-node index, part registry, diagnostics, `partFor`, `partBounds`, and skeleton cleanup |
| `src/simulation/materials.ts` | `createMaterialController(instance)` applies normal/hover/selected/active/X-Ray states, restores original material/raycast references and disposes owned variants |
| `src/simulation/camera.ts` | Validated bounds-to-pose calculation and the existing Overview pose |
| `src/components/viewer/CameraMotion.tsx` | Owns OrbitControls and an imperative focus/cancel/reset/zoom interface; demand-driven smooth transitions, reduced-motion support and user interruption |
| `src/simulation/visual-state.ts` | Pure `processVisuals(step, progress, demoMode)` and `flowProgress(path, progress)` functions |
| `src/components/viewer/FlowPaths.tsx` | Shared marker geometry/material, one line and one marker per enabled route; no physics or continuously running animation loop |
| `src/components/viewer/MachineModel.tsx` | GLTFLoader via Drei, instance/visual lifecycle, pointer hover and selection toggle |
| `src/simulation/useSimulator.ts` | Existing central reducer plus a derived visual descriptor; no duplicate process or timeline state |

The existing Canvas remains mounted across selection, step and progress changes. Model and flow components stay lazy. Empty production process metadata returns a shared inactive visual descriptor, so progress-only UI updates do not repeatedly pass fresh empty visual objects into the viewer.

### Model and asset lifecycle

`useGLTF` owns a shared source cache. Each viewer clones the object/skeleton hierarchy; geometry, original materials and textures are shared read-only. The material controller owns only its per-mesh material variants. Cleanup restores original references and raycasts, disposes variants and any instance-owned skeleton bone textures. Flow geometry/materials are disposed by their component; Canvas disposal is handled by R3F.

Source geometry/materials/textures are deliberately **not** destroyed when one instance unmounts. They may be in use by another viewer or the shared loader cache. An eviction policy is still needed if a future product streams many distinct asset URLs; the current site has one configurable model URL. Repeated operations on the same fixture do not grow the measured GPU geometry/texture counts.

### Required future model configuration

1. Provide a verified `.glb`, actual units/pivots, unique stable node names and a module/node manifest. Keep original Blender/engineering files separately.
2. Set `modelUrl` in `src/data/config.ts` after placing the approved asset in `public/models/` or a permitted same-origin asset route.
3. `modelTransform` defaults to `{}`: no implicit scale or recentering. Optional `scale` **or** `fitSize` must be finite and positive; `center` is opt-in. A wrapper applies normalization without rewriting the source hierarchy/local node transforms. Validate the resulting engineering coordinate frame first.
4. Each `MachinePart` has a unique `id`, primary `nodeName`, optional extra `nodeNames` for one module, label and optional world-space `focus` override. Nested parts resolve to the nearest mapped ancestor. Missing/ambiguous nodes and X-Ray nodes owned by a different part produce diagnostics.
5. Use `xrayNodeNames` to identify only the shell surfaces to ghost for that part. Without this field, the part's owned meshes are the fallback. Scope these surfaces carefully on a real model: defaulting a large module to transparency can still be expensive. Ghost meshes use single-pass/front-side transparency with depth writing disabled and do not block clicks on interior objects. This reduces common artifacts but cannot eliminate all transparency sorting cases.
6. Camera focus, explicit part focus overrides and flow control points are in **final viewer world coordinates**, after any configured normalization. Do not assume original Blender coordinates remain appropriate after scaling/centering.
7. Current Orbit limits remain 2.8–12 world units and the existing Overview pose; verify/adjust these against real bounds. Bounds focus respects these limits. A pose transition is approximately 350ms, interrupted by user control start or Zoom/Reset buttons. Reduced motion applies the pose immediately.

Model loading/parse/normalization errors remain contained by the existing local boundary with original error details. Missing mappings keep the scene visible with diagnostics. Duplicate mapping declarations are rejected by data validation.

### Timeline and visual contracts

The reducer still owns Demo Mode, current step ID, local normalized progress, selected part ID, sheet expansion and playback. A step change atomically stops playback, clears selection and resets progress.

- `activeParts`, `activeXrayParts`, `flowPaths`, `cameraFocus` and `researchIds` stay on the current typed `ProcessStep`.
- Existing `timeline.start/end` and optional phase ranges remain global 0–1 metadata. The visual adapter maps local step progress to that range. Phases are `[start, end)`, except the final endpoint at step completion is included.
- Each `TimelinePhase` can add `activeXrayParts`, `flowPaths`, and reserved `effectIds`. The derived descriptor exposes active part/X-Ray/path IDs, phase IDs, effect IDs and normalized progress. No internal reactor effect is implemented.
- Each `FlowPath` has an ID, ordered finite 3D points (at least two distinct positions), optional `direction: 'forward' | 'reverse'`, and an optional **step-local** `phase: { start, end }` between 0 and 1. Part/connection references retain their existing validation.
- Flow position is piecewise linear by path distance, recalculated directly from progress. Moving the slider backward restores the prior visual state; no transforms accumulate. Paths are inactive when unreferenced or outside their local range.
- With no verified flow paths, the public page renders no flow geometry. There is no fluid physics, particle simulation or chemistry assumption.

Before enabling real effects, supply verified process definitions, shell/interior visibility requirements, route coordinate data, camera definitions and evidence/research IDs. Then test the real asset's shader/material/geometry budgets on target GPUs and mobile hardware.

## Verification

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:browser` with a local dev server and an existing Playwright installation (`DMR_PLAYWRIGHT_MODULE` when needed). The suite accepts `DMR_TEST_FILTER` for focused diagnosis; the complete run must omit that filter.

Unit coverage includes hierarchy/registry, explicit normalization, invalid mapping/transform/flow/phase data, shared-source isolation, material restoration and allocation bounds, instance skeleton cleanup, camera bounds and deterministic forward/reverse progress.

Browser coverage includes the existing UI/Start Demo/controls/timeline/research/fallback checks plus generic hover/selection, click-through X-Ray, interruptible focus and repeated Reset, multiple reversible flows, invalid assets, explicit normalized bounds and repeated Canvas disposal. Test fixtures do not constitute scientific validation.

Known upstream warning: R3F constructs deprecated `THREE.Clock`. The viewer also remains above Vite's 500KB advisory threshold. Neither warning is suppressed. See the delivered Phase 2A report for actual measured results and screenshots. No real DMR model, GPU FPS target or cross-browser hardware performance has been validated.
