# แหล่งอ้างอิงกระบวนการและต้นทุนอุปกรณ์ DMR

ตรวจแหล่งข้อมูลวันที่ 19 ตุลาคม 2026

## ข้อค้นพบ

แหล่งที่ตรวจครั้งนี้รองรับองค์ประกอบกระบวนการและราคาอุปกรณ์บางตัว แต่ **ไม่มีแหล่งใดยืนยันต้นทุนรวม DMR 3,500,000 บาท หรือยืนยันงบทั้ง 8 หมวดตามตัวเลขเดิม** ตัวเลขรวมดังกล่าวยังเป็น planning assumption ในเอกสารโครงการ ไม่ใช่ผลรวม BOM ที่มี quotation ครบ

แยกหลักฐาน 3 แบบ: (1) งานวิจัยรองรับวิธีทำงาน (2) ราคาอุปกรณ์/ใบเสนอราคารองรับต้นทุนของ configuration นั้น และ (3) งบจัดสรรที่ยังไม่มีหลักฐานราคาตรงตัว ห้ามใช้ (1) แทน (2) หรือหาร/คูณตามลิตรโดยไม่มีข้อมูลออกแบบ

## งานวิจัยหลักที่นำไปอ้างอิงได้

### R1 — ปรับสภาพปัสสาวะและทำให้เกิดตะกอน

De Paepe, J., De Pryck, L., Verliefde, A. R. D., Rabaey, K., & Clauwaert, P. (2020). Electrochemically induced precipitation enables fresh urine stabilization and facilitates source separation. *Environmental Science & Technology, 54*(6), 3618–3627. DOI: 10.1021/acs.est.9b06804.

