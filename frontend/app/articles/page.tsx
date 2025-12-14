'use client'

import Link from "next/link"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, MessageSquare } from "lucide-react"
import { ArticleClient } from "./article-client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ArticlesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const issueId = searchParams?.get("issueID") ?? undefined

  useEffect(() => {
    if (!issueId) {
      router.replace("/")
    }
  }, [issueId, router])

  if (!issueId) {
    return null
  }

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
        <ArticleClient issueId={issueId} />
      </main>
    </div>
  )
}
