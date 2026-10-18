import type { ResearchPaper } from '../types/research'

export function filterResearch(papers: ResearchPaper[], keyword: string, processId: string): ResearchPaper[] {
  const query = keyword.trim().normalize('NFC').toLocaleLowerCase('th')
  return papers.filter(paper => (!processId || paper.processIds.includes(processId)) && (!query || [paper.title, ...paper.authors, paper.publication, paper.doi ?? '', paper.summary, ...paper.supports, ...paper.limitations, ...paper.unverifiedClaims].join(' ').normalize('NFC').toLocaleLowerCase('th').includes(query)))
}
