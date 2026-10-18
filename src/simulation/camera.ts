import { Box3, Vector3 } from 'three'
import type { CameraFocus } from '../types/machine.ts'

export const overview: CameraFocus = { position: [4.1, 2.5, 5.8], target: [0, 0.7, 0] }
export function focusBounds(box: Box3, fov: number, aspect: number, direction: Vector3, minDistance: number, maxDistance: number): CameraFocus | null {
  if (box.isEmpty() || ![...box.min.toArray(), ...box.max.toArray(), fov, aspect, minDistance, maxDistance, ...direction.toArray()].every(Number.isFinite) || fov <= 0 || fov >= 180 || aspect <= 0 || minDistance <= 0 || maxDistance < minDistance) return null
  const target = box.getCenter(new Vector3())
  const radius = box.getSize(new Vector3()).length() / 2
  const halfAngle = Math.min(Math.atan(Math.tan(fov * Math.PI / 360) * aspect), fov * Math.PI / 360)
  const distance = Math.max(minDistance, Math.min(maxDistance, radius * 1.15 / Math.sin(halfAngle)))
  const offset = direction.lengthSq() ? direction.clone().normalize() : new Vector3(1, 0.5, 1).normalize()
  return { position: target.clone().add(offset.multiplyScalar(distance)).toArray(), target: target.toArray() }
}
