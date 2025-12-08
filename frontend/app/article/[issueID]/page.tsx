import { ArticleClient } from "./ArticleClient"
import { getStaticArticleParams } from "@/lib/static-params"

export function generateStaticParams() {
  return getStaticArticleParams().map((item) => ({ issueID: item.issueID }))
}

export default function ArticlePage({ params }: { params: { issueID: string } }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ArticleClient issueId={params.issueID} />
      </div>
    </main>
  )
}
