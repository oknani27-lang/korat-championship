# Layout: controls below the model, chemistry/simulation on the right

19 October 2026

- Moved Rotate, Zoom, X-Ray, Reset and More into a horizontal control row below the model. Existing zoom buttons remain in that row, wrapping beneath it on narrow screens.
- Moved chemistry and the animated process schematic into two always-visible cards to the right of the model. The lower sheet contains the process step, outputs, timeline and step navigation. No duplicate chemistry or schematic is rendered there.
- At widths up to 1000 px the cards sit below the model; on mobile they stack vertically. The model has a stable viewport height so changing process content does not refit/reset the user's camera.
- More opens upward. Its controls stay above loading/invalid-model notices, including fallback cases. The Parts panel remains inside the model area.
- Playback, equations, schematic frames, particles, GLB and Blender source are unchanged. Start Demo and Next still play automatically; no popup, collapse controls or Play/Pause buttons were added.

Files changed for this layout: `src/App.tsx`, `src/components/viewer/MachineViewer.tsx`, `src/components/bottom-sheet/ProcessDetails.tsx`, `ProcessSheet.tsx`, `src/styles/app.css`, `tests/process-chemistry.cjs`, `tests/browser-audit.cjs`, `tests/model-integration.cjs`, README and this report.

Validation: typecheck, unit tests, scoped ESLint/Oxlint and production build pass. Chemistry/layout checks pass at 1440/768/390/320 px across all 12 process stages, including automatic step navigation and completion. Model integration passes at 1440/768/390 px and missing-model fallback. The browser regression covers the horizontal toolbar, menu stacking, camera controls, timer lifecycle, responsive layout and fallback.

Desktop/mobile screenshots were inspected. Current workspace screenshots are in `test-results/process-chemistry/cultivation-1440.png` and `cultivation-390.png`, with other stages and widths in the same ignored output folder. Earlier animation reports describe the previous placement of chemistry/schematics; this report supersedes those placement details only.

Existing build warning: the Three.js viewer bundle exceeds 500 kB. Existing dependency warning: `THREE.Clock` deprecated. No normal-path console errors observed. No commit, push or deployment performed.

## Compact viewport follow-up

Reduced desktop header from 100 to 60 px (mobile 54 px), brand/CTA sizing and camera controls. Desktop workspace now responds to viewport height, reserving room for the lower process sheet and timeline. Chemistry and simulation cards each keep a visible area; long explanations remain available through scrolling inside the cards. Formula blocks precede the explanatory text on desktop so formulas and the schematic are both visible. Mobile retains stacked, readable cards and page scrolling.

`tests/viewport-fit.cjs` passes at 1520×860, 1440×900, 1366×768, 1280×720, 1024×768 and 390×844. Across 13 sampled times (including pending stages and completion), the entire lower sheet fits without page scrolling at all tested desktop sizes. Toolbar does not overlap the canvas and no horizontal page overflow is present. Inspected `test-results/viewport-fit/fit-1366-768.png`. Production build passes.

## Restored Play/Pause

The timeline now has a Play/Pause button again, using the existing shared `togglePlayback` action. Before Start Demo it is disabled. Pause freezes time; Play resumes; Play after completion starts at zero. Start Demo and Next retain automatic playback. Viewport-fit browser checks also cover these interactions at all six tested screen sizes. This supersedes earlier statements about no Play/Pause controls.

## Responsive follow-up for touch and landscape

Enabled `viewport-fit=cover` and applied safe-area insets to the compact header, stage gutters, lower sheet and footer. Touch-capable devices receive at least 44 px controls for camera actions and timeline transport, with a taller seek target. On landscape screens with little vertical space, the model stage contracts to the available height; medium-width landscape layouts place the model beside the chemistry/schematic cards so they can be reached without a very long vertical stack. At widths below that layout threshold, the existing single-column flow remains in place.

Expanded `tests/viewport-fit.cjs` to exercise 320×740, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1180×820, 1366×768, 1440×900, plus 844×390, 960×540 and 1280×600 landscape/short-height cases. It enables touch emulation, captures viewport screenshots, checks orientation media queries and verifies interactive targets are not undersized. The browser run passes all 14 sizes; at 360×800, 390×844 and 430×932 the step navigation fits inside the initial viewport. Screenshots include `test-results/viewport-fit/fit-360-800.png` and `fit-390-844.png`. Typecheck, unit tests, `eslint src`, `oxlint src`, test-script syntax validation and production build pass. Full repository `npm run lint` reports existing errors in helper scripts under `new-chat/` and `scripts/`; those files were not changed. These are browser emulation results, not a hardware performance claim.

## Mobile step access follow-up

On stacked layouts (up to 1000 px), the process sheet appears immediately after the model and before the longer chemistry and schematic cards. On narrow phones, the process controls follow the current step heading and explanation, ahead of the output details. The mobile model stage is 290 px tall, preserving the full equipment overview while bringing the active step and Next/Previous controls into the first viewport at 360×800 and wider tested phones. The desktop two-column placement is retained; compact landscape tablet keeps model and details side by side, with the process sheet below both. The viewport regression asserts this order, checks Next/Previous visibility and passes at all 14 tested sizes. Screenshots are browser emulation and do not represent physical device performance.
