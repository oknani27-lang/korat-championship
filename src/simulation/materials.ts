import { Color, FrontSide } from 'three'
import type { Material, Mesh } from 'three'
import type { ModelInstance } from './model.ts'

interface MaterialState { selectedPartId: string | null; hoveredPartId: string | null; activePartIds: string[]; xrayPartIds: string[] }
export function createMaterialController(model: ModelInstance) {
  const originals = new Map(model.meshes.map(mesh => [mesh, { material: mesh.material, raycast: mesh.raycast }]))
  const variants = new Map<Mesh, Material[]>()
  const applied = new Map<Mesh, string>()
  function apply(state: MaterialState) {
    let changed = false
    for (const mesh of model.meshes) {
      const part = model.partFor(mesh)
      const id = part?.definition.id
      const kind = id === state.selectedPartId ? 'selected' : id === state.hoveredPartId ? 'hovered' : id && state.activePartIds.includes(id) ? 'active' : 'normal'
      const ghost = !!id && state.xrayPartIds.includes(id) && !!part?.xrayMeshes.has(mesh)
      const key = `${kind}:${ghost}`
      if (applied.get(mesh) === key) continue
      applied.set(mesh, key)
      const original = originals.get(mesh)!
      if (kind === 'normal' && !ghost) { changed ||= mesh.material !== original.material; mesh.material = original.material; mesh.raycast = original.raycast; continue }
      changed = true
      const sources = Array.isArray(original.material) ? original.material : [original.material]
      const materials = variants.get(mesh) ?? sources.map(material => material.clone())
      variants.set(mesh, materials)
      materials.forEach((material, index) => {
        const previousTransparent = material.transparent
        material.copy(sources[index])
        if ('color' in material && material.color instanceof Color && kind !== 'normal') material.color.set(kind === 'selected' ? '#45c5ed' : kind === 'hovered' ? '#a9dce8' : '#7cc8d4')
        if (ghost) { material.transparent = true; material.opacity = 0.18; material.depthWrite = false; material.side = FrontSide; material.forceSinglePass = true; material.polygonOffset = true; material.polygonOffsetFactor = -1; material.polygonOffsetUnits = -1 }
        if (material.transparent !== previousTransparent) material.needsUpdate = true
      })
      mesh.material = Array.isArray(original.material) ? materials : materials[0]
      // Ghost shells must not intercept clicks on the still-selectable objects inside.
      mesh.raycast = ghost ? () => {} : original.raycast
    }
    return changed
  }
  function dispose() {
    for (const [mesh, original] of originals) { mesh.material = original.material; mesh.raycast = original.raycast }
    for (const materials of variants.values()) for (const material of materials) material.dispose()
    variants.clear(); applied.clear()
  }
  return { apply, dispose, get ownedMaterialCount() { return [...variants.values()].reduce((count, materials) => count + materials.length, 0) } }
}
