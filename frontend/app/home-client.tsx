'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ArticleSummary, SearchFilters } from "@shared/types/article"
import { fetchSuggestions } from "@/lib/api"
import { HomeHeader } from "@/components/home/home-header"
import { AboutPanel } from "@/components/home/about-panel"
import { HeroSection } from "@/components/home/hero-section"
import { SearchControls } from "@/components/home/search-controls"
import { PersonInsightCard } from "@/components/home/person-insight-card"
import { FeaturedArticleCard, LatestArticlesRow, ArticleGridSection } from "@/components/home/articles-sections"
import { KeywordTrends, KeyParticipants } from "@/components/home/stats-sections"
import { SiteFooter } from "@/components/home/site-footer"
import {
  buildKeywordStats,
  buildParticipantStats,
  buildPersonInsight,
  focusSearchSection,
  normalizeWords,
  type KeywordStat,
  type ParticipantStat,
  type PersonInsight,
} from "@/lib/home-utils"

type Props = {
  articles: ArticleSummary[]
}

const FILTER_STORAGE_KEY = "politopics-home-filters"
const GRID_PAGE_SIZE = 6

export function HomeClient({ articles }: Props) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchInputValue, setSearchInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedHouse, setSelectedHouse] = useState("all")
  const [selectedMeeting, setSelectedMeeting] = useState("all")
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined)
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SearchFilters["sort"]>("date_desc")
  const [showFilters, setShowFilters] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [gridVisibleCount, setGridVisibleCount] = useState(GRID_PAGE_SIZE)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      setSelectedCategory(parsed.selectedCategory ?? "all")
      setSelectedHouse(parsed.selectedHouse ?? "all")
      setSelectedMeeting(parsed.selectedMeeting ?? "all")
      setSelectedPerson(parsed.selectedPerson ?? null)
      setSortOrder(parsed.sortOrder ?? "date_desc")
      if (parsed.dateStart) {
        setDateStart(new Date(parsed.dateStart))
      }
      if (parsed.dateEnd) {
        setDateEnd(new Date(parsed.dateEnd))
      }
    } catch (error) {
      console.warn("[home] failed to restore filters", error)
    }
  }, [])

  useEffect(() => {
    setSearchInputValue(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    if (searchInputValue === searchTerm) {
      return
    }
    const timeout = setTimeout(() => {
      setSearchTerm(searchInputValue)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchInputValue, searchTerm])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSelectedPerson(null)
    }
  }, [searchTerm])

  useEffect(() => {
    const payload = {
      selectedCategory,
      selectedHouse,
      selectedMeeting,
      selectedPerson,
      dateStart: dateStart?.toISOString(),
      dateEnd: dateEnd?.toISOString(),
      sortOrder,
    }
    console.log("[home] saving filters to localStorage")
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload))
  }, [selectedCategory, selectedHouse, selectedMeeting, selectedPerson, dateStart, dateEnd, sortOrder])

  useEffect(() => {
    if (!isTyping || searchTerm.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const suggestionFilters: Partial<SearchFilters> = {
      categories: selectedCategory === "all" ? [] : [selectedCategory],
      houses: selectedHouse === "all" ? [] : [selectedHouse],
      meetings: selectedMeeting === "all" ? [] : [selectedMeeting],
      dateStart: dateStart?.toISOString(),
      dateEnd: dateEnd?.toISOString(),
    }
    fetchSuggestions(searchTerm.trim(), {
      limit: 5,
      filters: suggestionFilters,
      signal: controller.signal,
    })
      .then((response) => setSuggestions(response.suggestions))
      .catch(() => setSuggestions([]))

    return () => controller.abort()
  }, [isTyping, searchTerm, selectedCategory, selectedHouse, selectedMeeting, dateStart, dateEnd, sortOrder])

  const safeArticles = useMemo(() => {
    return articles.map((article) => ({
      ...article,
      categories: article.categories ?? [],
      keywords: article.keywords ?? [],
      participants: article.participants ?? [],
      nameOfHouse: article.nameOfHouse ?? "",
      nameOfMeeting: article.nameOfMeeting ?? "",
    }))
  }, [articles])

  const categories = useMemo(() => {
    const values = new Set<string>()
    safeArticles.forEach((article) => {
      article.categories.forEach((category) => values.add(category))
    })
    return Array.from(values).sort()
  }, [safeArticles])

  const houses = useMemo(() => {
    const values = new Set<string>()
    safeArticles.forEach((article) => values.add(article.nameOfHouse))
    return Array.from(values).filter(Boolean).sort()
  }, [safeArticles])

  const meetings = useMemo(() => {
    const values = new Set<string>()
    safeArticles.forEach((article) => values.add(article.nameOfMeeting))
    return Array.from(values).filter(Boolean).sort()
  }, [safeArticles])

  const keywordStats = useMemo<KeywordStat[]>(() => buildKeywordStats(safeArticles), [safeArticles])
  const participantStats = useMemo<ParticipantStat[]>(() => buildParticipantStats(safeArticles), [safeArticles])
  const personInsight = useMemo<PersonInsight | null>(
    () => buildPersonInsight(selectedPerson, safeArticles),
    [selectedPerson, safeArticles],
  )

  const filteredArticles = useMemo(() => {
    const matches = safeArticles.filter((article) => {
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const searchWords = normalizedSearch ? normalizedSearch.split(/[,\s]+/).filter(Boolean) : []

      const searchMatch =
        searchWords.length === 0 ||
        searchWords.every((word) => {
          return (
            article.title.toLowerCase().includes(word) ||
              article.description.toLowerCase().includes(word) ||
              article.nameOfHouse.toLowerCase().includes(word) ||
              article.nameOfMeeting.toLowerCase().includes(word) ||
              article.categories.some((category) => category.toLowerCase().includes(word)) ||
              article.keywords.some((keyword) => keyword.keyword.toLowerCase().includes(word)) ||
              article.participants.some((participant) => participant.name.toLowerCase().includes(word))
          )
        })

      const categoryMatch = selectedCategory === "all" || article.categories.includes(selectedCategory)
      const houseMatch = selectedHouse === "all" || article.nameOfHouse === selectedHouse
      const meetingMatch = selectedMeeting === "all" || article.nameOfMeeting === selectedMeeting
      const articleDate = new Date(article.date)
      const withinCustomRange = isWithinCustomRange(articleDate, dateStart, dateEnd)

      return searchMatch && categoryMatch && houseMatch && meetingMatch && withinCustomRange
    })

    return matches.sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return sortOrder === "date_desc" ? bTime - aTime : aTime - bTime
    })
  }, [safeArticles, searchTerm, selectedCategory, selectedHouse, selectedMeeting, dateStart, dateEnd, sortOrder])

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedHouse !== "all" ||
    selectedMeeting !== "all" ||
    dateStart !== undefined ||
    dateEnd !== undefined ||
    sortOrder !== "date_desc"

  const activeFilterCount = [
    searchTerm.trim() !== "",
    selectedCategory !== "all",
    selectedHouse !== "all",
    selectedMeeting !== "all",
    dateStart !== undefined,
    dateEnd !== undefined,
    sortOrder !== "date_desc",
  ].filter(Boolean).length

  const featuredArticle = filteredArticles[0]
  const latestArticles = filteredArticles.slice(1, 5)
  const gridArticles = useMemo(() => {
    return hasActiveFilters || filteredArticles.length <= 4 ? filteredArticles : filteredArticles.slice(4)
  }, [filteredArticles, hasActiveFilters])
  const visibleGridArticles = useMemo(
    () => gridArticles.slice(0, gridVisibleCount),
    [gridArticles, gridVisibleCount],
  )
  const canLoadMore = gridArticles.length > gridVisibleCount

  useEffect(() => {
    setGridVisibleCount(GRID_PAGE_SIZE)
  }, [
    searchTerm,
    selectedCategory,
    selectedHouse,
    selectedMeeting,
    dateStart,
    dateEnd,
    sortOrder,
    hasActiveFilters,
    filteredArticles,
  ])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!searchInputValue.trim()) return
    const normalized = normalizeWords(searchInputValue)
    setSearchInputValue(normalized)
    setSearchTerm(normalized)
  }

  function handleSuggestionSelect(value: string) {
    const normalized = normalizeWords(value)
    setSearchTerm(normalized)
    setSearchInputValue(normalized)
    setSelectedPerson(null)
    setSuggestions([])
  }

  function handleCategoryClick(category: string) {
    setSelectedCategory(category)
    focusSearchSection()
  }

  function handleHouseClick(house: string) {
    setSelectedHouse(house)
    focusSearchSection()
  }

  function handleMeetingClick(meeting: string) {
    setSelectedMeeting(meeting)
    focusSearchSection()
  }

  function handleParticipantClick(participant: string) {
    setSelectedPerson(participant)
    setSearchTerm(participant)
    setSearchInputValue(participant)
    focusSearchSection()
  }

  function handleKeywordClick(keyword: string) {
    setSearchTerm(keyword)
    setSearchInputValue(keyword)
    setSelectedPerson(null)
    focusSearchSection()
  }

  function handleDateStartChange(value: Date | undefined | null) {
    const nextValue = value ?? undefined
    setDateStart(nextValue)
    focusSearchSection()
  }

  function handleDateEndChange(value: Date | undefined | null) {
    const nextValue = value ?? undefined
    setDateEnd(nextValue)
    focusSearchSection()
  }

  function handleSortOrderChange(value: SearchFilters["sort"]) {
    setSortOrder(value)
    focusSearchSection()
  }

  function handleLoadMore() {
    setGridVisibleCount((count) => count + GRID_PAGE_SIZE)
  }

  function handleClearFilters() {
    setSearchTerm("")
    setSearchInputValue("")
    setSelectedCategory("all")
    setSelectedHouse("all")
    setSelectedMeeting("all")
    setDateStart(undefined)
    setDateEnd(undefined)
    setSelectedPerson(null)
    setSortOrder("date_desc")
    setSuggestions([])
    if (typeof window !== "undefined") {
      localStorage.removeItem(FILTER_STORAGE_KEY)
    }
  }

  const filterOptions = {
    categories,
    houses,
    meetings,
  }

  const filters = {
    selectedCategory,
    selectedHouse,
    selectedMeeting,
    dateStart,
    dateEnd,
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HomeHeader showAbout={showAbout} onToggleAbout={() => setShowAbout((value) => !value)} />
      <AboutPanel isOpen={showAbout} />
      <HeroSection />
      <SearchControls
        searchTerm={searchInputValue}
        onSearchTermChange={setSearchInputValue}
        onSubmit={handleSubmit}
        onTypingStart={() => setIsTyping(true)}
        onTypingEnd={() => setIsTyping(false)}
        suggestions={suggestions}
        onSuggestionSelect={handleSuggestionSelect}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((value) => !value)}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        filters={filters}
        filterOptions={filterOptions}
        onChangeCategory={handleCategoryClick}
        onChangeHouse={handleHouseClick}
        onChangeMeeting={handleMeetingClick}
        onChangeDateStart={handleDateStartChange}
        onChangeDateEnd={handleDateEndChange}
        sortOrder={sortOrder}
        onChangeSortOrder={handleSortOrderChange}
      />

      <div className="flex-1 space-y-12 bg-background py-10">
        <div className="space-y-12 px-4 sm:px-6">
          {hasActiveFilters && (
            <ActiveFilterSummary
              totalCount={safeArticles.length}
              filteredCount={filteredArticles.length}
              searchTerm={searchTerm}
              showClearButton={filteredArticles.length === 0}
              onClearFilters={handleClearFilters}
            />
          )}

          <PersonInsightCard
            selectedPerson={selectedPerson}
            insight={personInsight}
            onKeywordClick={handleKeywordClick}
          />

          <FeaturedArticleCard
            article={featuredArticle}
            onCategoryClick={handleCategoryClick}
            onParticipantClick={handleParticipantClick}
            onKeywordClick={handleKeywordClick}
            onHouseClick={handleHouseClick}
            onMeetingClick={handleMeetingClick}
            onNavigate={(path) => router.push(path)}
          />

          <LatestArticlesRow
            articles={latestArticles}
            onCategoryClick={handleCategoryClick}
            onParticipantClick={handleParticipantClick}
            onKeywordClick={handleKeywordClick}
            onHouseClick={handleHouseClick}
            onMeetingClick={handleMeetingClick}
            onNavigate={(path) => router.push(path)}
          />

          {!searchTerm && !hasActiveFilters && (
            <>
              <KeywordTrends stats={keywordStats} onKeywordClick={handleKeywordClick} />
              <KeyParticipants stats={participantStats} onParticipantClick={handleParticipantClick} />
            </>
          )}

          <ArticleGridSection
            title={hasActiveFilters ? "検索結果" : "すべての審議"}
            articles={visibleGridArticles}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onCategoryClick={handleCategoryClick}
            onParticipantClick={handleParticipantClick}
            onKeywordClick={handleKeywordClick}
            onHouseClick={handleHouseClick}
            onMeetingClick={handleMeetingClick}
            onNavigate={(path) => router.push(path)}
            canLoadMore={canLoadMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

function isWithinCustomRange(date: Date, start?: Date, end?: Date): boolean {
  const timestamp = date.getTime()
  if (start) {
    const startTime = new Date(start)
    startTime.setHours(0, 0, 0, 0)
    if (timestamp < startTime.getTime()) {
      return false
    }
  }
  if (end) {
    const endTime = new Date(end)
    endTime.setHours(23, 59, 59, 999)
    if (timestamp > endTime.getTime()) {
      return false
    }
  }
  return true
}


type ActiveFilterSummaryProps = {
  totalCount: number
  filteredCount: number
  searchTerm: string
  showClearButton: boolean
  onClearFilters: () => void
}

function ActiveFilterSummary({
  totalCount,
  filteredCount,
  searchTerm,
  showClearButton,
  onClearFilters,
}: ActiveFilterSummaryProps) {
  return (
    <div className="flex flex-col gap-2 rounded-none border-b bg-card/50 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
      <span>
        {totalCount} 件中 {filteredCount} 件を表示
        {searchTerm && (
          <>
            {" "}
            — 「<span className="font-semibold text-foreground">{searchTerm}</span>」の検索結果
          </>
        )}
      </span>
      {showClearButton && (
        <button
          type="button"
          className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          onClick={onClearFilters}
        >
          フィルターをクリア
        </button>
      )}
    </div>
  )
}
