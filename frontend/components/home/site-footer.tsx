import { MessageSquare } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/50">
      <div className="flex w-full flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">国会議事録ニュース</span>
        </div>
      </div>
    </footer>
  )
}
