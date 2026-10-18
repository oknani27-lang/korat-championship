import { Box3, Group, Mesh, SkinnedMesh, Vector3 } from 'three'
import type { Object3D } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { MachinePart, MappingIssue, ModelTransform } from '../types/machine.ts'
import { parseModelTransform, parseParts } from '../data/parse.ts'

export interface RegisteredPart { definition: MachinePart; objects: Object3D[]; meshes: Mesh[]; xrayMeshes: Set<Mesh> }
export function createModelInstance(source: Object3D, definitions: MachinePart[], transform: ModelTransform = {}) {
  parseParts(definitions)
  const options = parseModelTransform(transform)
  const root = new Group()
  root.name = 'ModelInstance'
  root.add(clone(source))
  root.updateWorldMatrix(true, true)
  const nodes = new Map<string, Object3D[]>()
  const meshes: Mesh[] = []
  root.traverse(node => {
    if (node !== root && node.name) nodes.set(node.name, [...(nodes.get(node.name) ?? []), node])
    if (node instanceof Mesh) meshes.push(node)
  })
  if (!meshes.length) throw new Error('Model contains no renderable meshes')
  const bounds = new Box3().setFromObject(root)
  if (bounds.isEmpty() || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) throw new Error('Model bounds are invalid')
  const size = Math.max(...bounds.getSize(new Vector3()).toArray())
  if (options.fitSize && size <= 0) throw new Error('Cannot normalize zero-size model')
  const scale = options.fitSize ? options.fitSize / size : options.scale ?? 1
  root.scale.setScalar(scale)
  if (options.center) root.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale)
  root.updateWorldMatrix(true, true)
  const issues: MappingIssue[] = []
  const owners = new Map<Object3D, string>()
  const parts = new Map<string, RegisteredPart>()
  function resolve(name: string, partId: string) {
    const matches = nodes.get(name) ?? []
    if (matches.length !== 1) issues.push({ partId, nodeName: name, ...(matches.length ? { reason: 'ambiguous' as const } : {}) })
    return matches.length === 1 ? matches[0] : undefined
  }
  for (const definition of definitions) {
    const objects = [definition.nodeName, ...(definition.nodeNames ?? [])].map(name => resolve(name, definition.id)).filter((node): node is Object3D => !!node)
    const xrayObjects = (definition.xrayNodeNames ?? []).map(name => resolve(name, definition.id)).filter((node): node is Object3D => !!node)
    for (const object of objects) owners.set(object, definition.id)
    const xrayMeshes = new Set<Mesh>()
    for (const object of xrayObjects) object.traverse(node => { if (node instanceof Mesh) xrayMeshes.add(node) })
    parts.set(definition.id, { definition, objects, meshes: [], xrayMeshes })
  }
  function partFor(object: Object3D | null): RegisteredPart | undefined {
    for (let current = object; current; current = current.parent) {
      const id = owners.get(current)
      if (id) return parts.get(id)
    }
  }
  for (const mesh of meshes) {
    const part = partFor(mesh)
    if (!part) continue
    part.meshes.push(mesh)
    if (!part.definition.xrayNodeNames?.length) part.xrayMeshes.add(mesh)
  }
  for (const part of parts.values()) for (const name of part.definition.xrayNodeNames ?? []) {
    const matches = nodes.get(name) ?? []
    if (matches.length !== 1) continue
    let conflict = false
    matches[0].traverse(node => { if (node instanceof Mesh && partFor(node) !== part) conflict = true })
    if (conflict) issues.push({ partId: part.definition.id, nodeName: name, reason: 'conflict' })
  }
  function partBounds(id: string) {
    root.updateWorldMatrix(true, true)
    const box = new Box3()
    for (const object of parts.get(id)?.objects ?? []) box.union(new Box3().setFromObject(object))
    return box
  }
  function dispose() {
    const skeletons = new Set(meshes.filter((mesh): mesh is SkinnedMesh => mesh instanceof SkinnedMesh).map(mesh => mesh.skeleton))
    for (const skeleton of skeletons) skeleton.dispose()
  }
  return { root, nodes, parts, issues, meshes, partFor, partBounds, dispose }
}
export type ModelInstance = ReturnType<typeof createModelInstance>
