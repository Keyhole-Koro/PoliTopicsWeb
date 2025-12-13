export type BaseSummary = {
  based_on_orders: number[]
  summary: string
}

export type Summary = BaseSummary
export type SoftSummary = BaseSummary
export type MiddleSummary = BaseSummary

export type Reaction = "賛成" | "反対" | "質問" | "回答" | "中立"

export type Dialog = {
  order: number
  summary: string
  soft_language: string
  reaction: Reaction
  speaker?: string
  position?: string
}

export type Participant = {
  name: string
  position?: string
  summary: string
  based_on_orders?: number[]
}

export type KeywordPriority = "high" | "medium" | "low"

export type Keyword = {
  keyword: string
  priority: KeywordPriority
}

export type Term = {
  term: string
  definition: string
}

export type ArticleImageKind = "会議録" | "目次" | "索引" | "附録" | "追録"

export type ArticleSummary = {
  id: string
  title: string
  description: string
  date: string
  month: string
  categories: string[]
  participants: Participant[]
  keywords: Keyword[]
  imageKind: ArticleImageKind
  session: number
  nameOfHouse: string
  nameOfMeeting: string
}

export default interface Article extends ArticleSummary {
  summary: Summary
  soft_summary: SoftSummary
  middle_summary: MiddleSummary[]
  dialogs: Dialog[]
  participants: Participant[]
  keywords: Keyword[]
  terms: Term[]
}

export type { Article }

export type SearchFilters = {
  words?: string[]
  categories?: string[]
  houses?: string[]
  meetings?: string[]
  dateStart?: string
  dateEnd?: string
  sort?: "date_desc" | "date_asc"
  limit?: number
}
