import type { Article } from "@shared/types/article"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatAsDate } from "@/lib/format"

type Props = {
  article: Article
}

export function ArticleMeta({ article }: Props) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-card/50 p-4 space-y-3">
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <span>{formatAsDate(article.date)}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{article.nameOfHouse}</span>
        <Separator orientation="vertical" className="h-4" />
        <span>{article.nameOfMeeting}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {article.categories.map((category) => (
          <Badge key={category} variant="secondary">
            {category}
          </Badge>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        <p>Session: {article.session}</p>
      </div>
    </div>
  )
}
