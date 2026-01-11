import type { Article } from "@shared/types/article"
import { Badge } from "@/components/ui/badge"
import { formatAsDate } from "@/lib/format"
import { Calendar, Hash, Building, Users, Clock } from "lucide-react"

type Props = {
  article: Article
}

export function ArticleMeta({ article }: Props) {
  const meetingType = article.imageKind

  const categories = article.categories ?? []
  const primaryCategory = categories[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          {primaryCategory ? (
            <Badge key={primaryCategory} className="bg-primary/10 text-primary">
              {primaryCategory}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formatAsDate(article.date)}
        </div>
        {article.session ? (
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            第{article.session}回国会
          </div>
        ) : null}
        <Badge variant="outline" className="text-xs uppercase tracking-[0.2em]">
          ISSUE {article.id}
        </Badge>
      </div>

      <h1 className="text-4xl font-serif font-bold leading-tight text-foreground">{article.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {article.nameOfHouse ? (
          <div className="flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            {article.nameOfHouse}
          </div>
        ) : null}
        {article.nameOfMeeting ? (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {article.nameOfMeeting}
          </div>
        ) : null}
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {meetingType}
        </div>
      </div>

      {article.description ? (
        <p className="text-lg leading-relaxed text-muted-foreground">{article.description}</p>
      ) : null}
    </div>
  )
}
