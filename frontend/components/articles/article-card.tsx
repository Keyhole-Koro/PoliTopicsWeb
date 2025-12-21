import Link from "next/link"
import type { ArticleSummary } from "@shared/types/article"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatAsDate } from "@/lib/format"

type Props = {
  article: ArticleSummary
}

export function ArticleCard({ article }: Props) {
  return (
    <Card className="border-foreground/10 shadow-none">
      <CardHeader>
        <Badge variant="outline" className="w-fit">
          {article.categories[0] ?? "その他"}
        </Badge>
        <CardTitle className="mt-3 text-xl leading-tight">
          <Link href={`/article/${encodeURIComponent(article.id)}`} className="hover:underline">
            {article.title}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{formatAsDate(article.date)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-4">{article.description}</p>
        <div className="flex flex-wrap gap-2">
          {article.keywords.slice(0, 3).map((keyword) => (
            <Badge key={keyword.keyword} variant="secondary">
              #{keyword.keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
