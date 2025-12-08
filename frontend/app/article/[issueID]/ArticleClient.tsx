'use client'

import { useEffect, useState } from "react"
import type { Article } from "@shared/types/article"
import { fetchArticle } from "@/lib/api"
import { ArticleMeta } from "@/components/articles/article-meta"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

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
      <div className="space-y-4">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="outline" asChild>
          <Link href="/">トップページに戻る</Link>
        </Button>
      </div>
    )
  }

  if (!article) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <article className="space-y-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            記事一覧へ
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">ISSUE ID: {article.id}</span>
      </div>
      <div className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Article</p>
        <h1 className="text-4xl font-semibold">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.description}</p>
      </div>
      <ArticleMeta article={article} />
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">要点</h2>
        <p className="text-base leading-relaxed">{article.summary}</p>
        <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">{article.soft_summary}</div>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">登場人物</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(article.participants_detail ?? []).map((participant) => (
            <li key={participant.name} className="rounded-lg border border-foreground/10 p-3">
              <p className="font-medium">{participant.name}</p>
              <p className="text-sm text-muted-foreground">{participant.summary}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">関連用語</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {article.terms.map((term) => (
            <li key={term}>・{term}</li>
          ))}
        </ul>
      </section>
    </article>
  )
}
