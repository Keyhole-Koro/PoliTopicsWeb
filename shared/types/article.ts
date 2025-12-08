export type ArticleSummary = {
  id: string
  title: string
  description: string
  date: string
  month: string
  categories: string[]
  keywords: string[]
  participants: string[]
  imageKind: string
  session: string
  nameOfHouse: string
  nameOfMeeting: string
}

export type ArticlePayload = {
  summary: {
    based_on_orders: number[]
    summary: string
  }
  soft_summary: {
    based_on_orders: number[]
    summary: string
  }
  dialogs: {
    order: number
    summary: string
    soft_language: string
    speaker?: string
    position?: string
  }[]
}

export type Article = ArticleSummary & {
  participants_detail?: {
    name: string
    summary: string
  }[]
  terms: string[]
  payload_url: string
  payload?: ArticlePayload
  summary: string
  soft_summary: string
}

export type SearchFilters = {
  words?: string[]
  categories?: string[]
  sort?: "date_desc" | "date_asc"
  limit?: number
}
