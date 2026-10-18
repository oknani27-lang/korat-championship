import { memo, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Box3, MOUSE, PerspectiveCamera, TOUCH, Vector3 } from 'three'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { CameraFocus, ViewerMode } from '../../types/machine'
import { focusBounds, overview } from '../../simulation/camera'

export interface CameraMotionHandle { focus: (focus: Box3 | CameraFocus) => void; cancel: () => void; reset: () => void; zoom: (factor: number) => void }
interface Motion { from: Vector3; targetFrom: Vector3; to: Vector3; targetTo: Vector3; elapsed: number; damping: boolean }
export const CameraMotion = memo(function CameraMotion({ mode, handle }: { mode: ViewerMode; handle: RefObject<CameraMotionHandle | null> }) {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree(state => state.camera)
  const invalidate = useThree(state => state.invalidate)
  const motion = useRef<Motion | null>(null)
  const cancel = useCallback(() => { const c = controls.current; if (motion.current && c) c.enableDamping = motion.current.damping; motion.current = null }, [])
  useImperativeHandle(handle, () => ({
    cancel,
    reset: () => {
      cancel()
      const c = controls.current
      if (!c) return
      c.target0.set(...overview.target); c.position0.set(...overview.position)
      const damping = c.enableDamping
      c.enableDamping = false; c.update(); c.reset(); c.enableDamping = damping; invalidate()
    },
    zoom: factor => {
      if (!Number.isFinite(factor) || factor <= 0) return
      cancel()
      const c = controls.current
      if (!c) return
      const distance = Math.max(c.minDistance, Math.min(c.maxDistance, c.getDistance() * factor))
      camera.position.sub(c.target).setLength(distance).add(c.target); c.update(); invalidate()
    },
    focus: request => {
      const c = controls.current
      if (!c || !(camera instanceof PerspectiveCamera)) return
      cancel()
      const pose = request instanceof Box3 ? focusBounds(request, camera.fov, camera.aspect, camera.position.clone().sub(c.target), c.minDistance, c.maxDistance) : request
      if (!pose) return
      const damping = c.enableDamping
      c.enableDamping = false; c.update()
      const next = { from: camera.position.clone(), targetFrom: c.target.clone(), to: new Vector3(...pose.position), targetTo: new Vector3(...pose.target), elapsed: 0, damping }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        camera.position.copy(next.to); c.target.copy(next.targetTo); c.update(); c.enableDamping = damping
      } else motion.current = next
      invalidate()
    },
  }), [camera, cancel, invalidate])
  useEffect(() => {
    // Drei replaces the controls when the default camera changes.
    const c = controls.current
    c?.addEventListener('start', cancel)
    return () => { c?.removeEventListener('start', cancel); cancel() }
  }, [camera, cancel])
  useFrame((_, delta) => {
    const current = motion.current, c = controls.current
    if (!current || !c) return
    current.elapsed += Math.min(delta, 0.05)
    const p = Math.min(1, current.elapsed / 0.35), eased = p * p * (3 - 2 * p)
    camera.position.lerpVectors(current.from, current.to, eased)
    c.target.lerpVectors(current.targetFrom, current.targetTo, eased); c.update()
    if (p === 1) cancel()
    else invalidate()
  })
  return <OrbitControls ref={controls} makeDefault target={overview.target} minDistance={2.8} maxDistance={12} minPolarAngle={0.25} maxPolarAngle={Math.PI / 2 - 0.03} enablePan enableRotate={mode !== 'zoom'} enableDamping dampingFactor={0.08} mouseButtons={{ LEFT: mode === 'pan' ? MOUSE.PAN : mode === 'zoom' ? MOUSE.DOLLY : MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }} touches={{ ONE: mode === 'pan' ? TOUCH.PAN : TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}/>
})

