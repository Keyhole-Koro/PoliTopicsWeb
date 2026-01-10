'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Article } from "@shared/types/article"
import { fetchArticle } from "@/lib/api"
import { ArticleMeta } from "@/components/articles/article-meta"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DialogViewer, type Dialog as TranscriptDialog } from "@/components/dialog-viewer"
import { Markdown } from "@/components/markdown"
import { Quote, Users, Tag, BookOpen, MessageSquare } from "lucide-react"

type Props = {
  issueId: string
}

export function ArticleClient({ issueId }: Props) {
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArticle(issueId)
      .then((response) => {
        setArticle(response.article)
        setError(null)
      })
      .catch(() => setError("記事を取得できませんでした"))
  }, [issueId])

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/">トップページに戻る</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!article) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  const dialogEntries: TranscriptDialog[] = (article.dialogs ?? []).map((dialog) => ({
    order: dialog.order,
    speaker: dialog.speaker ?? "発言者不明",
    speaker_group: dialog.position ?? "所属情報未設定",
    speaker_position: dialog.position ?? "所属情報未設定",
    speaker_role: dialog.position ?? "発言者",
    summary: dialog.summary,
    original_text: dialog.original_text,
    soft_summary: dialog.soft_language,
    reaction: dialog.reaction,
    response_to: [],
  }))

  const hasDialogData = dialogEntries.length > 0
  const summaryText =
    article.summary?.summary?.trim() && article.summary.summary.length > 0
      ? article.summary.summary
      : "詳細要約はまだ登録されていません。"
  const softSummaryText =
    article.soft_language_summary?.summary?.trim() && article.soft_language_summary.summary.length > 0
      ? article.soft_language_summary.summary
      : "簡潔な要約は準備中です。"
  const participantDetails = article.participants ?? []
  const hasParticipants = participantDetails.length > 0
  const keywordDetails = article.keywords ?? []
  const termDetails = article.terms ?? []
  const hasKeywords = keywordDetails.length > 0
  const hasTerms = termDetails.length > 0

  return (
    <article className="space-y-10">
      <ArticleMeta article={article} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Quote className="h-5 w-5 text-primary" />
            AI要約
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">詳細要約</h4>
            <Markdown content={summaryText} />
          </div>
          <div className="border-t pt-4">
            <h4 className="mb-2 text-base font-semibold text-foreground">簡潔要約</h4>
            <Markdown content={softSummaryText} className="italic text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {hasDialogData ? (
        <DialogViewer dialogs={dialogEntries} title="会議の議事録" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <MessageSquare className="h-5 w-5 text-primary" />
              会議の議事録
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">議事録データは現在準備中です。</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Users className="h-5 w-5 text-primary" />
            登場人物
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasParticipants ? (
            <div className="space-y-3">
              {participantDetails.map((participant) => (
                <div key={participant.name} className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0">
                  <p className="font-semibold text-foreground">{participant.name}</p>
                  {participant.position && <p className="text-xs text-muted-foreground">{participant.position}</p>}
                  <p className="text-sm text-muted-foreground">{participant.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">登場人物のデータは準備中です。</p>
          )}
        </CardContent>
      </Card>

      {hasKeywords && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Tag className="w-5 h-5 text-primary" />
              主要なトピック
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keywordDetails.map((keyword) => (
                <Badge
                  key={keyword.keyword}
                  variant={keyword.priority === "high" ? "default" : "secondary"}
                  className={keyword.priority === "high" ? "bg-primary text-primary-foreground" : ""}
                >
                  {keyword.keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasTerms && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <BookOpen className="h-5 w-5 text-primary" />
              用語集
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {termDetails.map((term) => (
              <div key={term.term} className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{term.term}</p>
                <p className="text-xs leading-snug text-muted-foreground">{term.definition}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </article>
  )
}
