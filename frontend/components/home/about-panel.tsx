import { Brain, Github, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HOME_PROMPT } from "@/lib/home-prompt"

type Props = {
  isOpen: boolean
}

export function AboutPanel({ isOpen }: Props) {
  if (!isOpen) return null

  return (
    <section className="border-b bg-primary/5">
      <div className="w-full px-4 py-6 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              このサイトについて
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              PoliTopics は国会の動きを噛み砕いてお届けする SPA
              です。静的に埋め込まれた最新記事とリアルタイム検索 API を組み合わせ、市民が安心して政治情報にアクセスできる体験を目指しています。
            </p>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Brain className="h-4 w-4" />
                AI サマリーのプロンプト
              </h4>
              <code className="block max-h-64 overflow-y-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {HOME_PROMPT}
              </code>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Github className="h-4 w-4" />
                オープンソース
              </h4>
              <p>このプロジェクトは透明性を重視し、GitHub で公開しています。</p>
              <Button variant="outline" size="sm" asChild className="mt-3">
                <a href="https://github.com/example/parliamentary-news" target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  ソースコードを表示
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
