"""Assemble existing DMR references; no source file or website data is modified."""
import csv
import json
import re
from html import escape
from pathlib import Path

root = Path(__file__).resolve().parents[1]
base = root / 'new-chat/new-chat/output'
out = root / 'output/pdf'
temp = root / 'tmp/pdfs/research-compendium'
out.mkdir(parents=True, exist_ok=True)
temp.mkdir(parents=True, exist_ok=True)
refs = json.loads((base / 'DMR40L_Research_2026-10-19/data/research_references.json').read_text(encoding='utf-8'))
rows = list(csv.DictReader((base / 'DMR_Linear_Blueprint_RevF/Evidence_Research.csv').open(encoding='utf-8-sig')))
manufacturers = list(csv.DictReader((base / 'DMR_Linear_Blueprint_RevF/Evidence_Manufacturers.csv').open(encoding='utf-8-sig')))
entries = []
for r in refs:
    entries.append(dict(r, origin=['Research package '+r['id']], conditions='', extra_urls=[]))
for r in rows:
    match = next((x for x in entries if r['doi'] and x.get('doi','') == r['doi']), None)
    if match:
        match['origin'].append('Blueprint RevF '+r['id'])
        match['conditions'] = r['conditions']
        match['evidence'] = r['supports']
        match['limitations'] += ' / '+r['limit']
        match['access'] += ' / ทะเบียน RevF: '+r['access']
        if r['url'] != match['url']: match['extra_urls'].append(r['url'])
    else:
        entries.append(dict(id='X'+r['id'], apa=f"{r['author']} ({r['year']}). {r['title']}.", doi=r['doi'], url=r['url'], access=r['access'], evidence=r['supports'], limitations=r['limit'], conditions=r['conditions'], origin=['Blueprint RevF '+r['id']], extra_urls=[]))
supplement = [
    ('U.S. EPA. Wastewater Basics 101.', 'https://www.epa.gov/sites/default/files/2015-06/documents/epa-mou_wastewater_basics_101.pdf', 'สมการไนตริฟิเคชันที่ใช้ในแผงเว็บ', 'เอกสารการสอน ไม่ใช่ผลทดลองของ R201'),
    ('OpenStax. Concepts of Biology: Energy and Metabolism.', 'https://openstax.org/books/concepts-biology/pages/4-1-energy-and-metabolism', 'หลักการสังเคราะห์แสงในแผงเว็บ', 'กลูโคสเป็นตัวแทนในสมการย่อ ไม่ใช่สูตรชีวมวลจริงของ Limnospira'),
]
for i,(apa,url,evidence,limitations) in enumerate(supplement,1):
    entries.append(dict(id=f'W{i:02}',apa=apa,url=url,doi=None,access='ลิงก์จากข้อมูลเคมีในเว็บ',evidence=evidence,limitations=limitations,conditions='',origin=['src/data/process-chemistry.ts'],extra_urls=[]))

