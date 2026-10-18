# Phase 2C — literature integration

**Latest UI revision:** Search and filter controls have been removed following the user's subsequent instruction. All six cards now show one original article image apiece, with accessible alt text and source attribution. Assets and figure provenance are in `public/research/README.md`; the R02 graphical abstract was extracted from its author manuscript. No generated or unrelated stock images are used. Earlier search/filter notes below describe the initial Phase 2C version; data utilities remain compatible, but those controls are no longer presented.

Six references were transcribed from the supplied prompt and checked against the local `DMR_40L_Complete_Scientific_Engineering_Report_TH.pdf` (53 pages, bibliography page 40; equipment/process roles on pages 7–11 and the traceability sections). Title, DOI and publication year matched Crossref metadata for all six records. Capitalization/italic markup differ between registries; supplied title wording is retained. Long author lists were expanded from the report/registry for search and abbreviated on cards.

| Record | Literature subject | Proposed DMR components |
| --- | --- | --- |
| R01 (2023) | Continuous cultivation on supplemented nitrified urine | T302, R401 |
| R02 (2021) | Electrochemical pH control/full nitrification | EC101, R201 |
| R06 (2023) | Harvesting and medium recycling | F501, T501 |
| R13 (2011) | Struvite phosphorus recovery | R102 |
| R14 (2006) | Candidate pharmaceutical separation by nanofiltration | T301 |
| R15 (2012) | Partial nitrification plus distillation | R201, W601 |

These are report-level component associations, not confirmation that the equipment is built or validated. EC101 is not equated to the R02 experimental apparatus; T301 is a hold/inspection tank rather than an installed nanofiltration unit. R102 is a side branch; its recovered crystals are not automatically food-grade. R15 is not evidence for full nitrification or drinking-water safety. No DMR yields, safety certification or performance figures were introduced. The vessel's 40 L capacity is distinct from the report's assumed 32 L working volume.

## Data and UI

- Reuse `ResearchPaper`, `parseResearch`, `filterResearch`, the Research section and the existing configuration diagnostics. `componentIds` and `category` are optional, preserving old fixtures. `processIds` may be empty to avoid inventing steps.
- All six production records have empty `processIds`; the actual `preview` step, machine registry and model placeholder remain unchanged.
- `researchForStep` resolves curated `researchIds`, declared paper `processIds`, or exact matching active component IDs. Unmatched placeholders yield no links. The expanded sheet links matched records to `#research`; compact content remains unchanged. The generic browser fixture verifies a curated link without modifying production scientific steps.
- Cards show four elements only: title, authors/year, Thai summary and `อ่านงานวิจัยต้นฉบับ`. Evidence/limitations remain in the structured record. Cards use two columns on wider screens and one on mobile without truncating text.
- Keyword search includes all authors, year, research ID, category and related equipment IDs, as well as the previous fields. The existing dropdown provides category and explicit process filtering. Existing no-data and no-match states remain available.
- Only the Navbar Start Demo button was removed. The hero button, in-place Demo entry and original camera/viewer UI remain.

## Source and link verification

Source DOI identifiers:

- R01: https://doi.org/10.1016/j.jenvman.2023.118500
- R02: https://doi.org/10.1021/acs.est.1c00041
- R06: https://doi.org/10.3389/fspas.2023.1229043
- R13: https://doi.org/10.1016/j.watres.2010.10.007
- R14: https://doi.org/10.1016/j.watres.2006.01.038
- R15: https://doi.org/10.1016/j.watres.2011.11.020

Crossref returned HTTP 200 and matching title/year metadata for all six. DOI redirect/HEAD checks returned HTTP 200 for five; ACS returned HTTP 403 for R02 to the automated client. Its identity was confirmed using Crossref, the report and the publisher record, but successful automated publisher access is not claimed. No substitute DOI was invented. Cards use HTTPS links with `target="_blank"` and `rel="noopener noreferrer"`.

The Thai summaries for R13/R14/R15 incorporate the supplied scientific notes to avoid food-grade, universal-removal or potable-water implications; this changes explanatory text, not citations. No title/DOI/year discrepancy was found.

## Verification workflow

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and the complete `npm run test:browser` with the dev server and an available Playwright installation. Added assertions cover the six exact records, search fields, category intersections, valid/unmatched step references, minimal card content, safe links, no Navbar CTA, and responsive research layouts at 1440/1280/768/390/320 px. Use `?case=research-empty` to inspect the retained no-data state.

The delivered final report and browser artifacts record actual execution results. Known upstream THREE.Clock and viewer-size warnings remain. No backend, dependencies, Blender files, GLB/FBX assets, new 3D animation, push or deployment was added.
