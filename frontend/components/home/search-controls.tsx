import type React from "react"
import type { SearchFilters } from "@shared/types/article"
import { CalendarIcon, Filter, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { SearchSuggestions } from "@/components/search/search-suggestions"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

type FilterOptions = {
  categories: string[]
  houses: string[]
  meetings: string[]
}

type Filters = {
  selectedCategory: string
  selectedHouse: string
  selectedMeeting: string
  dateStart?: Date
  dateEnd?: Date
}

type Props = {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onTypingStart: () => void
  onTypingEnd: () => void
  suggestions: string[]
  onSuggestionSelect: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  activeFilterCount: number
  onClearFilters: () => void
  filters: Filters
  filterOptions: FilterOptions
  onChangeCategory: (value: string) => void
  onChangeHouse: (value: string) => void
  onChangeMeeting: (value: string) => void
  onChangeDateStart: (date: Date | undefined) => void
  onChangeDateEnd: (date: Date | undefined) => void
  sortOrder: SearchFilters["sort"]
  onChangeSortOrder: (value: SearchFilters["sort"]) => void
}

export function SearchControls({
  searchTerm,
  onSearchTermChange,
  onSubmit,
  onTypingStart,
  onTypingEnd,
  suggestions,
  onSuggestionSelect,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  onClearFilters,
  filters,
  filterOptions,
  onChangeCategory,
  onChangeHouse,
  onChangeMeeting,
  onChangeDateStart,
  onChangeDateEnd,
  sortOrder,
  onChangeSortOrder,
}: Props) {
  return (
    <section id="search-section" className="border-b bg-background py-10">
      <div className="w-full space-y-6 px-4 sm:px-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              onFocus={onTypingStart}
              onBlur={() => setTimeout(onTypingEnd, 200)}
              placeholder="議員名、キーワード、議題で検索..."
              className="h-14 rounded-none border-x-0 border-t-0 border-b-2 border-border pl-12 text-base focus-visible:border-primary focus-visible:ring-0"
            />
            <SearchSuggestions suggestions={suggestions} onSelect={onSuggestionSelect} />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={onToggleFilters}>
            <Filter className="h-4 w-4" />
            フィルター
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={onClearFilters}>
              <X className="h-4 w-4" />
              クリア
            </Button>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>並び替え</span>
            <Select value={sortOrder} onValueChange={(value) => onChangeSortOrder(value as SearchFilters["sort"])}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">新しい順</SelectItem>
                <SelectItem value="date_asc">古い順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          aria-hidden={!showFilters}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
            showFilters ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FilterSelect
                  label="カテゴリー"
                  value={filters.selectedCategory}
                  onChange={onChangeCategory}
                  options={filterOptions.categories}
                />
                <FilterSelect
                  label="院"
                  value={filters.selectedHouse}
                  onChange={onChangeHouse}
                  options={filterOptions.houses}
                />
                <FilterSelect
                  label="会議"
                  value={filters.selectedMeeting}
                  onChange={onChangeMeeting}
                  options={filterOptions.meetings}
                />
                <DatePicker label="開始日" value={filters.dateStart} onChange={onChangeDateStart} />
                <DatePicker label="終了日" value={filters.dateEnd} onChange={onChangeDateEnd} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`${label}を選択`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type DatePickerProps = {
  label: string
  value?: Date
  onChange: (date: Date | undefined) => void
}

function DatePicker({ label, value, onChange }: DatePickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 text-left font-normal">
            <CalendarIcon className="h-4 w-4" />
            {value ? format(value, "yyyy/MM/dd", { locale: ja }) : `${label}を選択`}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} locale={ja} initialFocus />
          {value && (
            <div className="border-t p-3">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange(undefined)}>
                クリア
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
