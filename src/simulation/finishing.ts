const clamp = (n: number) => Math.max(0, Math.min(1, n))

// Story-time, not drying kinetics, a validated recipe, or a product release.
export function finishingFrame(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 51 || seconds > 60) return null
  const stage = seconds < 56 ? 'processing' : 'packing'
  const progress = (seconds - (stage === 'processing' ? 51 : 56)) / (stage === 'processing' ? 5 : 4)
  const phase = stage === 'processing'
    ? progress < .25 ? 'loading' : progress < .8 ? 'drying' : 'await-packing'
    : progress < .35 ? 'filling' : progress < .6 ? 'sealing' : progress < .8 ? 'lot' : 'quarantine'
  return {
    stage, progress, phase, example: true, released: false,
    trayX: 50 + 130 * clamp(progress / .25),
    waterLevel: 26 - 18 * clamp((progress - .25) / .55),
    vapor: stage === 'processing' && phase === 'drying'
      ? Array.from({ length: 4 }, (_, i) => ({ x: 214 + i * 15, y: 68 - ((progress * 60 + i * 8) % 38) })) : [],
    fill: stage === 'packing' ? clamp(progress / .35) : 0,
    pouchX: 190 + 163 * clamp((progress - .8) / .2),
    sealed: stage === 'packing' && progress >= .6,
    labelled: stage === 'packing' && progress >= .8,
  } as const
}
