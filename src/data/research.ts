import type { ResearchPaper } from '../types/research'
import type { ProcessStep } from '../types/machine'

export function filterResearch(papers: ResearchPaper[], keyword: string, processId: string, category = ''): ResearchPaper[] {
  const query = keyword.trim().normalize('NFC').toLocaleLowerCase('th')
  return papers.filter(paper => (!processId || paper.processIds.includes(processId)) && (!category || paper.category === category) && (!query || [paper.id, paper.title, ...paper.authors, String(paper.year), paper.category ?? '', ...(paper.componentIds ?? []), paper.publication, paper.doi ?? '', paper.summary, ...paper.supports, ...paper.limitations, ...paper.unverifiedClaims].join(' ').normalize('NFC').toLocaleLowerCase('th').includes(query)))
}

export function researchForStep(papers: ResearchPaper[], step: ProcessStep | undefined): ResearchPaper[] {
  return step ? papers.filter(paper => step.researchIds?.includes(paper.id) || paper.processIds.includes(step.id) || paper.componentIds?.some(id => step.activeParts.includes(id))) : []
}
