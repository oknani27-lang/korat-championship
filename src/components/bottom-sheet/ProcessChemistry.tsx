import type { ProcessStep } from '../../types/machine'

export function ProcessChemistry({ step }: { step: ProcessStep }) {
  const info = step.chemistry
  return <article className="process-chemistry" data-step={step.id}>
    <span className="section-label">CHEMISTRY & PROCESS</span>
    <h3>{info?.headline ?? (step.formulas.length ? 'สูตรเคมี / กระบวนการ' : 'รายละเอียดกระบวนการ')}</h3>
    <p className="process-explanation">{info?.explanation ?? step.description ?? 'รอรายละเอียดกระบวนการฉบับยืนยัน'}</p>
    {step.formulas.length > 0 ? <div className="formula-area">{step.formulas.map((formula, i) => <div className="formula" key={i}>{formula.map((token, n) => token.kind === 'sub' ? <sub key={n}>{token.text}</sub> : token.kind === 'sup' ? <sup key={n}>{token.text}</sup> : <span key={n}>{token.text}</span>)}</div>)}</div> : info && <div className="physical-process-note">{info.kind === 'pending' ? 'ยังไม่มีสมการเฉพาะที่ยืนยัน' : 'ขั้นนี้ไม่มีสมการปฏิกิริยาเคมีที่กำหนด'}</div>}
    {info && <p className="small-note chemical-scope">{info.scope}</p>}
    {Boolean(info?.sources.length) && <div className="chemical-sources">อ้างอิง: {info!.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}</div>}
  </article>
}
