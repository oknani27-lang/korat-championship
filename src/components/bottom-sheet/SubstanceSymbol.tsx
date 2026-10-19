import { substances } from '../../data/substances'
import type { SubstanceId } from '../../data/substances'

export function SubstanceSymbol({species}:{species:SubstanceId}) {
  const item=substances[species]
  return <g fill={item.color} stroke={item.color}>
    {item.shape==='vapor'?<path d="M-4 6Q-8 2 -4 -2T-4 -7M3 6Q-1 2 3 -2T3 -7" fill="none" strokeWidth="1.5"/>:
      item.shape==='cluster'?<g stroke="none"><circle cx="-4" cy="2" r="3"/><circle cx="3" cy="3" r="3"/><circle cy="-3" r="3"/></g>:
      item.shape==='pouch'?<path d="M-5 -6H5L6 6H-6ZM-5 -3H5" fill="none" strokeWidth="1.5"/>:
      item.shape==='circle'?<circle r="4" stroke="none"/>:
      item.shape==='diamond'?<path d="M0 -5L5 0 0 5 -5 0Z" stroke="none"/>:
      item.shape==='outline'?<rect x="-4" y="-4" width="8" height="8" fill="none" strokeWidth="2"/>:
      item.shape==='square'?<rect x="-4" y="-4" width="8" height="8" stroke="none"/>:
      item.shape==='cross'?<path d="M-2 -6H2V-2H6V2H2V6H-2V2H-6V-2H-2Z" stroke="none"/>:
      item.shape==='hexagon'?<path d="M-5 0L-2.5 -4.3H2.5L5 0 2.5 4.3H-2.5Z" stroke="none"/>:
      item.shape==='bubble'?<circle r="5" fill="none" strokeWidth="1.5"/>:
      item.shape==='star'?<path d="M0 -6L2 -2 6 -2 3 1 4 5 0 3 -4 5 -3 1 -6 -2 -2 -2Z" stroke="none"/>:
      item.shape==='helix'?<path d="M-10 0Q-8 -7 -5 0T0 0T5 0T10 0" fill="none" strokeWidth="2.2" strokeLinecap="round"/>:
      <path d="M0 -6L6 5 -6 5Z" stroke="none"/>}
  </g>
}

export function SubstanceLegend({ids}:{ids:SubstanceId[]}) {
  return <ul className="substance-legend" aria-label="ชนิดสารและสัญลักษณ์">{ids.map(id=><li key={id}><svg className="legend-symbol" viewBox="-12 -8 24 16" aria-hidden="true"><SubstanceSymbol species={id}/></svg>{substances[id].label}</li>)}</ul>
}
