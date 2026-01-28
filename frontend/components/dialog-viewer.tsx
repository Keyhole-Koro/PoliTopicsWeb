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
import {
  Search,
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  BookOpen,
} from "lucide-react"
import type { JSX } from "react/jsx-runtime"

type ViewerReaction = ArticleReaction
type ViewMode = "original" | "soft_summary" | "summary"

const VIEW_MODE_STORAGE_KEY = "politopics_dialog_view_mode"

export interface Dialog {
  order: number
  speaker: string
  speaker_group: string
  speaker_position: string
  speaker_role: string
  summary: string
  original_text: string
  soft_summary: string
  reaction?: ViewerReaction
  response_to: ResponseTo[]
}

export interface ResponseTo {
  dialog_id: number
  reaction: ViewerReaction
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

export function DialogViewer({ dialogs, terms = [], title = "会議の議事録", className = "" }: DialogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all")
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedReaction, setSelectedReaction] = useState<ViewerReaction | "all">("all")
  const [viewMode, setViewMode] = useState<ViewMode>("summary")
  const [expandedDialogs, setExpandedDialogs] = useState<Set<number>>(new Set())
  const [hasHydrated, setHasHydrated] = useState(false)
  const [originalTextVisible, setOriginalTextVisible] = useState<Set<number>>(new Set())
  const scrollTopRef = useRef(0)
  const anchorOrderRef = useRef<number | null>(null)
  const scrollContainersRef = useRef<Record<ViewMode, HTMLDivElement | null>>({
    original: null,
    soft_summary: null,
    summary: null,
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (stored === "original" || stored === "soft_summary" || stored === "summary") {
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
      const matchesSearch =
        searchTerm === "" ||
        dialog.summary.toLowerCase().includes(normalizedSearch) ||
        dialog.speaker.toLowerCase().includes(normalizedSearch) ||
        dialog.soft_summary.toLowerCase().includes(normalizedSearch) ||
        dialog.original_text.toLowerCase().includes(normalizedSearch)

      const matchesSpeaker = selectedSpeaker === "all" || dialog.speaker === selectedSpeaker

      const matchesGroup =
        selectedGroup === "all" ||
        (dialog.speaker_group && dialog.speaker_group === selectedGroup)

      const matchesReaction =
        selectedReaction === "all" ||
        dialog.reaction === selectedReaction ||
        dialog.response_to.some((response) => response.reaction === selectedReaction)

      return matchesSearch && matchesSpeaker && matchesGroup && matchesReaction
    })
  }, [dialogs, searchTerm, selectedSpeaker, selectedGroup, selectedReaction])

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
        const originalText = dialog.original_text
        const displayText =
          viewMode === "original"
            ? dialog.original_text
            : viewMode === "soft_summary"
              ? dialog.soft_summary
              : dialog.summary

        return (
          <Card key={dialog.order} data-dialog-order={dialog.order} className="hover:shadow-md transition-shadow overflow-hidden py-2">
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
                      {viewMode === "original" ? "原文" : viewMode === "soft_summary" ? "やさしい" : "詳細"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug break-words">
                    {highlightTerms(displayText, terms)}
                  </div>
                  {isOriginalVisible && viewMode !== "original" && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">原文</span>
                      </div>
                      <div className="text-xs text-foreground leading-snug bg-muted/30 p-3 rounded-md">
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
                    <SelectItem value="soft_summary">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        やさしい言葉
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
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => handleViewModeChange(value as ViewMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="original" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              原文表示
            </TabsTrigger>
            <TabsTrigger value="soft_summary" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              やさしい言葉
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

          <TabsContent value="soft_summary" className="space-y-4">
            {!hasDialogs ? (
              emptyState
            ) : (
              <div ref={(node) => {
                scrollContainersRef.current.soft_summary = node
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