# User-supplied missing sources, promoted to annotated main entries.
entries.extend([
    dict(id='SPACE01',apa='European Space Agency. (2018, October 4). Green smoothies in space.',doi=None,
         url='https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Research/Green_smoothies_in_space',
         access='ข่าววิทยาศาสตร์จาก ESA ไม่ใช่บทความวารสารฉบับ peer review',
         evidence='รายงานการทดลอง Artemiss บน ISS หลังส่ง Arthrospira ขึ้นในเดือนธันวาคม 2017 แสดงศักยภาพผลิตออกซิเจนและโปรตีนสำหรับระบบช่วยชีวิต พร้อมชี้ปัญหาการแยกก๊าซกับของเหลวในสภาวะไร้น้ำหนัก',
         conditions='ข่าวเผยแพร่ปี 2018 กล่าวถึงการทดลองแบบ batch ไม่ใช่หลักฐานว่าระบบเพาะต่อเนื่องปี 2025 เป็นการทดลองเดียวกัน',
         limitations='ใช้ประกอบ R401/G401 และแนวคิดอวกาศ ไม่ได้ยืนยันการใช้ปัสสาวะเป็นอาหารเลี้ยงบน ISS หรือรับรองผลิตภัณฑ์จาก DMR',
         origin=['แหล่งที่ผู้ใช้ส่งเพิ่ม / เดิมมีเพียงลิงก์ในภาคผนวก'],extra_urls=[]),
    dict(id='SPACE02',apa='German Aerospace Center (DLR). (2025, February 14). Successful realisation of the Arthrospira-C experiment at the MUSC.',doi=None,
         url='https://www.dlr.de/en/rb/latest/news/2025/successful-realisation-of-the-arthrospira-c-experiment-at-the-musc',
         access='ข่าวจากหน่วยงานผู้ร่วมดำเนินการ DLR ใช้เป็นแหล่งหลักแทนข่าวสื่อ ไม่ใช่รายงานผลเชิงปริมาณแบบ peer review',
         evidence='รายงานความสำเร็จของการเพาะ Limnospira indica PCC8005 แบบต่อเนื่องบน ISS เพื่อผลิตออกซิเจนและชีวมวลที่เป็นแหล่งอาหาร โดย SCK CEN รับผิดชอบวิทยาศาสตร์ Redwire Space Europe พัฒนาฮาร์ดแวร์ และ MUSC/DLR ควบคุมการดำเนินงาน',
         conditions='14 กุมภาพันธ์ 2025 เป็นวันที่เผยแพร่ข่าว ไม่ควรใช้แทนวันเริ่มหรือช่วงดำเนินการทดลองหากยังไม่มีข้อมูลภารกิจ',
         limitations='ไม่ใช่หลักฐานว่า DMR ทั้งชุดทำงานในอวกาศแล้ว ไม่ยืนยันผลผลิต การใช้ปัสสาวะ หรือการอนุมัติอาหารจากเครื่องนี้ ข่าว Economic Times เก็บเป็นสื่อประกอบ ไม่ใช่หลักฐานทดลองแยกอีกงาน',
         origin=['แหล่ง ISS ที่ผู้ใช้ส่ง / ตรวจกลับไปยังข่าวทางการ DLR'],
         extra_urls=['https://economictimes.indiatimes.com/news/international/us/in-2025-dlr-tested-continuous-spirulina-growth-on-the-iss-for-future-closed-loop-life-support-limnospira-indica-produced-oxygen-and-edible-biomass-in-microgravity/articleshow/134008844.cms']),
])

