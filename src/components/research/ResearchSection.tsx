import { BookOpenText } from 'lucide-react'
import { papers } from '../../data/config'
import type { ResearchPaper } from '../../types/research'

export function ResearchSection({ articles = papers }: { articles?: ResearchPaper[] }) {
  return <section id="research" className="research-section" aria-labelledby="research-heading">
    <div className="research-header"><div><span className="section-label">RESEARCH & REFERENCES</span><h2 id="research-heading">งานวิจัยและเอกสารอ้างอิง</h2></div><p>หลักฐานจากวรรณกรรม<br/>ไม่ใช่ผลทดลองยืนยันเครื่อง DMR</p></div>
    {!articles.length ? <div className="research-empty"><BookOpenText size={30} strokeWidth={1.3}/><h3>รอเอกสารงานวิจัยฉบับยืนยัน</h3><p>ยังไม่มีแหล่งอ้างอิงที่เพิ่มในโครงการ เมื่อได้รับเอกสารแล้ว<br/>จะแสดงข้อมูลต้นทาง ขอบเขตหลักฐาน และข้อจำกัดไว้ที่นี่</p><span>ไม่มีการสร้างรายการอ้างอิงหรือข้อสรุปทางวิทยาศาสตร์ขึ้นเอง</span></div> : <>
      <div className="research-list">{articles.map(paper => <article className="research-card" key={paper.id} data-research-id={paper.id}>
        {paper.image && <figure className="research-figure"><img src={paper.image.src} alt={paper.image.alt} loading="lazy" decoding="async"/><figcaption><a href={paper.image.sourceUrl} target="_blank" rel="noopener noreferrer">{paper.image.credit}</a></figcaption></figure>}
        <h3>{paper.title}</h3><p className="paper-authors">{paper.authors.length > 4 ? `${paper.authors[0]}, et al.` : paper.authors.join(', ') || 'ไม่ระบุผู้เขียน'} · {paper.year}</p><p>{paper.summary || 'รอสรุปเนื้อหาที่ตรวจสอบแล้ว'}</p>
        <div className="paper-links"><a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">อ่านงานวิจัยต้นฉบับ</a></div>
      </article>)}</div>
    </>}
  </section>
}
