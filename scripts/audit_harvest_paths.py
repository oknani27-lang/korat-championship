"""Inspect the saved source and exact GLB names; never save or export Blender."""
import hashlib
import json
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
export = json.loads((root / 'docs/model-export-audit.json').read_text(encoding='utf-8'))
source = Path(export['source'])
glb = root / 'public/models/dmr-machine.glb'
before = hashlib.sha256(source.read_bytes()).hexdigest()
glb_before = hashlib.sha256(glb.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
offset = Vector(export['blenderTranslation'])

def web(point):
    p = point + offset
    return [round(p.x, 7), round(p.z, 7), round(-p.y, 7)]

curves, bounds = [], []
for obj in bpy.context.scene.objects:
    if not obj.visible_get():
        continue
    if obj.type == 'CURVE':
        splines = []
        for spline in obj.data.splines:
            points = spline.bezier_points if spline.type == 'BEZIER' else spline.points
            splines.append({'type': spline.type, 'cyclic': spline.use_cyclic_u,
                            'points': [web(obj.matrix_world @ Vector(p.co[:3])) for p in points]})
        curves.append({'object': obj.name, 'bevelDepth': obj.data.bevel_depth, 'splines': splines})
    if obj.type == 'MESH' and obj.name.startswith(('F101_', 'R201_', 'G201_', 'T301_', 'T302_', 'R401_', 'G401_', 'P401_', 'AIT401_', 'P301_', 'F501_', 'T501_', 'W601_', 'T601_')):
        corners = [web(obj.matrix_world @ Vector(c)) for c in obj.bound_box]
        bounds.append({'object': obj.name, 'min': [min(p[i] for p in corners) for i in range(3)],
                       'max': [max(p[i] for p in corners) for i in range(3)]})
assert hashlib.sha256(source.read_bytes()).hexdigest() == before
assert hashlib.sha256(glb.read_bytes()).hexdigest() == glb_before
report = {'sourceSha256': before, 'glbSha256': glb_before, 'transform': export['axisTransform'],
          'curves': curves, 'bounds': bounds, 'scope': 'Visible saved POLY curves and equipment bounds only. No hydraulic or process validation; no source or GLB written.'}
(root / 'docs/harvest-geometry-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('HARVEST_AUDIT', len(curves), 'curves', len(bounds), 'equipment meshes')
