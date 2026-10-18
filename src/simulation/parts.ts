import type { MachinePart } from '../types/machine'
import type { MappingIssue } from '../types/machine'

type NamedNode = { name: string; parent: NamedNode | null }
export function findPart(node: NamedNode | null, parts: MachinePart[]): MachinePart | null {
  for (let current = node; current; current = current.parent) {
    const part = parts.find(item => item.nodeName === current.name || item.nodeNames?.includes(current.name))
    if (part) return part
  }
  return null
}

export function checkPartMappings(scene: { getObjectByName: (name: string) => unknown }, parts: MachinePart[]): MappingIssue[] {
  return parts.flatMap(part => [part.nodeName, ...(part.nodeNames ?? []), ...(part.xrayNodeNames ?? [])].filter(name => !scene.getObjectByName(name)).map(nodeName => ({ partId: part.id, nodeName })))
}
