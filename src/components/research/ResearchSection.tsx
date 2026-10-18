import { useMemo, useState } from 'react'
import { ArrowUpRight, BookOpenText, FileText, Search } from 'lucide-react'
import { papers, steps } from '../../data/config'
import { filterResearch } from '../../data/research'
import type { ResearchPaper } from '../../types/research'
import type { ProcessStep } from '../../types/machine'

export function ResearchSection({ articles = papers, processSteps = steps }: { articles?: ResearchPaper[]; processSteps?: ProcessStep[] }) {
  const [keyword, setKeyword] = useState('')
  const [process, setProcess] = useState('')
  const filtered = useMemo(() => filterResearch(articles, keyword, process), [articles, keyword, process])
  const stepName = (id: string) => processSteps.find(step => step.id === id)?.subtitle || id
  return <section id="research" className="research-section" aria-labelledby="research-heading">
    <div className="research-header"><div><span className="section-label">RESEARCH & REFERENCES</span><h2 id="research-heading">งานวิจัยและเอกสารอ้างอิง</h2></div><p>แยกสิ่งที่แหล่งข้อมูลรองรับ<br/>ออกจากสิ่งที่ยังต้องตรวจสอบ</p></div>
    <div className="research-filters"><label className="research-search"><Search size={17}/><span className="sr-only">ค้นหางานวิจัย</span><input type="search" placeholder="ค้นหาชื่อเรื่อง ผู้เขียน หรือ DOI" value={keyword} onChange={event => setKeyword(event.target.value)} disabled={!articles.length}/></label><label className="research-process"><span>กระบวนการ</span><select aria-label="กรองงานวิจัยตามกระบวนการ" value={process} onChange={event => setProcess(event.target.value)} disabled={!articles.length}><option value="">ทุกกระบวนการ</option>{processSteps.map(step => <option key={step.id} value={step.id}>{step.subtitle || step.title}</option>)}</select></label></div>
    {!articles.length ? <div className="research-empty"><BookOpenText size={30} strokeWidth={1.3}/><h3>รอเอกสารงานวิจัยฉบับยืนยัน</h3><p>ยังไม่มีแหล่งอ้างอิงที่เพิ่มในโครงการ เมื่อได้รับเอกสารแล้ว<br/>จะแสดงข้อมูลต้นทาง ขอบเขตหลักฐาน และข้อจำกัดไว้ที่นี่</p><span>ไม่มีการสร้างรายการอ้างอิงหรือข้อสรุปทางวิทยาศาสตร์ขึ้นเอง</span></div> : <>
      <p className="research-count" role="status">พบ {filtered.length} จาก {articles.length} เอกสาร</p>
      {!filtered.length && <div className="research-empty"><Search size={25}/><h3>ไม่พบเอกสารที่ตรงกับตัวกรอง</h3><button className="secondary" onClick={() => { setKeyword(''); setProcess('') }}>ล้างตัวกรอง</button></div>}
      <div className="research-list">{filtered.map(paper => <article className="research-card" key={paper.id}>
        <span className="section-label">{paper.year} · {paper.publication || 'ไม่ระบุแหล่งตีพิมพ์'}</span><h3>{paper.title}</h3><p className="paper-authors">{paper.authors.length ? paper.authors.join(', ') : 'ไม่ระบุผู้เขียน'}</p><p>{paper.summary || 'รอสรุปเนื้อหาที่ตรวจสอบแล้ว'}</p>
        {paper.doi && <p className="paper-doi">DOI: <a href={`https://doi.org/${paper.doi.split('/').map(encodeURIComponent).join('/')}`} target="_blank" rel="noopener noreferrer">{paper.doi}</a></p>}
        <div className="research-tags" aria-label="กระบวนการที่เกี่ยวข้อง">{paper.processIds.map(id => <span key={id}>{stepName(id)}</span>)}</div>
        <div className="evidence-columns">{[{title:'สิ่งที่แหล่งข้อมูลรองรับ',items:paper.supports},{title:'ข้อจำกัดของงานวิจัย',items:paper.limitations},{title:'ข้อกล่าวอ้างที่ยังไม่ยืนยัน',items:paper.unverifiedClaims}].map(({title,items}) => <div key={title}><h4>{title}</h4>{items.length ? <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>ยังไม่มีข้อมูลที่บันทึก</p>}</div>)}</div>
        <div className="paper-links"><a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">ดูแหล่งต้นทาง <ArrowUpRight size={15}/></a>{paper.pdfUrl && <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"><FileText size={15}/> เปิด PDF</a>}</div>
      </article>)}</div>
    </>}
  </section>
}
