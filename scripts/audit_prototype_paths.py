"""Read saved Blender geometry without saving or exporting any model."""
import hashlib
import json
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
export = json.loads((root / 'docs/model-export-audit.json').read_text(encoding='utf-8'))
source = Path(export['source'])
before = hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
offset = Vector(export['blenderTranslation'])

def web(point):
    p = point + offset
    return [round(p.x, 7), round(p.z, 7), round(-p.y, 7)]

curves = []
for obj in bpy.context.scene.objects:
    if obj.type != 'CURVE' or not obj.visible_get():
        continue
    if obj.name not in ['WF2_T101_P101', 'WF2_P101_EC101', 'WF2_EC101_F101', 'WF2_F101_R201', 'WF2_F101_R102_OPTION', 'WF2_R102_F101_TRANSFER']:
        continue
    splines = []
    for spline in obj.data.splines:
        points = spline.bezier_points if spline.type == 'BEZIER' else spline.points
        splines.append({'type': spline.type, 'cyclic': spline.use_cyclic_u,
                        'points': [web(obj.matrix_world @ Vector(p.co[:3])) for p in points]})
    curves.append({'object': obj.name, 'bevelDepth': obj.data.bevel_depth, 'splines': splines})

bounds = []
for obj in bpy.context.scene.objects:
    if obj.type != 'MESH' or not obj.visible_get():
        continue
    if not obj.name.startswith(('T101_', 'EC101_', 'F101_', 'P101_')):
        continue
    vertices = [web(obj.matrix_world @ Vector(corner)) for corner in obj.bound_box]
    bounds.append({'object': obj.name, 'min': [min(v[i] for v in vertices) for i in range(3)],
                   'max': [max(v[i] for v in vertices) for i in range(3)]})

assert hashlib.sha256(source.read_bytes()).hexdigest() == before
report = {'sourceSha256': before, 'glbSha256': hashlib.sha256((root / 'public/models/dmr-machine.glb').read_bytes()).hexdigest(),
          'transform': export['axisTransform'], 'curves': curves, 'bounds': bounds,
          'scope': 'Geometry audit only; no hydraulic or scientific validation. No source file saved.'}
(root / 'docs/prototype-geometry-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('PROTOTYPE_CURVES ' + json.dumps(curves))
