export interface ResearchPaper {
  id: string
  kind?: 'research' | 'agency-resource' | 'regulatory-guidance' | 'technical-guide' | 'manufacturer-document' | 'conference-presentation' | 'textbook'
  title: string
  authors: string[]
  year: number | null
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
