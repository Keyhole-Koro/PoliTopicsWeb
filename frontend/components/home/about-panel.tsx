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
              PoliTopics は国会の動きを噛み砕いてお届けするwebサイトです。https://kokkai.ndl.go.jp/#/を元に、国会議事録のデータを収集し、AIを活用して要約を生成しています。
            </p>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Github className="h-4 w-4" />
                オープンソース
              </h4>
              <p>このプロジェクトは透明性を重視し、GitHub で公開しています。</p>
              <Button variant="outline" size="sm" asChild className="mt-3">
                <a href="https://github.com/Keyhole-Koro/PoliTopicsDataCollection/blob/5e869743712ff0ed8e0c70604050916b3e7471c9/src/prompts/prompts.ts" target="_blank" rel="noreferrer">
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
