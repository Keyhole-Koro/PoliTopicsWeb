import type React from "react"
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
  dateRange: string
  selectedDate?: Date
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
  onChangeDateRange: (value: string) => void
  onChangeDate: (date: Date | undefined) => void
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
  onChangeDateRange,
  onChangeDate,
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
        </div>

        {showFilters && (
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
                <DateRangeSelect value={filters.dateRange} onChange={onChangeDateRange} />
                <DatePicker value={filters.selectedDate} onChange={onChangeDate} />
              </div>
            </CardContent>
          </Card>
        )}
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

type DateRangeSelectProps = {
  value: string
  onChange: (value: string) => void
}

function DateRangeSelect({ value, onChange }: DateRangeSelectProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">期間</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="期間" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="1week">過去1週間</SelectItem>
          <SelectItem value="1month">過去1ヶ月</SelectItem>
          <SelectItem value="3months">過去3ヶ月</SelectItem>
          <SelectItem value="6months">過去6ヶ月</SelectItem>
          <SelectItem value="1year">過去1年</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

type DatePickerProps = {
  value?: Date
  onChange: (date: Date | undefined) => void
}

function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">日付</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 text-left font-normal">
            <CalendarIcon className="h-4 w-4" />
            {value ? format(value, "yyyy/MM/dd", { locale: ja }) : "日付を選択"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} locale={ja} initialFocus />
          {value && (
            <div className="border-t p-3">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange(undefined)}>
                日付をクリア
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