- [บทคัดย่อผู้แต่งและบรรณานุกรม](https://pubmed.ncbi.nlm.nih.gov/32049503/)
- รองรับ: การใช้ไฟฟ้าเคมีปรับสภาพปัสสาวะสดให้เกิดการตกตะกอนและช่วยรักษาสภาพก่อนขั้นต่อไป
- ใช้กับ DMR: เป็นฐานศึกษาของ EC101/F101 และการจัดสายตะกอน
- ไม่รองรับ: ราคาชุด 400,000 บาท ผลิตภัณฑ์อาหารที่ผ่านอนุมัติ หรือข้อสรุปว่าตะกอนทุกกรณีเป็นสารชนิดเดียว
- ระดับที่ตรวจ: บทคัดย่อและข้อมูลการตีพิมพ์ ไม่ได้ตรวจ supporting data ทุกชุด

### R2 — ปัสสาวะที่ไนตริฟายแล้วเป็นอาหารเพาะ Limnospira

De Paepe, J., Garcia Gragera, D., Arnau Jimenez, C., Rabaey, K., Vlaeminck, S. E., & Gòdia, F. (2023). Continuous cultivation of microalgae yields high nutrient recovery from nitrified urine with limited supplementation. *Journal of Environmental Management, 345*, 118500. DOI: 10.1016/j.jenvman.2023.118500.

- [คลังผลงานมหาวิทยาลัย Ghent พร้อมบทคัดย่อและ accepted manuscript](https://biblio.ugent.be/publication/01HJ19YHTK82W2BRJR4NHQ7H53)
- รองรับ: การใช้ nitrified urine ที่เติมธาตุจำเป็นสำหรับเพาะ Limnospira indica ทั้งงาน batch และ continuous ในระบบที่ศึกษา
- ใช้กับ DMR: ความจำเป็นของการตรวจองค์ประกอบ ปรับสูตร และเติมส่วนที่ขาดก่อน R401
- ข้อควรอ่านให้ตรง: การที่ตะกอนอาจให้ P/Ca/Mg ได้เพียงพอในหลักการ ไม่ได้ยืนยันเส้นทางคืน R102 ในโมเดลของเรา
- ไม่รองรับ: งบถังเพาะ 400,000 บาท ผลผลิตจริง DMR 40 L หรือการรับรองความปลอดภัยอาหาร
- ระดับที่ตรวจ: บทคัดย่อและ metadata ใน institutional repository มี manuscript ให้ดาวน์โหลด แต่การตรวจครั้งนี้ไม่อ้างว่าอ่านทั้งฉบับ

### R3 — เก็บเกี่ยวชีวมวลและกรองน้ำเลี้ยงก่อนหมุนเวียนกลับ

Tallec, J., et al. (2023). Implementation of an automated process for Limnospira indica harvesting and culture medium recycling for space applications. *Frontiers in Astronomy and Space Sciences, 10*, 1229043. DOI: 10.3389/fspas.2023.1229043.

- [บทความฉบับเต็ม](https://www.frontiersin.org/journals/astronomy-and-space-sciences/articles/10.3389/fspas.2023.1229043/full)
- รองรับ: แยก Biomass Harvesting Unit (BHU) แบบ dead-end บน stainless mesh ออกจาก Medium Filtration Unit (MFU) แบบ ultrafiltration เพื่อเตรียมน้ำเลี้ยงก่อนนำกลับ
- จุดที่มีผลต่องบ: mesh และ UF membrane ทำหน้าที่ต่างกัน มีงานวัด/ควบคุม ล้างย้อน และประเด็น cake/fouling จึงไม่ใช่เพียงซื้อฟิลเตอร์หนึ่งกระบอกแล้วถือว่าครบระบบ
- อุปกรณ์ MFU ที่งานนี้ใช้คือ PALL XLAB 5 กับ ceramic membrane 15 kDa ไม่ใช่ Repligen KR2i ในใบเสนอราคา P2 ด้านล่าง
- ไม่รองรับ: งบ 850,000 บาท หรือการรับรองว่าผลการทดลองทุกส่วนทำงานบนวงโคจรจริงแล้ว
- ระดับที่ตรวจ: ฉบับเต็มส่วนวิธีทดลอง อุปกรณ์ ผล และข้อจำกัด

### R4 — การเพาะต่อเนื่องและการออกแบบ PBR

Garcia-Gragera, D., Peiro, E., Arnau, C., Cornet, J.-F., Dussap, C.-G., & Gòdia, F. (2022). Dynamics of long-term continuous culture of Limnospira indica in an air-lift photobioreactor. *Microbial Biotechnology, 15*(3), 931–948. DOI: 10.1111/1751-7915.13882.

- [ข้อมูลบทความและบทคัดย่อ](https://pubmed.ncbi.nlm.nih.gov/34342154/)
- [ลิงก์ฉบับเต็ม PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8913870/)
- รองรับ: การพิจารณา dilution rate และ photon flux ในการเพาะต่อเนื่อง ไม่ใช้ปริมาตรถังเพียงอย่างเดียวตัดสินผลผลิต
- ไม่รองรับ: ราคาถังเพาะ ชุดแสง หรือการถือว่า air-lift บนโลกใช้ใน microgravity ได้เหมือนเดิม
- ระดับที่ตรวจ: metadata/บทคัดย่อที่ค้นได้; หน้า PMC ติด browser check ในการตรวจครั้งนี้ จึงไม่อ้างว่าอ่านฉบับเต็มใหม่แล้ว

เอกสารเสริมด้าน nitrification ที่ตรวจชื่อและ DOI ได้: De Paepe et al. (2021), *Electrochemical In Situ pH Control Enables Chemical-Free Full Urine Nitrification with Concomitant Nitrate Extraction*, Environmental Science & Technology 55(12), 8287–8298, [DOI 10.1021/acs.est.1c00041](https://doi.org/10.1021/acs.est.1c00041) และ [Supporting Information จาก ACS](https://pubs.acs.org/doi/suppl/10.1021/acs.est.1c00041/suppl_file/es1c00041_si_001.pdf). หน้าเนื้อหาหลักเข้าถึงไม่สำเร็จในรอบนี้ ควรอ่านฉบับเต็มก่อนใช้ค่าการเดินระบบ/ตัวเลขผลทดลอง

## แหล่งราคาอุปกรณ์ที่ตรวจสอบย้อนกลับได้

ราคา USD ด้านล่างเป็นราคาประกาศ/ราคาเอกสารเฉพาะแหล่ง ไม่ใช่ landed price ในประเทศไทยและไม่ใช่การยืนยันความเหมาะสมกับ DMR

เพื่อให้เห็นระดับเงินบาทเท่านั้น ใช้อัตราแลกเปลี่ยน **สมมติ 35.00 บาท/USD** ไม่ใช่อัตราตลาดหรืออัตราที่ควรใช้สั่งซื้อจริง

| รหัส | อุปกรณ์/แหล่ง | ราคา USD | บาทที่ FX สมมติ 35 | สถานะ |
| --- | --- | ---: | ---: | --- |
| P1 | JULABO CORIO CP-600F | 12,290 | 430,150 | ราคาหน้าผู้ผลิตที่ตรวจรอบนี้ ต้องยืนยันรุ่น/แรงดันและใบเสนอราคาไทย |
| P2 | Repligen KR2i TFF รหัส SYR2-U50 | 21,475 | 751,625 | ราคาต่อเครื่องในใบเสนอราคา 2 ก.พ. 2022 สำหรับรายการจำนวน 5 เครื่อง ไม่ใช่ราคาใหม่ |
| P2a | Repligen Install, Test & Basic User Training | 3,050 | 106,750 | ค่าแยกต่อหน่วยในใบเสนอราคาเดียวกัน ไม่ใช่ราคา integration ของ DMR ทั้งระบบ |
| P3 | Memmert VO49 vacuum oven | 15,903 | 556,605 | ราคาประกาศผู้จำหน่าย; เป็นทางเลือกแปรรูปนอก scope Core เดิม |
| P3a | Memmert PMP49 pump module | 9,313 | 325,955 | อุปกรณ์แยก ไม่รวมในราคา VO49 |

แหล่ง:

- P1: [JULABO USA — CORIO CP-600F](https://julabo.us/product/corio-cp-600f/)
- P2/P2a: [ใบเสนอราคา Repligen หมายเลข 00030736](https://hub.miracosta.edu/boarddocs/02242022/RepligenQuote00030736.pdf), หน้า PDF 3 จาก 15 (index 2), วันที่ 2 ก.พ. 2022 หมดอายุ 28 ก.พ. 2022
- P3/P3a: [Cole-Parmer — Memmert VO49](https://www.coleparmer.com/i/memmert-vo49-vacuum-oven-1-7-cu-ft-230-vac/5220117) และ [pump modules](https://www.coleparmer.com/p/memmert-pump-module-for-vo-vacuum-ovens/67864)
- คุณสมบัติของ VO49 จากผู้ผลิต: [Memmert VO49](https://www.memmert.com/de/produkte/waerme-trockenschraenke/vakuumschrank/vo49)

สูตรแปลงราคาตัวอย่าง: `12,290 × 35 = 430,150 บาท` ก่อนค่าขนส่ง ประกัน ภาษี ค่าอุปกรณ์เสริม ติดตั้ง และการปรับราคา

ตัวอย่างข้อจำกัดงบเก็บเกี่ยว: `21,475 + 3,050 = 24,525 USD`; ที่ FX สมมติ 35 เท่ากับ 858,375 บาท ก่อนค่าไทยและรายการเสริม จึงยังใช้ราคาเก่านี้รับรองว่างบเก็บเกี่ยว/ล้าง 850,000 บาทเพียงพอไม่ได้ และไม่ได้แปลว่าต้องเลือก Repligen รุ่นนี้

## หลักฐานรองรับงบเดิมทั้ง 8 หมวด

| งบเดิม | หลักฐานที่พบ | สิ่งที่ยังขาดเพื่อยืนยันยอด |
| --- | --- | --- |
| รับ/ปรับสภาพ/ไนตริฟิเคชัน 400,000 | R1 และบทความ nitrification รองรับหลักการ | BOM เซลล์ ถัง membrane gas handling ปั๊ม instrumentation และ quotation |
| ถังเพาะ/แสง 400,000 | R2/R4 รองรับการออกแบบชีวกระบวนการ | แบบถัง แสง/driver thermal/optical target วัสดุและราคาผลิต |
| ก๊าซ/อุณหภูมิ 550,000 | P1 ให้ราคาเทียบเฉพาะ circulator | gas modules, MFC, valves, interface และราคาไทย; candidate อาจไม่เหมาะกับงานจริง |
| เก็บเกี่ยว/ล้าง 850,000 | R3 รองรับระบบ; P2 เป็นราคาเทียบเก่าอีกเทคโนโลยี/configuration | เลือก BHU/MFU/พื้นที่กรองจริงและ RFQ ใหม่สำหรับล้าง/cleaning/instrumentation |
| เครื่องมือวัด/ควบคุม 450,000 | งานวิจัยชี้ว่าต้องวัด/ควบคุมหลายตัวแปร | รุ่น probe/transmitter/PLC/I-O/software licenses และราคาที่ไม่ซ้ำอุปกรณ์รวมในชุดสำเร็จรูป |
| โครง/ท่อ/ตู้/เครื่องกล 250,000 | ยังไม่มีหลักฐานราคาตรงหมวด | แบบผลิต cutting list วัสดุ fittings และใบเสนอราคางานเชื่อม/ประกอบ |
| ประกอบรวม/software/test 300,000 | P2a แสดงว่าบริการอุปกรณ์อาจคิดแยก แต่ไม่ใช่ฐานราคา DMR | work breakdown ชั่วโมงงาน อัตราค่าแรง FAT/SAT และ scope ไม่ซ้ำหมวดอื่น |
| ขนส่ง/สำรองประกัน 300,000 | ยังไม่มีราคา/สถิติรองรับหมวด | ขนาด/น้ำหนักจริง logistics quote warranty terms และ expected failure cost |

## ข้อความสำหรับใช้ในรายงานหรือสไลด์

“สถาปัตยกรรมกระบวนการอ้างอิงงานวิจัยด้านการปรับสภาพปัสสาวะด้วยไฟฟ้าเคมี การเพาะ Limnospira indica บน nitrified urine และการเก็บเกี่ยว/หมุนเวียนน้ำเลี้ยง ราคาบางโมดูลเทียบจากราคาประกาศผู้ผลิตและเอกสารเสนอราคา อย่างไรก็ตาม งบ Research Core 3.5 ล้านบาทยังเป็นสมมติฐานเบื้องต้น ต้องยืนยันด้วย BOM และใบเสนอราคาตาม configuration จริง”

ไม่ควรเขียนว่า “งานวิจัยยืนยันว่าเครื่อง DMR ราคา 3.5 ล้านบาท” หรือ “งบทุกหมวดอ้างจากงานวิจัยแล้ว”

## งานต่อเพื่อเปลี่ยนจากงบสมมติเป็นงบมีหลักฐาน

1. ปิดขอบเขต Research Core แยก W601 และ H701/DR701/FD701 ที่เป็น option
2. แตก BOM รายการ/จำนวน/สเปกขั้นต่ำ พร้อมรายการที่รวมมาในชุดอุปกรณ์แล้ว
3. ขอราคาจากผู้ผลิต/ตัวแทนสำหรับ configuration ที่สอดคล้องกับการออกแบบ ไม่ใช้แค่ยี่ห้อหรือปริมาตรใกล้กัน
4. แยก landed cost ค่าวัสดุ/ผลิต แรงงาน ประกอบ integration ทดสอบ ส่งมอบ และประกันไม่ให้ซ้ำ
5. เปลี่ยนงบเดิมตามหลักฐาน แม้ยอดรวมจะไม่เท่ากับ 3.5 ล้านบาท แล้วจึงคำนวณจุดคุ้มทุนใหม่

การค้นครั้งนี้ไม่เปลี่ยนไฟล์งบเดิม ไม่รับรอง vendor fit ไม่ใช่คำสั่งซื้อ และไม่แก้โมเดล/เว็บ
