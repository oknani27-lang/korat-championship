import { Vector3 } from 'three'
import type { Vec3 } from '../types/machine'

export interface ModelBounds { min: Vec3; max: Vec3 }
export function fitModelCamera(bounds: ModelBounds, aspect: number, fov = 35) {
  const min = new Vector3(...bounds.min), max = new Vector3(...bounds.max)
  const center = min.clone().add(max).multiplyScalar(0.5)
  const direction = new Vector3(0.23, 0.16, 1).normalize()
  const right = new Vector3(0, 1, 0).cross(direction).normalize()
  const up = direction.clone().cross(right).normalize()
  const tanV = Math.tan(fov * Math.PI / 360), tanH = tanV * Math.max(0.1, aspect)
  let distance = 1
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
    const corner = new Vector3(x, y, z).sub(center)
    distance = Math.max(distance, corner.dot(direction) + Math.abs(corner.dot(right)) / tanH,
      corner.dot(direction) + Math.abs(corner.dot(up)) / tanV)
  }
  distance *= 1.08
  return { position: center.clone().addScaledVector(direction, distance), target: center,
    minDistance: Math.max(0.25, max.distanceTo(min) * 0.06), maxDistance: distance * 4 }
}
