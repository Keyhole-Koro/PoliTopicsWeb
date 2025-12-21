'use client'

import { Suspense, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { HomeClient } from "../home-client"
import { ArticleClient } from "../article/article-client"
import { SearchPageClient } from "../search/search-page-client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type RouteMatch =
  | { kind: "home" }
  | { kind: "article"; id: string }
  | { kind: "search" }
  | { kind: "not-found" }

function parsePath(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return { kind: "home" }
  }

  if (segments[0] === "article" && segments.length === 2) {
    return { kind: "article", id: segments[1] }
  }

  if (segments[0] === "search" && segments.length === 1) {
    return { kind: "search" }
  }

  return { kind: "not-found" }
}

export function CatchAllClient() {
  const pathname = usePathname() ?? "/"
  const match = useMemo(() => parsePath(pathname), [pathname])

  if (match.kind === "home") {
    return (
      <main className="min-h-screen bg-background">
        <HomeClient />
      </main>
    )
  }

  if (match.kind === "article") {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-card/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                ニュース一覧に戻る
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="font-serif text-base font-semibold text-foreground">国会議事録ニュース</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto max-w-4xl px-4 py-10">
          <ArticleClient issueId={match.id} />
        </main>
      </div>
    )
  }

  if (match.kind === "search") {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">記事検索</h1>
          </div>
          <Suspense fallback={null}>
            <SearchPageClient />
          </Suspense>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">ページが見つかりませんでした</h1>
        <p className="text-sm text-muted-foreground">URLを確認してもう一度お試しください。</p>
        <Button asChild>
          <Link href="/">トップに戻る</Link>
        </Button>
      </div>
    </main>
  )
}
