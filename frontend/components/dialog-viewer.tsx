"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Reaction as ArticleReaction } from "@shared/types/article"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OrderChip } from "@/components/order-chip"
import {
  Search,
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
} from "lucide-react"
import type { JSX } from "react/jsx-runtime"

type ViewerReaction = ArticleReaction
type ViewMode = "original" | "summary"

const VIEW_MODE_STORAGE_KEY = "politopics_dialog_view_mode"

export interface Dialog {
  order: number
  speaker: string
  speaker_group: string
  speaker_position: string
  speaker_role: string
  summary_sections: DialogSection[]
  original_text: string
  reaction?: ViewerReaction
  qa?: {
    ask: {
      question: string
      who: string
      orders: number[]
    }
    answer: string
    answer_orders?: number[]
  } | {
    ask: {
      question: string
      who: string
      orders: number[]
    }
    answer: string
    answer_orders?: number[]
  }[]
  response_to: ResponseTo[]
}

export interface ResponseTo {
  dialog_id: number
  reaction: ViewerReaction
}

export type DialogSectionTitle =
  | "主張"
  | "説明"
  | "質問"
  | "回答"
  | "根拠"
  | "影響"
  | "次の対応"
  | "決定"

export interface DialogSection {
  title: DialogSectionTitle
  bullets: string[]
}

interface Term {
  term: string
  definition: string
}

interface DialogViewerProps {
  dialogs: Dialog[]
  terms?: Term[]
  title?: string
  className?: string
  jumpOrders?: number[]
  jumpToken?: number
}

function getReactionIcon(reaction?: ViewerReaction): string {
  switch (reaction) {
    case "賛成":
      return "✓"
    case "反対":
      return "✗"
    case "質問":
      return "?"
    case "回答":
      return "!"
    case "中立":
    default:
      return "○"
  }
}

function getReactionColor(reaction?: ViewerReaction): string {
  switch (reaction) {
    case "賛成":
      return "text-green-600 bg-green-50"
    case "反対":
      return "text-red-600 bg-red-50"
    case "質問":
      return "text-blue-600 bg-blue-50"
    case "回答":
      return "text-purple-600 bg-purple-50"
    case "中立":
    default:
      return "text-gray-500 bg-gray-50"
  }
}

function getReactionLabel(reaction?: ViewerReaction): string {
  switch (reaction) {
    case "賛成":
      return "賛成"
    case "反対":
      return "反対"
    case "質問":
      return "質問"
    case "回答":
      return "回答"
    case "中立":
    default:
      return "中立"
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightTerms(text: string, terms: Term[] = []): JSX.Element {
  if (!terms.length) {
    return <span>{text}</span>
  }

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length)

  const pattern = new RegExp(
    `(${sortedTerms.map((t) => escapeRegExp(t.term)).join("|")})`,
    "gi",
  )

  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) => {
        const term = terms.find((t) => t.term.toLowerCase() === part.toLowerCase())
        if (term) {
          return (
            <TooltipProvider key={`term-${index}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50 hover:decoration-primary">
                    {part}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" sideOffset={12} className="max-w-xs">
                  <p className="font-semibold">{term.term}</p>
                  <p className="text-sm">{term.definition}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        }
        return <span key={`text-${index}`}>{part}</span>
      })}
    </>
  )
}

const ORDER_TOKEN_REGEX = /\[\[orders:([0-9,\s-]+)\]\]/g

function parseOrderSpec(spec: string): number[] {
  const cleaned = spec.replace(/\s+/g, "")
  if (!cleaned) return []
  const orders: number[] = []
  const parts = cleaned.split(",")
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const rangeMatch = trimmed.split("-")
    if (rangeMatch.length === 2) {
      const start = Number(rangeMatch[0])
      const end = Number(rangeMatch[1])
      if (!Number.isFinite(start) || !Number.isFinite(end)) continue
      const from = Math.min(start, end)
      const to = Math.max(start, end)
      for (let i = from; i <= to; i += 1) {
        orders.push(i)
      }
    } else {
      const value = Number(trimmed)
      if (!Number.isFinite(value)) continue
      orders.push(value)
    }
  }
  return Array.from(new Set(orders)).sort((a, b) => a - b)
}

function renderTextWithOrders(
  text: string,
  terms: Term[],
  onOrdersClick: (orders: number[]) => void,
): JSX.Element {
  const matches = text.match(ORDER_TOKEN_REGEX)
  if (!matches) {
    return highlightTerms(text, terms)
  }

  const nodes: JSX.Element[] = []
  let lastIndex = 0
  let nodeIndex = 0
  ORDER_TOKEN_REGEX.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = ORDER_TOKEN_REGEX.exec(text)) !== null) {
    const [fullMatch, spec] = match
    const before = text.slice(lastIndex, match.index)
    if (before) {
      nodes.push(
        <span key={`text-${nodeIndex += 1}`}>{highlightTerms(before, terms)}</span>,
      )
    }
    const orders = parseOrderSpec(spec)
    if (orders.length > 0) {
      nodes.push(
        <OrderChip
          key={`orders-${nodeIndex += 1}`}
          orders={orders}
          label={`#${spec}`}
          onClick={onOrdersClick}
        />,
      )
    } else {
      nodes.push(<span key={`text-${nodeIndex += 1}`}>{fullMatch}</span>)
    }
    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`text-${nodeIndex += 1}`}>{highlightTerms(text.slice(lastIndex), terms)}</span>,
    )
  }

  return <>{nodes}</>
}

