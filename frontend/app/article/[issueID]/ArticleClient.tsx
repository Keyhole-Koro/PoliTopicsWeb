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
    original_text: dialog.summary,
    soft_summary: dialog.soft_language ?? dialog.summary,
    reaction: dialog.reaction,
    response_to: [],
  }))

  const hasDialogData = dialogEntries.length > 0
  const summaryText =
    article.summary?.summary?.trim() && article.summary.summary.length > 0
      ? article.summary.summary
      : "詳細要約はまだ登録されていません。"
  const softSummaryText =
    article.soft_summary?.summary?.trim() && article.soft_summary.summary.length > 0
      ? article.soft_summary.summary
      : "簡潔な要約は準備中です。"
  const participantDetails = article.participants ?? []
  const hasParticipants = participantDetails.length > 0
  const hasKeywords = article.keywords.length > 0
  const hasTerms = article.terms.length > 0

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
            <p className="leading-relaxed text-muted-foreground">{summaryText}</p>
          </div>
          <div className="border-t pt-4">
            <h4 className="mb-2 text-base font-semibold text-foreground">簡潔要約</h4>
            <p className="text-sm italic text-muted-foreground">{softSummaryText}</p>
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
            主要な参加者
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasParticipants ? (
            <div className="grid gap-4 md:grid-cols-2">
              {participantDetails.map((participant) => {
                return (
                  <div key={participant.name} className="rounded-lg bg-muted/40 p-4">
                    <p className="font-semibold text-foreground">{participant.name}</p>
                    <p className="text-sm text-muted-foreground">{participant.summary}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">参加者の詳細情報はまだ登録されていません。</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Tag className="h-5 w-5 text-primary" />
              主要なトピック
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasKeywords ? (
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword) => (
                  <Badge key={keyword.keyword} variant="secondary" className="rounded-full">
                    {keyword.keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">キーワード情報はまだありません。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <BookOpen className="h-5 w-5 text-primary" />
              重要な用語
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTerms ? (
              <div className="space-y-3">
                {article.terms.map((term) => (
                  <div key={term.term} className="rounded-lg bg-muted/40 p-3">
                    <p className="text-sm font-semibold text-foreground">{term.term}</p>
                    {term.definition ? (
                      <p className="text-xs text-muted-foreground mt-1">{term.definition}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">関連用語はまだ登録されていません。</p>
            )}
          </CardContent>
        </Card>
      </div>
    </article>
  )
}
