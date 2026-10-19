"""Run with Blender --background --factory-startup --python this_file.

Only export copies in an isolated process. Never save a .blend file.
"""
import csv
import hashlib
import json
import re
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'new-chat/DMR_Reference_Pipes_20261019_122113/DMR_Reference_Pipes_R102_Fixed.blend'
INVENTORY = ROOT / 'new-chat/new-chat/output/DMR_Linear_Blueprint_RevF/Part_Inventory.csv'
DEST = ROOT / 'public/models/dmr-machine.glb'
REPORT = ROOT / 'docs/model-export-audit.json'
before_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
source_scene = bpy.context.scene
rows = list(csv.DictReader(INVENTORY.open(encoding='utf-8-sig')))
labels = {r['tag']: r['name'] for r in rows}
labels.update({'P101': 'ปั๊มจ่ายวัตถุดิบ', 'P301': 'ปั๊มจ่ายอาหารเพาะ'})
tags = sorted(labels, key=len, reverse=True)
visible = [o for o in source_scene.objects if o.visible_get() and o.type in {'MESH', 'CURVE', 'FONT'}]
excluded = [o.name for o in source_scene.objects if o.type in {'MESH', 'CURVE', 'FONT'} and not o.visible_get()]
depsgraph = bpy.context.evaluated_depsgraph_get()

def classify(obj):
    name = obj.name
    # Explicit mapping for the only imported vessel with a non-tagged name.
    if name == 'phosphase':
        return 'R102'
    if name.startswith('Beacon_Light'):
        return 'PLC901'
    # Cross-equipment routes belong to pipework, not either vessel assembly.
    if obj.type == 'CURVE' or name.startswith(('WF2_', 'REF_', 'PORT_')):
        return 'PIPEWORK'
    if name.startswith(('Filtrate_In_NC', 'Wash_Effluent_In_NC')):
        return 'W601'
    if name.startswith('Water_Return_NC'):
        return 'T601'
    if name.startswith('Wash_Water_NC'):
        return 'T501'
    if name.startswith(('PT_Sealed_Sachet_', 'PT_Sachet_')):
        return 'PK801'
    found = [t for t in tags if re.search(r'(?<![A-Z0-9])' + re.escape(t) + r'(?=[_.\s]|$)', name)]
    if len(found) == 1:
        return found[0]
    return 'PIPEWORK' if len(found) > 1 or name.startswith('PT_') else 'STRUCTURE'

# Evaluated copies preserve modifiers, text and curve geometry without editing source topology.
copies = []
for obj in visible:
    name = obj.name
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph)
    if not mesh or not mesh.vertices:
        raise RuntimeError('Visible object has no exportable geometry: ' + name)
    copies.append((name, classify(obj), mesh, obj.matrix_world.copy(), obj.type))

world_points = [matrix @ v.co for _, _, mesh, matrix, _ in copies for v in mesh.vertices]
lo = Vector([min(v[i] for v in world_points) for i in range(3)])
hi = Vector([max(v[i] for v in world_points) for i in range(3)])
offset = Vector((-(lo.x + hi.x)/2, -(lo.y + hi.y)/2, -lo.z))
scene = bpy.data.scenes.new('DMR_Web_Export')
bpy.context.window.scene = scene
groups = {}
for tag in list(labels) + ['PIPEWORK', 'STRUCTURE']:
    group = bpy.data.objects.new('WEB_' + tag, None)
    scene.collection.objects.link(group)
    group['equipmentId'] = tag
    groups[tag] = group

# Free only the names in this disposable process; the source file is never written.
for name, _, _, _, _ in copies:
    bpy.data.objects[name].name = 'SOURCE_' + name
manifest = []
for name, tag, mesh, matrix, original_type in copies:
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.parent = groups[tag]
    obj.matrix_world = Matrix.Translation(offset) @ matrix
    obj['sourceObjectName'] = name
    manifest.append({'sourceName': name, 'exportName': obj.name, 'assembly': 'WEB_' + tag, 'sourceType': original_type})

bpy.context.view_layer.update()
DEST.parent.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(DEST), export_format='GLB', use_active_scene=True,
                          export_animations=False, export_cameras=False, export_lights=False,
                          export_extras=True, export_yup=True)

# Verify exported JSON, not just Blender names. Primitive count may exceed object count.
raw = DEST.read_bytes()
length, kind = struct.unpack_from('<II', raw, 12)
assert kind == 0x4E4F534A
gltf = json.loads(raw[20:20 + length])
node_names = {n.get('name') for n in gltf['nodes']}
missing = [m['exportName'] for m in manifest if m['exportName'] not in node_names]
assert not missing, missing
parts = []
for tag, label in labels.items():
    members = [o for o in groups[tag].children if o.type == 'MESH']
    assert members, 'Empty equipment assembly: ' + tag
    vs = [o.matrix_world @ Vector(v) for o in members for v in o.bound_box]
    a = Vector([min(v[i] for v in vs) for i in range(3)])
    b = Vector([max(v[i] for v in vs) for i in range(3)])
    center = (a + b)/2
    parts.append({'id': tag, 'nodeName': 'WEB_' + tag, 'label': tag + ' · ' + label,
                  'focus': [round(center.x, 6), round(center.z, 6), round(-center.y, 6)]})
(ROOT / 'src/data/machine-parts.json').write_text(json.dumps(parts, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
after_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert before_hash == after_hash, 'Source .blend changed!'
report = {'source': str(SOURCE), 'sourceSha256Before': before_hash, 'sourceSha256After': after_hash,
          'sourceUnchanged': True, 'export': 'public/models/dmr-machine.glb', 'glbBytes': len(raw),
          'visibleSourceObjects': len(visible), 'exportedSourceObjects': len(manifest),
          'excludedHiddenObjects': excluded, 'missingExportNodes': missing,
          'curveCount': sum(m['sourceType'] == 'CURVE' for m in manifest),
          'triangles': sum(gltf['accessors'][p['indices']]['count'] // 3 for m in gltf['meshes'] for p in m['primitives']),
          'materials': len(gltf.get('materials', [])), 'images': len(gltf.get('images', [])),
          'blenderTranslation': list(offset), 'axisTransform': 'web = [x, z, -y] after translation; no scale change',
          'sourceBounds': {'min': list(lo), 'max': list(hi)},
          'assemblyMemberCounts': {tag: len(group.children) for tag, group in groups.items()},
          'nodes': manifest,
          'limitations': ['Static concept model, not validated process routing',
                         'R102 -> F101 and the upstream R102 tee remain unchanged and unverified',
                         'Water return requires intended-use approval',
                         'Cabinet product-transfer pipe interfaces remain illustrative',
                         'Export reads the saved main file; unsaved live-session edits are not exported']}
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('DMR_EXPORT_RESULT ' + json.dumps({k: report[k] for k in ['sourceUnchanged', 'glbBytes', 'visibleSourceObjects', 'exportedSourceObjects', 'curveCount', 'materials', 'images', 'assemblyMemberCounts']}))
