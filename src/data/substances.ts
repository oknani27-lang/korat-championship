export const substances = {
  water: { label: 'น้ำ', color: '#0284C7', shape: 'circle', count: 14 },
  urea: { label: 'ยูเรีย · สารละลาย', color: '#CA8A04', shape: 'diamond', count: 7 },
  phosphorus: { label: 'กลุ่มสารที่มีฟอสฟอรัส', color: '#92400E', shape: 'outline', count: 4 },
  sediment: { label: 'ตะกอนที่มีฟอสฟอรัส', color: '#92400E', shape: 'triangle', count: 4 },
  ammonium: { label: 'แอมโมเนียม NH₄⁺', color: '#7C3AED', shape: 'cross', count: 8 },
  nitrite: { label: 'ไนไตรต์ NO₂⁻', color: '#BE185D', shape: 'square', count: 8 },
  nitrate: { label: 'ไนเตรต NO₃⁻', color: '#4338CA', shape: 'hexagon', count: 8 },
  gas: { label: 'ก๊าซ · ฟองโปร่ง', color: '#0369A1', shape: 'bubble', count: 6 },
  nutrient: { label: 'สารเสริม · ไม่ระบุสูตร', color: '#0F766E', shape: 'star', count: 4 },
  algae: { label: 'เซลล์ Limnospira · เกลียว', color: '#15803D', shape: 'helix', count: 6 },
  vapor: { label: 'ไอน้ำ · เส้นคลื่น', color: '#64748B', shape: 'vapor', count: 4 },
  product: { label: 'ผลิตภัณฑ์หลายองค์ประกอบ · กลุ่มเม็ด', color: '#4D7C0F', shape: 'cluster', count: 3 },
  pouch: { label: 'ซอง · ภาชนะบรรจุ', color: '#92400E', shape: 'pouch', count: 1 },
} as const
export type SubstanceId = keyof typeof substances
export const isSubstance = (id: string): id is SubstanceId => Object.hasOwn(substances,id)
