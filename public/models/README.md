`dmr-machine.glb` is the static visual export of the saved main Blender file.

- 646 visible source objects, including all 44 pipe curves converted to export meshes.
- 24 equipment groups (`WEB_<tag>`), plus pipework and structure groups.
- Source object names are preserved; assembly groups are added only to the export.
- Blender Z-up is converted to web Y-up; the skid is centered horizontally and placed on the floor without scaling.
- See `docs/model-export-audit.json` for node mapping, source hash, bounds and exclusions.
- This visual model does not validate R102 return routing, recovered-water use or cabinet batch-transfer interfaces.
- Rebuild with Blender in an isolated background process using `scripts/export_dmr_web.py`. Never save a new or modified `.blend` from that script.
