// ============================================================
// Education Domain — Types
// ============================================================

export type ContentType = 'article' | 'video' | 'infographic'

export interface EducationalMaterial {
  id: string
  title: string
  contentType: ContentType
  body: string
  mediaUrl?: string
  tags?: string[]
  createdAt: string
}
