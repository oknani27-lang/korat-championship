import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { BufferGeometry, Line, LineBasicMaterial, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import type { FlowPath, ProcessVisualState } from '../../types/machine'
import { parseFlows } from '../../data/parse'
import { flowProgress } from '../../simulation/visual-state'

export function FlowPaths({ paths, visual }: { paths: FlowPath[]; visual: ProcessVisualState }) {
  const invalidate = useThree(state => state.invalidate)
  const resources = useMemo(() => {
    parseFlows(paths)
    const lineMaterial = new LineBasicMaterial({ color: '#8daeb8' }), markerMaterial = new MeshBasicMaterial({ color: '#39c7ed' }), markerGeometry = new SphereGeometry(0.045, 8, 6)
    const routes = paths.map(path => {
      const points = path.points.map(point => new Vector3(...point)), lengths = [0]
      for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]))
      const geometry = new BufferGeometry().setFromPoints(points), line = new Line(geometry, lineMaterial)
      line.name = `flow:${path.id}:path`; line.raycast = () => {}
      function at(progress: number) {
        const distance = progress * lengths[lengths.length - 1]
        const index = Math.max(1, lengths.findIndex((length, i) => i > 0 && length >= distance))
        const span = lengths[index] - lengths[index - 1]
        return points[index - 1].clone().lerp(points[index], span ? (distance - lengths[index - 1]) / span : 0)
      }
      return { path, line, geometry, at }
    })
    return { routes, lineMaterial, markerMaterial, markerGeometry }
  }, [paths])
  useEffect(() => () => { resources.routes.forEach(route => route.geometry.dispose()); resources.lineMaterial.dispose(); resources.markerMaterial.dispose(); resources.markerGeometry.dispose() }, [resources])
  useEffect(() => { invalidate() }, [visual, invalidate])
  return <group name="ProcessFlows">{resources.routes.map(route => {
    const progress = visual.flowPathIds.includes(route.path.id) ? flowProgress(route.path, visual.progress) : null
    return progress === null ? null : <group key={route.path.id}><primitive object={route.line} dispose={null}/><mesh name={`flow:${route.path.id}:marker`} geometry={resources.markerGeometry} material={resources.markerMaterial} position={route.at(progress)} raycast={() => {}} dispose={null}/></group>
  })}</group>
}
