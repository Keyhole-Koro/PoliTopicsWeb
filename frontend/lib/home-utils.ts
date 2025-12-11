import type { ArticleSummary } from "@shared/types/article"

export type KeywordStat = {
  keyword: string
  count: number
  priority: "high" | "medium" | "low"
}

export type ParticipantStat = {
  name: string
  count: number
}

export type PersonInsight = {
  total: number
  meetings: string[]
  keywords: string[]
  latest?: ArticleSummary
}

export function normalizeWords(value: string) {
  return value
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean)
    .join(",")
}

export function isWithinRange(date: Date, range: string) {
  if (range === "all") return true
  const now = Date.now()
  const articleTime = date.getTime()
  const diff = now - articleTime
  const day = 24 * 60 * 60 * 1000

  switch (range) {
    case "1week":
      return diff <= 7 * day
    case "1month":
      return diff <= 30 * day
    case "3months":
      return diff <= 90 * day
    case "6months":
      return diff <= 180 * day
    case "1year":
      return diff <= 365 * day
    default:
      return true
  }
}

export function focusSearchSection() {
  if (typeof window === "undefined") return
  const section = document.getElementById("search-section")
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" })
    window.scrollBy(0, -80)
  }
}

export function buildKeywordStats(articles: ArticleSummary[]): KeywordStat[] {
  const counts = new Map<string, number>()
  articles.forEach((article) => {
    ;(article.keywords ?? []).forEach((keyword) => {
      counts.set(keyword.keyword, (counts.get(keyword.keyword) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count], index) => {
      let priority: KeywordStat["priority"] = "low"
      if (index < 3) priority = "high"
      else if (index < 5) priority = "medium"
      return { keyword, count, priority }
    })
}

export function buildParticipantStats(articles: ArticleSummary[]): ParticipantStat[] {
  const counts = new Map<string, number>()
  articles.forEach((article) => {
    ;(article.participants ?? []).forEach((participant) => {
      counts.set(participant.name, (counts.get(participant.name) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))
}

export function buildPersonInsight(selectedPerson: string | null, articles: ArticleSummary[]): PersonInsight | null {
  if (!selectedPerson) return null
  const related = articles
    .filter((article) => (article.participants ?? []).some((participant) => participant.name === selectedPerson))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (related.length === 0) {
    return null
  }

  const meetings = Array.from(new Set(related.map((article) => article.nameOfMeeting))).filter(Boolean).slice(0, 4)
  const keywords = Array.from(new Set(related.flatMap((article) => (article.keywords ?? []).map((keyword) => keyword.keyword))))
    .filter(Boolean)
    .slice(0, 6)

  return {
    total: related.length,
    meetings,
    keywords,
    latest: related[0],
  }
}
