export interface ResearchPaper {
  id: string
  title: string
  authors: string[]
  year: number
  publication: string
  doi?: string
  sourceUrl: string
  pdfUrl?: string
  summary: string
  processIds: string[]
  supports: string[]
  limitations: string[]
  unverifiedClaims: string[]
}
