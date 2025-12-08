import { TrendingUp, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KeywordStat, ParticipantStat } from "@/lib/home-utils"

type KeywordProps = {
  stats: KeywordStat[]
  onKeywordClick: (keyword: string) => void
}

export function KeywordTrends({ stats, onKeywordClick }: KeywordProps) {
  if (stats.length === 0) return null

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            注目キーワード
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {stats.map((item) => (
            <Badge
              key={item.keyword}
              variant={item.priority === "high" ? "default" : "secondary"}
              className={`cursor-pointer ${
                item.priority === "high"
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-secondary/80"
              }`}
              onClick={() => onKeywordClick(item.keyword)}
            >
              {item.keyword}
              <span className="ml-1 text-xs opacity-70">({item.count})</span>
            </Badge>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

type ParticipantProps = {
  stats: ParticipantStat[]
  onParticipantClick: (name: string) => void
}

export function KeyParticipants({ stats, onParticipantClick }: ParticipantProps) {
  if (stats.length === 0) return null

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            主要な発言者
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.map((participant) => (
            <div key={participant.name} className="flex items-center justify-between">
              <button
                type="button"
                className="text-left text-sm font-semibold text-foreground hover:text-primary"
                onClick={() => onParticipantClick(participant.name)}
              >
                {participant.name}
              </button>
              <Badge variant="outline" className="text-xs">
                {participant.count} 件
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