verified = {
 '10.1016/j.jenvman.2023.118500': ('เปิดหน้า institutional repository ได้ ยืนยันชื่อและ metadata ไม่อ่านฉบับเต็มใหม่ทั้งเล่ม', 'https://biblio.ugent.be/publication/01HJ19YHTK82W2BRJR4NHQ7H53'),
 '10.3389/fspas.2023.1229043': ('เปิดบทความฉบับเต็มของผู้จัดพิมพ์ได้ ยืนยันชื่อและขอบเขตงานเก็บเกี่ยว/medium recycling', None),
 '10.1021/acs.est.9b06804': ('เรียกหน้า PubMed ได้ แต่เครื่องมือไม่คืนเนื้อหา จึงไม่อ้างว่าตรวจรายละเอียดฉบับเต็มใหม่', None),
 '10.1016/j.lssr.2020.03.002': ('เรียกหน้า PubMed ได้ แต่เนื้อหาที่อ่านคืนมีจำกัด ยังไม่ตรวจฉบับเต็มใหม่', None),
 '10.1038/s41526-024-00436-x': ('เปิด Nature ไม่สำเร็จในรอบนี้ คง metadata ตามทะเบียนโครงการ', None),
 '10.1111/1751-7915.13882': ('ลิงก์ PMC ติด browser check ไม่อ้างว่าอ่านฉบับเต็มใหม่', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8913870/'),
}
for i,r in enumerate(entries,1):
    r['uid'] = f'D{i:02}'
    r['verification'] = verified.get(r.get('doi'), ('รวบรวมตามทะเบียนโครงการ ยังไม่ได้ตรวจหน้าเว็บ/ฉบับเต็มใหม่ในรอบจัดเล่มนี้',None))[0]
    alt = verified.get(r.get('doi'), ('',None))[1]
    if alt and alt != r['url']: r['extra_urls'].append(alt)
    r['category'] = 'บทความวิจัย' if r.get('doi') else 'คู่มือ / หน่วยงาน / เอกสารประกอบ'
    if r['id'] in ['R18','R19']: r['category']='ข้อมูลผู้ผลิต / คู่มืออุปกรณ์'
    if r['id'] in ['SPACE01','SPACE02']:
        r['category']='ข่าววิทยาศาสตร์จากหน่วยงานทางการ'
        r['verification']='เปิดและอ่านหน้า ESA/DLR ทางการในการปรับเล่มรอบนี้ วันที่ 19 ตุลาคม 2026; ลิงก์ Economic Times เป็นข่าวประกอบ ไม่ถือเป็นหลักฐานเชิงทดลองอิสระ'

extras=[]
for name in ['dmr-cost-evidence.md','mechanical-cost-preliminary.md','space-feasibility-preliminary.md']:
    text=(root/'docs'/name).read_text(encoding='utf-8')
    for line in text.splitlines():
        for url in re.findall(r'https?://[^\s)<>]+',line):
            url=url.rstrip('.,')
            known=any(url==r['url'] or url in r['extra_urls'] or (r.get('doi') and r['doi'].lower() in url.lower()) for r in entries)
            if known or any(url==x['url'] for x in manufacturers) or any(url==x['url'] for x in extras):continue
            label=re.sub(r'https?://[^\s)<>]+','',line).strip('- :[]()')
            extras.append(dict(title=label or 'เอกสารเสริม / ลิงก์ฉบับอื่น',url=url,origin='docs/'+name))

def e(s): return escape(str(s or '')).replace('\u2011','-').replace('–','-').replace('−','-')
def link(url): return f'<a href="{escape(url,quote=True)}">{e(url)}</a>'
pages=[]
def page(title,body,section='DMR / RESEARCH LIBRARY'):
    pages.append(f'<section class="page"><header>{section}<span>19 OCTOBER 2026</span></header><h1>{title}</h1>{body}<footer>DEMETER ReFeed | รวบรวมหลักฐานและข้อจำกัด<span>{len(pages)+1:02}</span></footer></section>')

page('รวมงานวิจัยและแหล่งอ้างอิง<br><em>DEMETER ReFeed / DMR</em>',f'''<div class="cover-tag">ฉบับรวบรวมภาษาไทย - 19 ตุลาคม 2026</div><p class="lead">จากการรับปัสสาวะ ปรับสภาพและกู้คืนสารอาหาร ไปจนถึงเพาะ Limnospira เก็บเกี่ยว แปรรูป บรรจุ และแนวคิดการใช้งานในอวกาศ</p><div class="stats"><b>{len(entries)}<small>รายการหลักหลังรวมซ้ำ</small></b><b>{len(manufacturers)}<small>รายการผู้ผลิตใน RevF</small></b><b>{len(extras)}<small>ลิงก์เสริมจากรายงาน</small></b></div><h2>ขอบเขตของเล่ม</h2><p>เล่มนี้รวมบรรณานุกรม สรุปหลักฐานที่เกี่ยวข้อง ข้อจำกัด ระดับการเข้าถึง และลิงก์ต้นฉบับที่พบในโครงการ ไม่ใช่การรวมบทความฉบับเต็มของผู้จัดพิมพ์ทุกฉบับ และไม่ใช่ systematic review ของวรรณกรรมทั้งหมดในสาขา</p><div class="note">การมีงานวิจัยรองรับหลักการ ไม่ได้ยืนยันว่าเครื่อง DMR มีสมรรถนะ น้ำหนัก ต้นทุน หรือความปลอดภัยอาหารตามงานนั้นแล้ว ต้องแยกผลการทดลองของผู้แต่งออกจากสมมติฐานออกแบบของโครงการ</div>''')

page('วิธีอ่านและขอบเขตการตรวจ', '''<h2>01 / แหล่งที่นำมารวม</h2><ul><li>ทะเบียน research_references.json ในชุด DMR40L_Research_2026-10-19</li><li>Evidence_Research.csv และ Evidence_Manufacturers.csv จาก Blueprint RevF</li><li>แหล่งสมการใน src/data/process-chemistry.ts</li><li>ลิงก์ด้านต้นทุน กลศาสตร์และอวกาศจากรายงานใน docs/</li></ul><h2>02 / รวมรายการซ้ำอย่างไร</h2><p>ใช้ DOI เป็นกุญแจหลัก รายการที่ซ้ำเก็บรหัสเดิมและลิงก์ทางเลือกไว้ รหัส R ในสองทะเบียนไม่ได้หมายถึงงานเดียวกันเสมอ เล่มนี้จึงใช้ D01, D02 ฯลฯ เป็นรหัสกลาง</p><h2>03 / สถานะการอ่าน</h2><p>ช่อง “ระดับการเข้าถึงเดิม” เป็นข้อมูลจากทะเบียนก่อนหน้า ไม่ใช่การประกาศว่าอ่านฉบับเต็มใหม่ทั้งหมด ช่อง “ตรวจในรอบจัดเล่ม” บอกเฉพาะสิ่งที่ตรวจได้ครั้งนี้ แหล่งที่เปิดไม่ได้หรือยังไม่ตรวจใหม่คงระบุไว้ตามจริง</p><h2>04 / ข้อจำกัดที่ใช้ตลอดเล่ม</h2><p>ไม่ถ่ายโอนอัตราผลผลิตจากปริมาตรถังเพียงอย่างเดียว ไม่ถือว่าตะกอนทุกชนิดเป็น struvite ไม่ถือว่ากรองแล้วได้น้ำบริสุทธิ์ และไม่ถือว่าการอบหรือซีลเป็นการอนุมัติบริโภค งานจำลอง microgravity ไม่เท่ากับผลทดลองบน ISS และคู่มือผู้ผลิตไม่ใช่ flight qualification</p><div class="note">งบรวม 3,500,000 บาทในเอกสารโครงการยังไม่ใช่ต้นทุนจาก BOM และ quotation ครบ ค่าขนส่งอวกาศ 1,000,000 บาท/kg เป็นสมมติฐานโจทย์ ไม่ใช่ราคาตลาดที่ยืนยัน</div>''')

mapping=[('EC101 / F101 - ปรับสภาพและแยกตะกอน',['R03']),('R102 - กู้คืนฟอสฟอรัส',['R13']),('R201 / G201 - ไนตริฟิเคชัน',['R02','R15','R21','XR06','W01']),('T301 / T302 - กักตรวจและปรับสูตร',['R01','R16','XR08']),('R401 - เพาะสาหร่ายและอวกาศ',['R01','R04','R05','R16','R17','W02','SPACE01','SPACE02']),('F501 / T501 / W601 - เก็บเกี่ยวและน้ำ',['R06','R14']),('H701 / DR701 / FD701 - แปรรูป',['R07','R08','R12','XR08']),('PK801 / T801 - อาหารและบรรจุภัณฑ์',['R09','R10','R11','R12','R20'])]
body='<p>ใช้ตารางนี้เลือกอ่านหลักฐานตามอุปกรณ์ ไม่ใช่ P&ID ที่ผ่านการรับรอง</p>'
for title,ids in mapping:
    found=[r['uid'] for r in entries if r['id'] in ids]
    body+=f'<div class="map"><b>{e(title)}</b><p>{e(" / ".join(found))}</p></div>'
page('แผนที่หลักฐานตามกระบวนการ',body)

for start in range(0,len(entries),2):
    body=''
    for r in entries[start:start+2]:
        body+=f'''<article><div class="badge">{r['uid']} / {e(r['category'])}</div><h2 class="citation">{e(r['apa'])}</h2><p><b>รองรับ / ใช้กับโครงการ:</b> {e(r['evidence'])}</p>'''
        if r['conditions']:body+=f'<p><b>เงื่อนไขงานอ้างอิง:</b> {e(r["conditions"])}</p>'
        body+=f'''<p><b>ข้อจำกัด:</b> {e(r['limitations'])}</p><p class="muted"><b>ระดับการเข้าถึงเดิม:</b> {e(r['access'])}</p><p class="muted"><b>ตรวจในรอบจัดเล่ม:</b> {e(r['verification'])}</p><p class="origin">รหัสเดิม: {e(' | '.join(r['origin']))}</p>'''
        if r.get('doi'):body+=f'<p class="url"><b>DOI:</b> {link("https://doi.org/"+r["doi"])}</p>'
        body+=f'<p class="url">{link(r["url"])}</p>'
        for url in dict.fromkeys(r['extra_urls']):body+=f'<p class="url">ลิงก์เพิ่มเติม: {link(url)}</p>'
        body+='</article>'
    page('ทะเบียนงานวิจัยและเอกสารหลัก',body)

for start in range(0,len(manufacturers),4):
    body='<p class="muted">ภาคผนวกอุปกรณ์: เป็น candidate และข้อมูลผู้ผลิต ไม่ใช่งานทดลองของ DMR หรือใบเสนอราคาปัจจุบัน</p>'
    for r in manufacturers[start:start+4]:
        body+=f'<article class="vendor"><div class="badge">{e(r["id"])}</div><h2>{e(r["title"])}</h2><p>{e(r["verified_and_pending"])}</p><p class="url">{link(r["url"])}</p><p class="origin">ที่มา: Blueprint RevF / Evidence_Manufacturers.csv - ยังไม่ตรวจรุ่นหรือหน้าเว็บใหม่ในรอบจัดเล่ม</p></article>'
    page('ภาคผนวก A / ผู้ผลิตและอุปกรณ์',body)

for start in range(0,len(extras),5):
    body='<p class="muted">เก็บเพื่อค้นต่อจากรายงานเดิม ลิงก์ราคา/มาตรฐานอาจเปลี่ยนรุ่นหรือ revision ต้องตรวจใหม่ก่อนจัดซื้อหรืออ้างข้อกำหนด</p>'
    for i,r in enumerate(extras[start:start+5],start+1):
        body+=f'<article class="vendor"><div class="badge">S{i:02}</div><h2>{e(r["title"])}</h2><p class="url">{link(r["url"])}</p><p class="origin">ที่มา: {e(r["origin"])} / ลิงก์ที่รวบรวม ยังไม่ตรวจฉบับปัจจุบันใหม่</p></article>'
    page('ภาคผนวก B / อวกาศ ต้นทุนและแหล่งเสริม',body)

page('สิ่งที่ต้องตรวจต่อก่อนใช้เป็นสเปก', '''<h2>หลักฐานที่ยังต้องเชื่อมกับเครื่องจริง</h2><ol><li>วัดองค์ประกอบวัตถุดิบและคุณภาพหลังบำบัดของแต่ละล็อต ไม่ใช้ค่าจากเอกสารแทนผลตรวจ</li><li>ยืนยัน phase ของตะกอนและทางใช้ซ้ำจาก R102 ก่อนส่งเข้าสายเพาะ</li><li>กำหนด loading, oxygen transfer, pH และสมดุลธาตุอาหารของ R201/R401 จาก pilot จริง</li><li>เลือกชนิดตัวกรอง วัด fouling และตรวจสารปนเปื้อนก่อนอนุมัติน้ำกู้คืน</li><li>เลือกวิธีแปรรูปและทดสอบความปลอดภัย อายุเก็บ และคุณภาพอาหาร ไม่ใช้เพียงสมการความร้อนหรือการซีลรับรอง</li><li>หากพัฒนาเพื่ออวกาศ ต้องกำหนดสภาพแวดล้อมและภารกิจ ทดสอบก๊าซ-ของเหลว การระบายความร้อน วัสดุและความน่าเชื่อถือ</li><li>ก่อนสรุปต้นทุนให้จัด BOM รุ่นจริง ขอบเขตประกอบ และ quotation ที่ยังไม่หมดอายุ</li></ol><h2>การติดตามกลับ</h2><p>เลข D ในเล่มนี้จับคู่กับรหัสเดิมในแต่ละรายการ DOI และ URL กดเปิดได้ ใช้ลิงก์ผู้จัดพิมพ์หรือคลังผู้แต่งเพื่ออ่านฉบับเต็ม ไม่ถือว่าข้อความสรุปสั้นในเล่มทดแทน Methods, Results และข้อจำกัดฉบับต้นฉบับ</p><div class="note">เอกสารนี้เป็นการรวบรวมเพื่อค้นคว้า ไม่แก้ไฟล์ข้อมูลเครื่อง โมเดล Blender หรือเว็บไซต์ และไม่คัดลอกบทความทั้งฉบับของบุคคลที่สาม</div>''')

css='''@font-face{font-family:Thai;src:url(file:///C:/Windows/Fonts/LeelawUI.ttf)}@font-face{font-family:Thai;src:url(file:///C:/Windows/Fonts/LeelaUIb.ttf);font-weight:700}@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Thai,Tahoma,sans-serif;color:#203539;font-size:11px;line-height:1.6}.page{width:210mm;height:297mm;padding:19mm 18mm 17mm;position:relative;break-after:page;overflow:visible}.page:last-child{break-after:auto}header{font-size:9px;letter-spacing:1.2px;border-bottom:1px solid #c9d5d2;padding-bottom:9px;color:#49716b;display:flex;justify-content:space-between}h1{font-size:24px;line-height:1.45;margin:20px 0 16px;color:#163f38}h1 em{font-size:21px;font-style:normal;color:#51736d}h2{font-size:13px;line-height:1.5;margin:12px 0 5px}p{margin:5px 0}a{color:#17695c;text-decoration:none;overflow-wrap:anywhere}.lead{font-size:15px;line-height:1.8;margin:22px 0}.cover-tag{font-size:12px;color:#637b74;margin-top:24px}.stats{display:flex;justify-content:space-between;background:#edf4f1;padding:18px;margin:26px 0}.stats b{font-size:30px;color:#1b6252}.stats small{display:block;font-size:10px;font-weight:400}.note{background:#f2f5f3;border-left:3px solid #6b998c;padding:12px 14px;margin:18px 0;line-height:1.8}.map{padding:10px 0;border-bottom:1px solid #e2e9e5}.map p{color:#4e766c}article{padding:12px 0 15px;border-bottom:1px solid #dce6e1;break-inside:avoid}.badge{font-size:10px;color:#1c7160;font-weight:700;letter-spacing:.4px}.citation{font-size:12px;font-weight:700;margin:6px 0 9px}.muted{color:#687b76;font-size:10px}.origin{font-size:9px;color:#71827b}.url{font-size:9px;line-height:1.5;overflow-wrap:anywhere}.vendor{padding:10px 0}.vendor h2{margin:4px 0;font-size:12px}footer{position:absolute;bottom:10mm;left:18mm;right:18mm;font-size:9px;color:#7a8c85;border-top:1px solid #d6e0da;padding-top:6px;display:flex;justify-content:space-between}li{margin:9px 0}'''
css+='body{font-size:13px;line-height:1.7}.citation{font-size:14px;line-height:1.6}.muted{font-size:11.5px}.origin{font-size:10px}.url{font-size:10.5px;line-height:1.6}h2{font-size:15px}.vendor h2{font-size:14px}article{padding:16px 0 18px}header,footer{font-size:10px}'
html=f'<!doctype html><html lang="th"><meta charset="utf-8"><title>DMR Research Compendium</title><style>{css}</style><body>'+''.join(pages)+'</body></html>'
(temp/'compendium.html').write_text(html,encoding='utf-8')
(temp/'manifest.json').write_text(json.dumps(dict(entries=entries,manufacturers=manufacturers,extras=extras,pages=len(pages)),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(pages=len(pages),main=len(entries),manufacturers=len(manufacturers),supplementary=len(extras))))