function normalizeSections(sections?: DialogSection[]): DialogSection[] {
  if (!Array.isArray(sections)) return []
  const isDialogSectionTitle = (value: unknown): value is DialogSectionTitle =>
    value === "主張" ||
    value === "説明" ||
    value === "質問" ||
    value === "回答" ||
    value === "根拠" ||
    value === "影響" ||
    value === "次の対応" ||
    value === "決定"
  return sections
    .map((section) => {
      const title = typeof section.title === "string" ? section.title.trim() : ""
      const bullets = Array.isArray(section.bullets)
        ? section.bullets.map((bullet) => bullet.trim()).filter(Boolean)
        : []
      return { title, bullets }
    })
    .filter((section): section is DialogSection => {
      return isDialogSectionTitle(section.title) && section.bullets.length > 0
    })
}

function getSectionSearchText(sections?: DialogSection[]): string {
  return normalizeSections(sections)
    .map((section) => [section.title, ...section.bullets].join(" ").trim())
    .filter(Boolean)
    .join(" ")
}

function renderSectionedText(
  sections: DialogSection[],
  terms: Term[],
  onOrdersClick: (orders: number[]) => void,
): JSX.Element {
  const normalizedSections = normalizeSections(sections)
  if (normalizedSections.length === 0) {
    return <></>
  }

  const sectionTone: Record<DialogSectionTitle, { base: string; dot: string }> = {
    主張: { base: "border-amber-200/70 bg-amber-50/70", dot: "bg-amber-400/70" },
    説明: { base: "border-sky-200/70 bg-sky-50/70", dot: "bg-sky-400/70" },
    質問: { base: "border-blue-200/70 bg-blue-50/70", dot: "bg-blue-400/70" },
    回答: { base: "border-purple-200/70 bg-purple-50/70", dot: "bg-purple-400/70" },
    根拠: { base: "border-emerald-200/70 bg-emerald-50/70", dot: "bg-emerald-400/70" },
    影響: { base: "border-rose-200/70 bg-rose-50/70", dot: "bg-rose-400/70" },
    次の対応: { base: "border-lime-200/70 bg-lime-50/70", dot: "bg-lime-400/70" },
    決定: { base: "border-teal-200/70 bg-teal-50/70", dot: "bg-teal-400/70" },
  }

  return (
    <div className="space-y-3">
      {normalizedSections.map((section, sectionIndex) => {
        const tone = sectionTone[section.title]
        return (
        <div
          key={`section-${sectionIndex}`}
          className={`mt-3 rounded-md border p-3 text-xs ${tone?.base ?? "border-primary/10 bg-primary/5"}`}
        >
          {section.title ? (
            <Badge variant="outline" className="text-[11px] px-2 py-0.5">
              {section.title}
            </Badge>
          ) : null}
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {section.bullets.map((bullet, bulletIndex) => (
              <li key={`section-${sectionIndex}-bullet-${bulletIndex}`} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                    tone?.dot ?? "bg-muted-foreground/60"
                  }`}
                />
                <span className="flex-1">{renderTextWithOrders(bullet, terms, onOrdersClick)}</span>
              </li>
            ))}
          </ul>
        </div>
      )})}
    </div>
  )
}

export function DialogViewer({
  dialogs,
  terms = [],
  title = "会議の議事録",
  className = "",
  jumpOrders = [],
  jumpToken = 0,
}: DialogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedReaction, setSelectedReaction] = useState<ViewerReaction | "all">("all")
  const [orderFilter, setOrderFilter] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("summary")
  const [expandedDialogs, setExpandedDialogs] = useState<Set<number>>(new Set())
  const [hasHydrated, setHasHydrated] = useState(false)
  const [originalTextVisible, setOriginalTextVisible] = useState<Set<number>>(new Set())
  const [highlightedOrders, setHighlightedOrders] = useState<Set<number>>(new Set())
  const scrollTopRef = useRef(0)
  const anchorOrderRef = useRef<number | null>(null)
  const scrollContainersRef = useRef<Record<ViewMode, HTMLDivElement | null>>({
    original: null,
    summary: null,
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (stored === "soft_summary") {
        setViewMode("summary")
      } else if (stored === "original" || stored === "summary") {
        setViewMode(stored)
      }
    } catch {
      // Ignore storage access errors (e.g. private mode).
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode)
    } catch {
      // Ignore storage access errors (e.g. private mode).
    }
  }, [hasHydrated, viewMode])

  const speakers = useMemo(() => {
    const uniqueSpeakers = Array.from(new Set(dialogs.map((d) => d.speaker)))
    return uniqueSpeakers.sort()
  }, [dialogs])

  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(dialogs.map((d) => d.speaker_group).filter(Boolean)))
    return uniqueGroups.sort()
  }, [dialogs])

  const filteredDialogs = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase()

    return dialogs.filter((dialog) => {
      const qaItems = Array.isArray(dialog.qa)
        ? dialog.qa
        : dialog.qa
          ? [dialog.qa]
          : []
      const qaText = qaItems
        .map((qa) => `${qa.ask?.question ?? ""} ${qa.ask?.who ?? ""} ${qa.answer ?? ""}`)
        .join(" ")
      const sectionText = [
        getSectionSearchText(dialog.summary_sections),
      ]
        .join(" ")
        .trim()
      const matchesSearch =
        searchTerm === "" ||
        dialog.speaker.toLowerCase().includes(normalizedSearch) ||
        dialog.original_text.toLowerCase().includes(normalizedSearch) ||
        qaText.toLowerCase().includes(normalizedSearch) ||
        sectionText.toLowerCase().includes(normalizedSearch)

      const matchesSpeaker = selectedSpeaker === "all" || dialog.speaker === selectedSpeaker

      const matchesGroup =
        selectedGroup === "all" ||
        (dialog.speaker_group && dialog.speaker_group === selectedGroup)

      const matchesReaction =
        selectedReaction === "all" ||
        dialog.reaction === selectedReaction ||
        dialog.response_to.some((response) => response.reaction === selectedReaction)

      const matchesOrder =
        orderFilter.length === 0 || orderFilter.includes(dialog.order)

      return matchesSearch && matchesSpeaker && matchesGroup && matchesReaction && matchesOrder
    })
  }, [dialogs, searchTerm, selectedSpeaker, selectedGroup, selectedReaction, orderFilter])

  const toggleDialogExpansion = (dialogOrder: number) => {
    const newExpanded = new Set(expandedDialogs)
    if (newExpanded.has(dialogOrder)) {
      newExpanded.delete(dialogOrder)
    } else {
      newExpanded.add(dialogOrder)
    }
    setExpandedDialogs(newExpanded)
  }

  const toggleOriginalText = (dialogOrder: number) => {
    const newVisible = new Set(originalTextVisible)
    if (newVisible.has(dialogOrder)) {
      newVisible.delete(dialogOrder)
    } else {
      newVisible.add(dialogOrder)
    }
    setOriginalTextVisible(newVisible)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedSpeaker("all")
    setSelectedGroup("all")
    setSelectedReaction("all")
    setOrderFilter([])
  }

  const applyOrderFilter = (orders: number[]) => {
    if (orders.length === 0) return
    setSearchTerm("")
    setSelectedSpeaker("all")
    setSelectedGroup("all")
    setSelectedReaction("all")
    setOrderFilter(orders)
    const primary = orders[0]
    requestAnimationFrame(() => scrollToOrder(primary))
  }

  const scrollToOrder = (order: number) => {
    const viewport = getScrollViewport(viewMode)
    if (!viewport) return
    const target = viewport.querySelector(`[data-dialog-order="${order}"]`) as HTMLElement | null
    if (!target) return
    const viewportRect = viewport.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    viewport.scrollTop += targetRect.top - viewportRect.top - 12
  }

  const getScrollViewport = (mode: ViewMode) => {
    const container = scrollContainersRef.current[mode]
    if (!container) return null
    return container.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null
  }

  const captureAnchorOrder = (mode: ViewMode) => {
    const viewport = getScrollViewport(mode)
    if (!viewport) return
    scrollTopRef.current = viewport.scrollTop
    const viewportRect = viewport.getBoundingClientRect()
    const items = Array.from(viewport.querySelectorAll<HTMLElement>('[data-dialog-order]'))
    if (items.length === 0) return

    let candidate: { order: number; top: number } | null = null
    for (const item of items) {
      const rect = item.getBoundingClientRect()
      const top = rect.top - viewportRect.top
      if (top >= -8) {
        const order = Number(item.dataset.dialogOrder)
        if (!Number.isNaN(order) && (!candidate || top < candidate.top)) {
          candidate = { order, top }
        }
      }
    }

    if (!candidate) {
      const last = items[items.length - 1]
      const order = Number(last.dataset.dialogOrder)
      if (!Number.isNaN(order)) {
        candidate = { order, top: 0 }
      }
    }

    if (candidate) {
      anchorOrderRef.current = candidate.order
    }
  }

  const restoreAnchorOrder = (mode: ViewMode) => {
    const viewport = getScrollViewport(mode)
    if (!viewport) return
    const anchorOrder = anchorOrderRef.current
    if (anchorOrder == null) {
      viewport.scrollTop = scrollTopRef.current
      return
    }
    const target = viewport.querySelector(`[data-dialog-order="${anchorOrder}"]`) as HTMLElement | null
    if (!target) {
      viewport.scrollTop = scrollTopRef.current
      return
    }
    const viewportRect = viewport.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    viewport.scrollTop += targetRect.top - viewportRect.top
  }

  const handleViewModeChange = (nextMode: ViewMode) => {
    if (nextMode === viewMode) return
    captureAnchorOrder(viewMode)
    setViewMode(nextMode)
  }

  const hasDialogs = filteredDialogs.length > 0
  const dialogListHeightClass =
    "h-[55svh] max-h-[55svh] min-h-[240px] sm:h-[60svh] sm:max-h-[60svh] md:h-[65vh] md:max-h-[65vh] lg:h-[60vh] lg:max-h-[60vh]"

  useEffect(() => {
    if (!hasDialogs) return
    const handle = requestAnimationFrame(() => {
      restoreAnchorOrder(viewMode)
    })
    return () => cancelAnimationFrame(handle)
  }, [viewMode, hasDialogs])

  useEffect(() => {
    if (!jumpToken || jumpOrders.length === 0) return
    applyOrderFilter(jumpOrders)
    setHighlightedOrders(new Set(jumpOrders))
    const timeout = window.setTimeout(() => setHighlightedOrders(new Set()), 3500)
    return () => clearTimeout(timeout)
  }, [jumpToken, jumpOrders])

  const emptyState = (
    <Card>
      <CardContent className="pt-6 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">現在のフィルター条件に一致する発言がありません。</p>
        <Button variant="outline" onClick={clearFilters} className="mt-4 bg-transparent">
          フィルターをクリア
        </Button>
      </CardContent>
    </Card>
  )

  const renderSummaryCards = () => (
    <div className="grid gap-2 pr-2">
      {filteredDialogs.map((dialog) => {
        const isOriginalVisible = originalTextVisible.has(dialog.order)
        const isHighlighted = highlightedOrders.has(dialog.order)
        const originalText = dialog.original_text
        const qaItems = Array.isArray(dialog.qa)
          ? dialog.qa
          : dialog.qa
            ? [dialog.qa]
            : []
        const hasQa = qaItems.some((qa) => qa.ask?.question && qa.answer)
        const rawSections =
          viewMode === "summary"
            ? dialog.summary_sections
            : undefined
        const normalizedSections = normalizeSections(rawSections)
        const renderedContent =
          viewMode === "original"
            ? renderTextWithOrders(originalText, terms, applyOrderFilter)
            : normalizedSections.length > 0
              ? renderSectionedText(normalizedSections, terms, applyOrderFilter)
              : (
                <span className="text-muted-foreground">要約セクションは準備中です。</span>
              )

        return (
          <Card
            key={dialog.order}
            data-dialog-order={dialog.order}
            className={`hover:shadow-md transition-shadow overflow-hidden py-2 ${
              isHighlighted ? "ring-2 ring-primary/40 bg-primary/5" : ""
            }`}
          >
            <CardContent className="py-3">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-semibold text-primary">{dialog.order}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{dialog.speaker}</h4>
                    {dialog.speaker_group ? (
                      <Badge variant="outline" className="text-xs">
                        {dialog.speaker_group}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" className="text-xs">
                      {viewMode === "original" ? "原文" : "詳細"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug break-words whitespace-pre-line">
                    {renderedContent}
                  </div>
                  {hasQa && (
                    <div className="mt-3 rounded-md border border-primary/10 bg-primary/5 p-3 text-xs">
                      {qaItems.map((qa, index) => (
                        <div key={`qa-${dialog.order}-${index}`} className={index === 0 ? "" : "mt-3"}>
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600">Q</span>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{qa.ask.question}</p>
                              <p className="text-muted-foreground">質問者: {qa.ask.who}</p>
                              {qa.ask.orders?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {qa.ask.orders.map((order) => (
                                    <button
                                      key={`ask-${dialog.order}-${index}-${order}`}
                                      type="button"
                                      onClick={() => scrollToOrder(order)}
                                      className="rounded bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700 hover:bg-blue-200"
                                    >
                                      #{order}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-2 flex items-start gap-2">
                            <span className="font-semibold text-purple-600">A</span>
                            <div className="space-y-1">
                              <p className="text-foreground">{qa.answer}</p>
                              {qa.answer_orders?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {qa.answer_orders.map((order) => (
                                    <button
                                      key={`answer-${dialog.order}-${index}-${order}`}
                                      type="button"
                                      onClick={() => scrollToOrder(order)}
                                      className="rounded bg-purple-100 px-2 py-0.5 text-[11px] text-purple-700 hover:bg-purple-200"
                                    >
                                      #{order}
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {isOriginalVisible && viewMode !== "original" && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">原文</span>
                      </div>
                      <div className="text-sm text-foreground leading-snug bg-muted/30 p-3 rounded-md whitespace-pre-line">
                        {highlightTerms(originalText, terms)}
                      </div>
                    </div>
                  )}
                  {viewMode !== "original" && (
                    <div className="flex justify-start pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOriginalText(dialog.order)}
                        className="flex items-center gap-1 text-xs"
                      >
                        {isOriginalVisible ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            原文を隠す
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            原文を表示
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  {dialog.response_to.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t">
                      {dialog.response_to.map((response, index) => (
                        <span
                          key={index}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getReactionColor(
                            response.reaction,
                          )}`}
                        >
                          <span>{getReactionIcon(response.reaction)}</span>
                          <span>#{response.dialog_id}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            {title}
          </h2>
          <Badge variant="secondary" className="text-sm">
            {filteredDialogs.length} / {dialogs.length} 件の発言
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="発言内容、発言者名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select value={selectedSpeaker} onValueChange={setSelectedSpeaker}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべての発言者" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての発言者</SelectItem>
                    {speakers.map((speaker) => (
                      <SelectItem key={speaker} value={speaker}>
                        {speaker}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべての会派" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての会派</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedReaction} onValueChange={(value) => setSelectedReaction(value as ViewerReaction | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべての反応" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての反応</SelectItem>
                    <SelectItem value="賛成">賛成</SelectItem>
                    <SelectItem value="反対">反対</SelectItem>
                    <SelectItem value="質問">質問</SelectItem>
                    <SelectItem value="回答">回答</SelectItem>
                    <SelectItem value="中立">中立</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="表示モード" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        原文
                      </div>
                    </SelectItem>
                    <SelectItem value="summary">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        詳細要約
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  フィルタークリア
                </Button>
              </div>
              {orderFilter.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>発言番号フィルター:</span>
                  {orderFilter.map((order) => (
                    <Badge key={`order-filter-${order}`} variant="secondary" className="text-[11px]">
                      #{order}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="original" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              原文表示
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              詳細要約
            </TabsTrigger>
          </TabsList>

          <TabsContent value="original" className="space-y-4">
            {!hasDialogs ? (
              emptyState
            ) : (
              <div ref={(node) => {
                scrollContainersRef.current.original = node
              }}>
                <ScrollArea className={`${dialogListHeightClass} pr-1`}>{renderSummaryCards()}</ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {!hasDialogs ? (
              emptyState
            ) : (
              <div ref={(node) => {
                scrollContainersRef.current.summary = node
              }}>
                <ScrollArea className={`${dialogListHeightClass} pr-1`}>{renderSummaryCards()}</ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
