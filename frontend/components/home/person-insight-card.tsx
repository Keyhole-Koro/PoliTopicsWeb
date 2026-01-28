import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { PersonInsight } from "@/lib/home-utils"
import { Markdown } from "@/components/markdown"

type Props = {
  selectedPerson: string | null
  insight: PersonInsight | null
  onKeywordClick: (keyword: string) => void
}

export function PersonInsightCard({ selectedPerson, insight, onKeywordClick }: Props) {
  if (!selectedPerson || !insight) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          {selectedPerson} の登場データ
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">登場回数</h4>
          <p className="text-2xl font-semibold text-primary">{insight.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">このデータベース内での登場数</p>
          {insight.meetings.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-foreground">主な会議</p>
              <div className="flex flex-wrap gap-1">
                {insight.meetings.map((meeting) => (
                  <Badge key={meeting} variant="outline" className="text-xs">
                    {meeting}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {insight.latest && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">最新の記事</h4>
            <p className="text-sm font-medium text-foreground">{insight.latest.title}</p>
            <Markdown
              content={insight.latest.description}
              className="mt-2 text-[11px] sm:text-[11px] line-clamp-3"
              tone="muted"
            />
            <Button variant="ghost" size="sm" className="mt-3" asChild>
              <Link href={`/article/${encodeURIComponent(insight.latest.id)}`}>記事を読む</Link>
            </Button>
          </div>
        )}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">関連キーワード</h4>
          <div className="flex flex-wrap gap-1">
            {insight.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="cursor-pointer text-xs"
                onClick={() => onKeywordClick(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
