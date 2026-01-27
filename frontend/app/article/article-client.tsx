'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Article, ArticleAssetData } from "@shared/types/article"
import { fetchArticle, fetchArticleAsset } from "@/lib/api"
import { ArticleMeta } from "@/components/articles/article-meta"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DialogViewer, type Dialog as TranscriptDialog } from "@/components/dialog-viewer"
import { Markdown } from "@/components/markdown"
import { Quote, Users, Tag, BookOpen, MessageSquare, Loader2, CheckCircle2 } from "lucide-react"

type Props = {
  issueId: string
}

export function ArticleClient({ issueId }: Props) {
  const [article, setArticle] = useState<Article | null>(null)
  const [assetData, setAssetData] = useState<ArticleAssetData | null>(null)
  const [assetLoading, setAssetLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArticle(issueId)
      .then((response) => {
        setArticle(response.article)
        setError(null)

        // Fetch asset data from R2 if assetUrl is available
        if (response.article.assetUrl) {
          setAssetLoading(true)
          fetchArticleAsset(response.article.assetUrl)
            .then((data) => {
              if (data) {
                setAssetData(data)
              }
            })
            .finally(() => setAssetLoading(false))
        }
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

  // Merge asset data with article (asset takes precedence if available)
  const mergedArticle: Article = {
    ...article,
    summary: assetData?.summary ?? article.summary,
    soft_language_summary: assetData?.soft_language_summary ?? article.soft_language_summary,
    middle_summary: assetData?.middle_summary ?? article.middle_summary,
    key_points: assetData?.key_points ?? article.key_points ?? [],
    dialogs: assetData?.dialogs ?? article.dialogs,
  }

  const dialogEntries: TranscriptDialog[] = (mergedArticle.dialogs ?? []).map((dialog) => ({
    order: dialog.order,
    speaker: dialog.speaker ?? "発言者不明",
    speaker_group: dialog.position ?? "",
    speaker_position: dialog.position ?? "",
    speaker_role: dialog.position ?? "発言者",
    summary: dialog.summary,
    original_text: dialog.original_text,
    soft_summary: dialog.soft_language,
    reaction: dialog.reaction,
    response_to: [],
  }))

  const hasDialogData = dialogEntries.length > 0
      const summaryText =
        mergedArticle.summary?.summary?.trim() && mergedArticle.summary.summary.length > 0
          ? mergedArticle.summary.summary
          : assetLoading ? "読み込み中..." : "詳細要約はまだ登録されていません。"
    
      const softSummaryText =    mergedArticle.soft_language_summary?.summary?.trim() && mergedArticle.soft_language_summary.summary.length > 0
      ? mergedArticle.soft_language_summary.summary
      : assetLoading ? "読み込み中..." : "簡潔な要約は準備中です。"
  const participantDetails = mergedArticle.participants ?? []
  const hasParticipants = participantDetails.length > 0
  const keywordDetails = mergedArticle.keywords ?? []
  const termDetails = mergedArticle.terms ?? []
  const hasKeywords = keywordDetails.length > 0
  const hasTerms = termDetails.length > 0
  const keyPoints = (mergedArticle.key_points ?? []).map((point) => point.trim()).filter(Boolean)
  const hasKeyPoints = keyPoints.length > 0

  return (
    <article className="space-y-10">
      <ArticleMeta article={mergedArticle} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif">
            <Quote className="h-5 w-5 text-primary" />
            AI要約
            {assetLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-base font-semibold text-foreground">要点</h4>
            {hasKeyPoints ? (
              <ul className="space-y-2">
                {keyPoints.map((point, index) => (
                  <li key={`${point}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {assetLoading ? "読み込み中..." : "要点は準備中です。"}
              </p>
            )}
          </div>
          <div className="border-t pt-4">
            <h4 className="mb-2 text-base font-semibold text-foreground">詳細要約</h4>
            <Markdown content={summaryText} terms={termDetails} />
          </div>
          <div className="border-t pt-4">
            <h4 className="mb-2 text-base font-semibold text-foreground">簡潔要約</h4>
            <Markdown content={softSummaryText} className="italic text-muted-foreground" terms={termDetails} />
          </div>
        </CardContent>
      </Card>

      {hasDialogData ? (
        <DialogViewer dialogs={dialogEntries} title="会議の議事録" terms={termDetails} />
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
