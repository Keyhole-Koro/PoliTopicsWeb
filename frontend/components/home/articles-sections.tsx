import type { ArticleSummary } from "@shared/types/article"
import { CalendarIcon, Clock, MessageSquare, Search, Target, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CommonHandlers = {
  onCategoryClick: (category: string) => void
  onParticipantClick: (participant: string) => void
  onKeywordClick: (keyword: string) => void
  onHouseClick: (house: string) => void
  onMeetingClick: (meeting: string) => void
  onNavigate: (path: string) => void
}

type FeaturedProps = CommonHandlers & {
  article?: ArticleSummary
}

export function FeaturedArticleCard({
  article,
  onCategoryClick,
  onParticipantClick,
  onMeetingClick,
  onNavigate,
}: FeaturedProps) {
  if (!article) return null

  const category = article.categories?.[0]

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-accent" />
        <h2 className="text-2xl font-semibold text-foreground">ピックアップ</h2>
      </div>
      <Card
        className="overflow-hidden transition-shadow hover:shadow-lg"
        onClick={() => onNavigate(`/article/${article.id}`)}
      >
        <div className="md:flex">
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 md:w-1/3">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-primary" />
              <p className="text-xs text-muted-foreground">{article.imageKind}</p>
            </div>
          </div>
          <div className="space-y-4 p-6 md:w-2/3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {category && (
                <Badge variant="secondary" className="cursor-pointer bg-primary/10 text-primary" onClick={(event) => handleEvent(event, () => onCategoryClick(category))}>
                  {category}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(article.date).toLocaleDateString("ja-JP")}
              </div>
              {article.nameOfHouse && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {article.nameOfHouse}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{article.title}</h3>
            <p className="text-sm text-muted-foreground">{article.description}</p>
            <div className="flex flex-wrap gap-2">
              {(article.participants ?? []).slice(0, 3).map((participant) => (
                <Badge
                  key={participant.name}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={(event) => handleEvent(event, () => onParticipantClick(participant.name))}
                >
                  {participant.name}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between">
              {article.nameOfMeeting && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={(event) => handleEvent(event, () => onMeetingClick(article.nameOfMeeting))}
                >
                  {article.nameOfMeeting}
                </button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={(event) => handleEvent(event, () => onNavigate(`/article/${article.id}`))}
              >
                詳細を読む
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

type LatestProps = CommonHandlers & {
  articles: ArticleSummary[]
}

export function LatestArticlesRow({ articles, onCategoryClick, onKeywordClick, onNavigate }: LatestProps) {
  if (articles.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-semibold text-foreground">最新の審議</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => {
          const category = article.categories?.[0]
          return (
            <Card key={article.id} className="flex h-full flex-col justify-between" onClick={() => onNavigate(`/article/${article.id}`)}>
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {category && (
                    <Badge
                      variant="outline"
                      className="cursor-pointer"
                      onClick={(event) => handleEvent(event, () => onCategoryClick(category))}
                    >
                      {category}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(article.date).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <CardTitle className="text-base">{article.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{article.description}</p>
                <div className="flex flex-wrap gap-1">
                  {(article.keywords ?? []).slice(0, 2).map((keyword) => (
                    <Badge
                      key={keyword.keyword}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={(event) => handleEvent(event, () => onKeywordClick(keyword.keyword))}
                    >
                      {keyword.keyword}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit"
                  onClick={(event) => handleEvent(event, () => onNavigate(`/article/${article.id}`))}
                >
                  詳細
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

type GridProps = CommonHandlers & {
  title: string
  articles: ArticleSummary[]
  hasActiveFilters: boolean
  onClearFilters: () => void
  canLoadMore: boolean
  onLoadMore: () => void
}

export function ArticleGridSection({
  title,
  articles,
  hasActiveFilters,
  onClearFilters,
  canLoadMore,
  onLoadMore,
  onCategoryClick,
  onParticipantClick,
  onKeywordClick,
  onHouseClick,
  onMeetingClick,
  onNavigate,
}: GridProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-1 rounded-full bg-primary" />
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10" />
            <p>条件に一致する記事が見つかりませんでした。</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                フィルターをリセット
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const category = article.categories?.[0]
              return (
                <Card
                  key={article.id}
                  className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg"
                  onClick={() => onNavigate(`/article/${article.id}`)}
                >
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="hover:text-primary"
                      onClick={(event) => handleEvent(event, () => article.nameOfMeeting && onMeetingClick(article.nameOfMeeting))}
                    >
                      {article.nameOfMeeting || "会議情報なし"}
                    </button>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(article.date).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <CardHeader>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {category && (
                        <Badge
                          variant="outline"
                          className="cursor-pointer"
                          onClick={(event) => handleEvent(event, () => onCategoryClick(category))}
                        >
                          {category}
                        </Badge>
                      )}
                      {article.nameOfHouse && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={(event) => handleEvent(event, () => onHouseClick(article.nameOfHouse))}
                        >
                          {article.nameOfHouse}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-4">{article.description}</p>
                    <div className="space-y-2 text-xs">
                      {(article.participants?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1 font-semibold text-foreground">主な発言者</p>
                          <div className="flex flex-wrap gap-1">
                            {(article.participants ?? []).slice(0, 2).map((participant) => (
                              <Badge
                                key={participant.name}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={(event) => handleEvent(event, () => onParticipantClick(participant.name))}
                              >
                                {participant.name}
                              </Badge>
                            ))}
                            {(article.participants?.length ?? 0) > 2 && (
                              <Badge variant="outline" className="text-muted-foreground">
                                +{(article.participants?.length ?? 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {(article.keywords?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1 font-semibold text-foreground">議題</p>
                          <div className="flex flex-wrap gap-1">
                            {(article.keywords ?? []).slice(0, 3).map((keyword) => (
                              <Badge
                                key={keyword.keyword}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={(event) => handleEvent(event, () => onKeywordClick(keyword.keyword))}
                              >
                                {keyword.keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        第{article.session ?? "-"}回国会
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => handleEvent(event, () => onNavigate(`/article/${article.id}`))}
                      >
                        詳細
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {canLoadMore && (
            <div className="flex justify-center pt-6">
              <Button variant="outline" size="lg" onClick={onLoadMore}>
                もっと見る
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function handleEvent(event: React.MouseEvent, callback: () => void) {
  event.stopPropagation()
  callback()
}
