import { searchArticles } from "@shared/article-data"
import { HomeClient } from "./home-client"

export default function Page() {
  const articles = searchArticles({ limit: Number.MAX_SAFE_INTEGER })

  return (
    <main className="min-h-screen bg-background">
      <HomeClient articles={articles} />
    </main>
  )
}
